/**
 * 导入2025/26学年迎新表格用户数据到PostgreSQL
 * 
 * 此脚本用于将Excel表格中的用户数据导入到PostgreSQL数据库
 * 文件: src/TPMS AY 25_26 Orientation Sign-Up form(1-104).xlsx
 */

const { Pool } = require('pg');
const XLSX = require('xlsx');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// 加载环境变量
dotenv.config();

// PostgreSQL连接配置
if (!process.env.DATABASE_URL) {
  console.error('错误: 未设置DATABASE_URL环境变量');
  console.error('请在.env文件中设置你的PostgreSQL连接字符串，例如:');
  console.error('DATABASE_URL=postgresql://username:password@localhost:5432/tpms_db_pg');
  process.exit(1);
}

const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Excel文件路径
const excelFilePath = path.join(__dirname, '..', 'src', 'TPMS AY 25_26 Orientation Sign-Up form(1-104).xlsx');

// 检查Excel文件是否存在
if (!fs.existsSync(excelFilePath)) {
  console.error(`错误: 找不到Excel文件: ${excelFilePath}`);
  process.exit(1);
}

// 生成随机密码
function generatePassword() {
  // 生成8位随机密码，包含数字和字母
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// 主函数
async function importOrientationUsers() {
  let client;
  
  try {
    console.log('=== 开始导入迎新表格用户数据到PostgreSQL ===');
    
    // 读取Excel文件
    console.log(`\n读取Excel文件: ${excelFilePath}`);
    const workbook = XLSX.readFile(excelFilePath);
    
    // 获取工作表
    const sheetNames = workbook.SheetNames;
    console.log(`工作表名称: ${sheetNames.join(', ')}`);
    
    // 使用第一个工作表
    const worksheet = workbook.Sheets[sheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`从Excel文件中读取了 ${data.length} 条记录`);
    if (data.length === 0) {
      console.error('Excel文件中没有数据!');
      process.exit(1);
    }
    
    // 显示第一条记录的数据结构
    console.log('\nExcel数据结构示例:');
    console.log(Object.keys(data[0]));
    
    // 连接数据库
    console.log('\n连接PostgreSQL数据库...');
    client = await pgPool.connect();
    console.log('数据库连接成功!');
    
    // 开始事务
    await client.query('BEGIN');
    
    // 用于存储结果统计
    const stats = {
      totalProcessed: 0,
      studentsCreated: 0,
      studentsSkipped: 0,
      usersCreated: 0,
      usersUpdated: 0,
      errors: 0
    };
    
    // 读取所有已存在的学生记录，用于快速查找
    const existingStudentsResult = await client.query('SELECT id, index_number FROM students');
    const existingStudents = {};
    for (const row of existingStudentsResult.rows) {
      existingStudents[row.index_number] = row.id;
    }
    
    // 读取所有已存在的用户记录，用于快速查找
    const existingUsersResult = await client.query('SELECT id, username FROM users');
    const existingUsers = {};
    for (const row of existingUsersResult.rows) {
      existingUsers[row.username.toLowerCase()] = row.id;
    }
    
    // 导入用户记录
    console.log('\n开始处理用户数据...');
    
    // 保存所有生成的用户凭据
    const userCredentials = [];
    
    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      stats.totalProcessed++;
      
      // 从Excel中获取学生信息，适配显示的格式
      // 提取邮箱 (电子邮件列)
      const email = record['电子邮件'] || '';
      
      // 提取姓名 (名称列)
      const name = record['名称'] || '';
      
      // 提取学号 (邮件地址中@前面的部分)
      const emailParts = email.split('@');
      let indexNumber = '';
      if (emailParts.length > 0) {
        indexNumber = emailParts[0].trim();
      }
      
      // 提取课程/兴趣 (What kind of games列)
      const course = record['What kind of games are you interested in?'] || '';
      
      // 如果缺少关键信息则跳过
      if (!indexNumber || !name) {
        console.log(`警告: 第 ${i+1} 行记录缺少关键信息，已跳过`);
        stats.studentsSkipped++;
        continue;
      }
      
      try {
        let studentId;
        
        // 检查学生是否已存在
        if (existingStudents[indexNumber]) {
          studentId = existingStudents[indexNumber];
          console.log(`学号为 ${indexNumber} 的学生已存在，ID: ${studentId}`);
          stats.studentsSkipped++;
        } else {
          // 创建新学生记录
          const studentResult = await client.query(
            'INSERT INTO students (name, course, index_number, email, created_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING id',
            [name, course, indexNumber, email]
          );
          
          studentId = studentResult.rows[0].id;
          existingStudents[indexNumber] = studentId; // 更新缓存
          console.log(`已创建新学生: ${name} (${indexNumber}), ID: ${studentId}`);
          stats.studentsCreated++;
        }
        
        // 处理用户账户
        const username = indexNumber.toLowerCase();
        
        // 随机生成密码 (或使用学号作为初始密码)
        // const password = generatePassword();
        const password = indexNumber; // 使用学号作为初始密码
        const passwordHash = await bcrypt.hash(password, 10);
        
        // 检查用户是否已存在
        if (existingUsers[username]) {
          // 更新现有用户密码
          await client.query(
            'UPDATE users SET password_hash = $1 WHERE username = $2',
            [passwordHash, username]
          );
          console.log(`已更新用户 ${username} 的密码`);
          stats.usersUpdated++;
        } else {
          // 创建新用户
          const userResult = await client.query(
            'INSERT INTO users (username, password_hash, student_id, email, role, created_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) RETURNING id',
            [username, passwordHash, studentId, email, 'student']
          );
          
          existingUsers[username] = userResult.rows[0].id; // 更新缓存
          console.log(`已创建新用户: ${username}`);
          stats.usersCreated++;
        }
        
        // 保存用户凭据
        userCredentials.push({
          name: name,
          username: username,
          password: password,
          email: email
        });
        
        // 每处理10条记录打印进度
        if (stats.totalProcessed % 10 === 0) {
          console.log(`已处理 ${stats.totalProcessed}/${data.length} 条记录...`);
        }
        
      } catch (error) {
        console.error(`处理学生 ${name} (${indexNumber}) 时出错:`, error.message);
        stats.errors++;
      }
    }
    
    // 提交事务
    await client.query('COMMIT');
    
    // 打印统计结果
    console.log('\n=== 导入完成 ===');
    console.log(`处理记录总数: ${stats.totalProcessed}`);
    console.log(`创建的学生数: ${stats.studentsCreated}`);
    console.log(`跳过的学生数: ${stats.studentsSkipped}`);
    console.log(`创建的用户数: ${stats.usersCreated}`);
    console.log(`更新的用户数: ${stats.usersUpdated}`);
    console.log(`错误数: ${stats.errors}`);
    
    // 保存用户凭据到文件
    const credentialsPath = path.join(__dirname, 'orientation-users-credentials.json');
    fs.writeFileSync(credentialsPath, JSON.stringify(userCredentials, null, 2));
    console.log(`\n用户凭据已保存到: ${credentialsPath}`);
    
  } catch (error) {
    // 回滚事务
    if (client) {
      await client.query('ROLLBACK');
    }
    
    console.error('导入过程中发生错误:', error.message);
    process.exit(1);
  } finally {
    // 释放客户端
    if (client) {
      client.release();
    }
    
    // 关闭连接池
    await pgPool.end();
    console.log('数据库连接已关闭');
  }
}

// 执行导入
importOrientationUsers().catch(err => {
  console.error('导入过程中发生错误:', err);
  process.exit(1);
}); 