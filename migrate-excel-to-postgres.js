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
  // 读取初始化SQL脚本
  const sqlScript = fs.readFileSync(path.join(__dirname, 'postgres-schema.sql'), 'utf8');
  
  // 分割并执行SQL语句
  const statements = sqlScript.split(';').filter(stmt => stmt.trim() !== '');
  
  for (const stmt of statements) {
    await pgClient.query(stmt);
  }
  
  console.log('表结构创建完成');
}

// 从Excel导入学生数据
async function importStudentsFromExcel(pgClient) {
  // 检查Excel文件是否存在
  const excelFiles = ['src/name list.xlsx', 'name list.xlsx', 'students.xlsx'];
  let excelFile = null;
  
  for (const file of excelFiles) {
    if (fs.existsSync(file)) {
      excelFile = file;
      break;
    }
  }
  
  if (!excelFile) {
    throw new Error('找不到学生Excel文件！请确保以下文件之一存在: ' + excelFiles.join(', '));
  }
  
  // 读取Excel文件
  console.log(`从文件导入: ${excelFile}`);
  const workbook = XLSX.readFile(excelFile);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const studentsData = XLSX.utils.sheet_to_json(worksheet);
  
  if (studentsData.length === 0) {
    throw new Error('Excel文件中没有学生数据');
  }
  
  // 清空students表
  await pgClient.query('TRUNCATE students CASCADE');
  
  // 插入学生数据
  const importedStudents = [];
  
  for (let i = 0; i < studentsData.length; i++) {
    const student = studentsData[i];
    
    // 提取学生信息，根据Excel文件的实际列名进行调整
    const name = student['Name'] || student['name'] || '';
    let indexNumber = (student['index number'] || student['index_number'] || student['student_id'] || '').toString().trim();
    const course = student['Course'] || student['course'] || '';
    const email = student['Email'] || student['email'] || `${indexNumber.toLowerCase()}@student.tp.edu.sg`;
    
    if (!name || !indexNumber) {
      console.warn(`警告: 第 ${i+1} 行的学生信息不完整，已跳过`);
      continue;
    }
    
    // 统一格式化学生ID (转小写)
    indexNumber = indexNumber.toLowerCase();
    
    // 插入学生信息
    const result = await pgClient.query(
      'INSERT INTO students (name, course, index_number, email, total_sessions, attended_sessions, attendance_rate) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, course, indexNumber, email, 0, 0, 0]
    );
    
    importedStudents.push(result.rows[0]);
  }
  
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
    
    // 创建用户账户
    const result = await pgClient.query(
      'INSERT INTO users (username, password_hash, student_id, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [username, passwordHash, student.id, 'student']
    );
    
    createdUsers.push(result.rows[0]);
  }
  
  return createdUsers;
}

// 执行迁移
migrateDataFromExcel().catch(err => {
  console.error('导入过程中发生错误:', err);
  process.exit(1);
}); 