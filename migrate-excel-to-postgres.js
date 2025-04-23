/**
 * Excel数据迁移工具 - 直接导入到PostgreSQL
 * 
 * 此脚本将：
 * 1. 从Excel文件读取数据
 * 2. 连接到PostgreSQL数据库
 * 3. 创建必要的表结构
 * 4. 导入所有数据
 */

const { Pool } = require('pg');
const XLSX = require('xlsx');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

// 加载.env文件
dotenv.config();

// PostgreSQL 连接配置
if (!process.env.DATABASE_URL) {
  console.error('错误: 未设置 DATABASE_URL 环境变量');
  console.error('请在.env文件中设置你的PostgreSQL连接字符串，例如:');
  console.error('DATABASE_URL=postgresql://username:password@localhost:5432/tpms_db_pg');
  process.exit(1);
}

const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10
});

// 主要迁移函数
async function migrateDataFromExcel() {
  console.log('开始从Excel迁移数据到PostgreSQL...');
  
  try {
    // 连接到PostgreSQL
    console.log('连接到PostgreSQL数据库...');
    const pgClient = await pgPool.connect();
    console.log('PostgreSQL连接成功!');
    
    try {
      // 开始事务
      await pgClient.query('BEGIN');
      
      // 1. 创建表结构
      console.log('在PostgreSQL中创建表结构...');
      await createTables(pgClient);
      
      // 2. 导入students表
      console.log('从Excel导入students表...');
      const students = await importStudentsFromExcel(pgClient);
      console.log(`成功导入 ${students.length} 名学生`);
      
      // 3. 为每个学生创建用户账户
      console.log('为学生创建用户账户...');
      const users = await createUserAccounts(pgClient, students);
      console.log(`成功创建 ${users.length} 个用户账户`);
      
      // 提交事务
      await pgClient.query('COMMIT');
      console.log('--------------------');
      console.log('从Excel导入成功完成!');
      console.log(`- 学生: ${students.length}`);
      console.log(`- 用户账户: ${users.length}`);
      
    } catch (error) {
      // 如有错误，回滚事务
      await pgClient.query('ROLLBACK');
      throw error;
    } finally {
      // 释放连接
      pgClient.release();
      await pgPool.end();
    }
    
  } catch (error) {
    console.error('导入失败:', error);
    process.exit(1);
  }
}

// 创建表结构
async function createTables(pgClient) {
  try {
    // 先删除现有表，确保使用最新结构
    try {
      await pgClient.query('DROP TABLE IF EXISTS users CASCADE');
      await pgClient.query('DROP TABLE IF EXISTS students CASCADE');
      await pgClient.query('DROP TABLE IF EXISTS attendance CASCADE');
      await pgClient.query('DROP TABLE IF EXISTS revoked_tokens CASCADE');
      console.log('已删除旧表，准备创建新表结构');
    } catch (dropError) {
      console.warn('删除表时出现警告:', dropError.message);
    }
    
    // 创建students表
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        course VARCHAR(255),
        index_number VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255),
        phone_number VARCHAR(50),
        total_sessions INTEGER DEFAULT 0,
        attended_sessions INTEGER DEFAULT 0,
        attendance_rate NUMERIC(5, 2) DEFAULT 0
      )
    `);
    console.log('确保students表已创建');

    // 读取初始化SQL脚本
    const sqlScript = fs.readFileSync(path.join(__dirname, 'postgres-schema.sql'), 'utf8');
    
    // 分割并执行SQL语句
    const statements = sqlScript.split(';').filter(stmt => stmt.trim() !== '');
    
    for (const stmt of statements) {
      await pgClient.query(stmt);
    }
    
    console.log('表结构创建完成');
  } catch (error) {
    console.error('创建表时出错:', error);
    throw error;
  }
}

// 从Excel导入学生数据
async function importStudentsFromExcel(pgClient) {
  // 检查Excel文件是否存在
  const excelFiles = [
    'src/cca attendance system.xlsx',
    'cca attendance system.xlsx'
  ];
  let excelFile = null;
  
  for (const file of excelFiles) {
    if (fs.existsSync(file)) {
      excelFile = file;
      console.log(`找到Excel文件: ${file}`);
      break;
    }
  }
  
  if (!excelFile) {
    throw new Error('找不到学生Excel文件！请确保以下文件之一存在: ' + excelFiles.join(', '));
  }
  
  // 读取Excel文件
  console.log(`从文件导入: ${excelFile}`);
  const workbook = XLSX.readFile(excelFile);
  
  // 打印工作表名称
  console.log(`Excel文件包含的工作表: ${workbook.SheetNames.join(', ')}`);
  
  // 优先使用包含学生信息的工作表
  const targetSheets = ['AY2425Members', 'Orientation Form'];
  let sheetName = null;
  
  for (const sheet of targetSheets) {
    if (workbook.SheetNames.includes(sheet)) {
      sheetName = sheet;
      break;
    }
  }
  
  if (!sheetName) {
    sheetName = workbook.SheetNames[0];
  }
  
  console.log(`使用工作表: ${sheetName}`);
  const worksheet = workbook.Sheets[sheetName];
  const studentsData = XLSX.utils.sheet_to_json(worksheet);
  
  if (studentsData.length === 0) {
    throw new Error('Excel文件中没有学生数据');
  }
  
  console.log(`成功从Excel读取了 ${studentsData.length} 条记录`);
  console.log(`第一条记录示例:`, JSON.stringify(studentsData[0], null, 2));
  console.log(`可用的列名:`, Object.keys(studentsData[0]).join(', '));
  
  // 清空students表
  await pgClient.query('TRUNCATE students CASCADE');
  
  // 插入学生数据
  const importedStudents = [];
  
  for (let i = 0; i < studentsData.length; i++) {
    const student = studentsData[i];
    
    // 提取学生信息，根据Excel文件的实际列名进行调整
    
    // 处理姓名
    const name = student['Name'] || student['name'] || '';
    
    // 处理学号 - 在CCA系统中可能是"Admission Numbers"或"Admission Number"
    let indexNumber = (
      student['Admission Number'] || 
      student['Admission Numbers'] || 
      student['index number'] || 
      student['index_number'] || 
      student['Student ID'] || 
      student['student_id'] || 
      student['ID'] || 
      student['id'] || 
      ''
    ).toString().trim();
    
    // 处理课程/班级
    const course = (
      student['Course'] || 
      student['course'] || 
      student['Course Of Study'] || 
      student['Course of Study'] || 
      student['Class'] || 
      student['class'] || 
      ''
    );
    
    // 处理邮箱
    const email = student['Email'] || student['email'] || student['Email Address'] || student['email address'] || '';
    
    // 处理电话号码 - 在CCA系统中有该字段
    const phoneNumber = student['Phone Number'] || '';
    
    // 处理出勤率 - 可能存在于数据中
    const attendanceRate = parseFloat(student['Percentage for Attendance'] || 0);
    
    // 如果没有姓名或学号，则跳过
    if (!name || !indexNumber) {
      console.warn(`警告: 第 ${i+1} 行的学生信息不完整，已跳过`);
      continue;
    }
    
    // 统一格式化学生ID (移除空格)
    indexNumber = indexNumber.replace(/\s+/g, '');
    
    // 如果没有邮箱，尝试根据学号生成
    const emailToUse = email || `${indexNumber.toLowerCase()}@student.tp.edu.sg`;
    
    try {
      // 插入学生信息 - 新增phone_number字段
      const result = await pgClient.query(
        'INSERT INTO students (name, course, index_number, email, phone_number, total_sessions, attended_sessions, attendance_rate) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [name, course, indexNumber, emailToUse, phoneNumber, 0, 0, attendanceRate || 0]
      );
      
      importedStudents.push(result.rows[0]);
      
      // 每插入50条记录打印一次进度
      if (importedStudents.length % 50 === 0) {
        console.log(`已处理 ${importedStudents.length}/${studentsData.length} 条记录...`);
      }
    } catch (error) {
      console.error(`插入学生 "${name}" (${indexNumber}) 时出错:`, error.message);
      // 继续处理下一个学生
    }
  }
  
  console.log(`成功导入 ${importedStudents.length} 名学生数据`);
  return importedStudents;
}

// 为每个学生创建用户账户
async function createUserAccounts(pgClient, students) {
  const createdUsers = [];
  
  for (const student of students) {
    // 使用学生ID作为用户名
    const username = student.index_number;
    
    // 生成默认密码哈希（使用学生ID作为默认密码）
    // 注意：这只是示例，实际应用中应使用更强的密码策略
    const defaultPassword = student.index_number;
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    
    try {
      // 创建用户账户
      const result = await pgClient.query(
        'INSERT INTO users (username, password_hash, student_id, role) VALUES ($1, $2, $3, $4) RETURNING *',
        [username, passwordHash, student.id, 'student']
      );
      
      createdUsers.push(result.rows[0]);
      
      // 每创建100个用户打印一次进度
      if (createdUsers.length % 100 === 0) {
        console.log(`已创建 ${createdUsers.length}/${students.length} 个用户账户...`);
      }
    } catch (error) {
      console.error(`为学生 "${student.name}" (${student.index_number}) 创建用户账户时出错:`, error.message);
      // 继续处理下一个学生
    }
  }
  
  return createdUsers;
}

// 执行迁移
migrateDataFromExcel().catch(err => {
  console.error('导入过程中发生错误:', err);
  process.exit(1);
}); 