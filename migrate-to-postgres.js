/**
 * 数据库迁移工具 - 从MySQL迁移到PostgreSQL
 * 
 * 此脚本将：
 * 1. 从MySQL读取所有数据
 * 2. 连接到PostgreSQL数据库
 * 3. 创建必要的表结构
 * 4. 导入所有数据
 */

const mysql = require('mysql2/promise');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// 加载.env文件
dotenv.config();

// MySQL 连接配置
const mysqlConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tpms_db'
};

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
async function migrateData() {
  console.log('开始数据库迁移: MySQL -> PostgreSQL');
  
  try {
    // 连接到MySQL
    console.log('连接到MySQL数据库...');
    const mysqlConn = await mysql.createConnection(mysqlConfig);
    console.log('MySQL连接成功!');
    
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
      
      // 2. 迁移students表
      console.log('迁移students表...');
      const students = await migrateStudents(mysqlConn, pgClient);
      console.log(`成功迁移 ${students.length} 名学生`);
      
      // 3. 迁移users表
      console.log('迁移users表...');
      const users = await migrateUsers(mysqlConn, pgClient);
      console.log(`成功迁移 ${users.length} 个用户账户`);
      
      // 4. 迁移attendance表
      console.log('迁移attendance表...');
      const attendance = await migrateAttendance(mysqlConn, pgClient);
      console.log(`成功迁移 ${attendance.length} 条出勤记录`);
      
      // 5. 迁移revoked_tokens表
      console.log('迁移revoked_tokens表...');
      const tokens = await migrateRevokedTokens(mysqlConn, pgClient);
      console.log(`成功迁移 ${tokens.length} 个已吊销的令牌`);
      
      // 提交事务
      await pgClient.query('COMMIT');
      console.log('--------------------');
      console.log('迁移成功完成!');
      console.log(`- 学生: ${students.length}`);
      console.log(`- 用户账户: ${users.length}`);
      console.log(`- 出勤记录: ${attendance.length}`);
      console.log(`- 已吊销的令牌: ${tokens.length}`);
      
    } catch (error) {
      // 如有错误，回滚事务
      await pgClient.query('ROLLBACK');
      throw error;
    } finally {
      // 释放连接
      pgClient.release();
      await mysqlConn.end();
      await pgPool.end();
    }
    
  } catch (error) {
    console.error('迁移失败:', error);
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

// 迁移students表
async function migrateStudents(mysqlConn, pgClient) {
  // 从MySQL读取students
  const [students] = await mysqlConn.query('SELECT * FROM students');
  
  // 在开始之前清空PostgreSQL表
  await pgClient.query('TRUNCATE students CASCADE');
  
  // 重置序列
  await pgClient.query('ALTER SEQUENCE students_id_seq RESTART WITH 1');
  
  for (const student of students) {
    // 插入到PostgreSQL
    await pgClient.query(
      `INSERT INTO students 
       (id, name, course, index_number, email, total_sessions, attended_sessions, attendance_rate, last_attendance, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        student.id,
        student.name,
        student.course,
        student.index_number,
        student.email,
        student.total_sessions || 0,
        student.attended_sessions || 0,
        student.attendance_rate || 0,
        student.last_attendance,
        student.created_at
      ]
    );
  }
  
  // 设置序列为当前最大ID+1
  if (students.length > 0) {
    const maxId = Math.max(...students.map(s => s.id));
    await pgClient.query(`ALTER SEQUENCE students_id_seq RESTART WITH ${maxId + 1}`);
  }
  
  return students;
}

// 迁移users表
async function migrateUsers(mysqlConn, pgClient) {
  // 从MySQL读取users
  const [users] = await mysqlConn.query('SELECT * FROM users');
  
  // 在开始之前清空PostgreSQL表
  await pgClient.query('TRUNCATE users CASCADE');
  
  // 重置序列
  await pgClient.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
  
  for (const user of users) {
    // 插入到PostgreSQL
    await pgClient.query(
      `INSERT INTO users 
       (id, username, password_hash, student_id, email, role, created_at, last_login) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        user.id,
        user.username,
        user.password_hash,
        user.student_id,
        user.email,
        user.role,
        user.created_at,
        user.last_login
      ]
    );
  }
  
  // 设置序列为当前最大ID+1
  if (users.length > 0) {
    const maxId = Math.max(...users.map(u => u.id));
    await pgClient.query(`ALTER SEQUENCE users_id_seq RESTART WITH ${maxId + 1}`);
  }
  
  return users;
}

// 迁移attendance表
async function migrateAttendance(mysqlConn, pgClient) {
  // 从MySQL读取attendance
  const [attendance] = await mysqlConn.query('SELECT * FROM attendance');
  
  // 在开始之前清空PostgreSQL表
  await pgClient.query('TRUNCATE attendance CASCADE');
  
  // 重置序列
  await pgClient.query('ALTER SEQUENCE attendance_id_seq RESTART WITH 1');
  
  for (const record of attendance) {
    // 插入到PostgreSQL
    await pgClient.query(
      `INSERT INTO attendance 
       (id, student_id, check_in_time, location_lat, location_lng, session_id) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        record.id,
        record.student_id,
        record.check_in_time,
        record.location_lat,
        record.location_lng,
        record.session_id
      ]
    );
  }
  
  // 设置序列为当前最大ID+1
  if (attendance.length > 0) {
    const maxId = Math.max(...attendance.map(a => a.id));
    await pgClient.query(`ALTER SEQUENCE attendance_id_seq RESTART WITH ${maxId + 1}`);
  }
  
  return attendance;
}

// 迁移revoked_tokens表
async function migrateRevokedTokens(mysqlConn, pgClient) {
  // 从MySQL读取revoked_tokens
  const [tokens] = await mysqlConn.query('SELECT * FROM revoked_tokens');
  
  // 在开始之前清空PostgreSQL表
  await pgClient.query('TRUNCATE revoked_tokens CASCADE');
  
  // 重置序列
  await pgClient.query('ALTER SEQUENCE revoked_tokens_id_seq RESTART WITH 1');
  
  for (const token of tokens) {
    // 插入到PostgreSQL
    await pgClient.query(
      `INSERT INTO revoked_tokens 
       (id, token_id, expiry, revoked_at) 
       VALUES ($1, $2, $3, $4)`,
      [
        token.id,
        token.token_id,
        token.expiry,
        token.revoked_at
      ]
    );
  }
  
  // 设置序列为当前最大ID+1
  if (tokens.length > 0) {
    const maxId = Math.max(...tokens.map(t => t.id));
    await pgClient.query(`ALTER SEQUENCE revoked_tokens_id_seq RESTART WITH ${maxId + 1}`);
  }
  
  return tokens;
}

// 执行迁移
migrateData().catch(err => {
  console.error('迁移过程中发生错误:', err);
  process.exit(1);
}); 