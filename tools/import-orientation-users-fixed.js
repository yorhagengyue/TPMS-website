/**
 * 导入2025/26学年迎新表格用户数据到PostgreSQL (修复版)
 * 
 * 此脚本用于将Excel表格中的用户数据导入到PostgreSQL数据库
 * 文件: src/TPMS AY 25_26 Orientation Sign-Up form(1-104).xlsx
 * 注意: 此版本适配了没有created_at列的数据库结构
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
  console.error('请在命令行设置临时环境变量，例如:');
  console.error('Windows PowerShell: $env:DATABASE_URL="postgresql://用户名:密码@localhost:5432/数据库名"');
  console.error('Windows CMD: set DATABASE_URL=postgresql://用户名:密码@localhost:5432/数据库名');
  console.error('Linux/Mac: export DATABASE_URL=postgresql://用户名:密码@localhost:5432/数据库名');
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
    
    // 检查数据库表结构
    console.log('检查数据库表结构...');
    const tableInfo = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'students'
    `);
    
    const columns = tableInfo.rows.map(row => row.column_name);
    console.log('可用列:', columns.join(', '));
    
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
      // 为每个学生的处理创建一个单独的客户端连接
      const recordClient = await pgPool.connect();
      
      try {
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
        
        // 打印正在处理的学生信息
        console.log(`\n处理学生 ${name} (${indexNumber})`);
        
        // 如果缺少关键信息则跳过
        if (!indexNumber || !name) {
          console.log(`警告: 第 ${i+1} 行记录缺少关键信息，已跳过`);
          stats.studentsSkipped++;
          continue;
        }
        
        // 开始单独的事务
        await recordClient.query('BEGIN');
        
        try {
          let studentId;
          
          // 检查学生是否已存在
          if (existingStudents[indexNumber]) {
            studentId = existingStudents[indexNumber];
            console.log(`学号为 ${indexNumber} 的学生已存在，ID: ${studentId}`);
            stats.studentsSkipped++;
          } else {
            // 创建新学生记录
            // 检查电子邮件格式是否正确
            const validEmail = email.includes('@') ? email : `${indexNumber.toLowerCase()}@student.tp.edu.sg`;
            
            // 处理可能的特殊字符，避免SQL注入
            const sanitizedName = name.replace(/'/g, "''");
            const sanitizedCourse = course.replace(/'/g, "''");
            
            // 不使用created_at列的插入语句
            const studentResult = await recordClient.query(
              'INSERT INTO students (name, course, index_number, email) VALUES ($1, $2, $3, $4) RETURNING id',
              [sanitizedName, sanitizedCourse, indexNumber, validEmail]
            );
            
            studentId = studentResult.rows[0].id;
            existingStudents[indexNumber] = studentId; // 更新缓存
            console.log(`已创建新学生: ${name} (${indexNumber}), ID: ${studentId}`);
            stats.studentsCreated++;
          }
          
          // 处理用户账户
          const username = indexNumber.toLowerCase();
          
          // 使用学号作为初始密码
          const password = indexNumber;
          const passwordHash = await bcrypt.hash(password, 10);
          
          // 验证电子邮件格式
          const validEmail = email.includes('@') ? email : `${username}@student.tp.edu.sg`;
          
          // 检查用户是否已存在
          if (existingUsers[username]) {
            // 更新现有用户密码
            await recordClient.query(
              'UPDATE users SET password_hash = $1 WHERE username = $2',
              [passwordHash, username]
            );
            console.log(`已更新用户 ${username} 的密码`);
            stats.usersUpdated++;
          } else {
            // 创建新用户，不使用created_at列
            const userResult = await recordClient.query(
              'INSERT INTO users (username, password_hash, student_id, email, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
              [username, passwordHash, studentId, validEmail, 'student']
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
            email: validEmail
          });
          
          // 提交当前学生的事务
          await recordClient.query('COMMIT');
          
        } catch (error) {
          // 回滚当前学生的事务
          await recordClient.query('ROLLBACK');
          console.error(`处理学生 ${name} (${indexNumber}) 时出错: ${error.message}`);
          stats.errors++;
        }
        
        // 每处理10条记录打印进度
        if (stats.totalProcessed % 10 === 0) {
          console.log(`已处理 ${stats.totalProcessed}/${data.length} 条记录...`);
        }
        
      } catch (outerError) {
        console.error(`处理第 ${i+1} 条记录时发生未捕获错误: ${outerError.message}`);
        stats.errors++;
      } finally {
        // 释放当前学生的客户端连接
        recordClient.release();
      }
    }
    
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
    console.error('导入过程中发生错误:', error.message);
    process.exit(1);
  } finally {
    // 释放主客户端
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