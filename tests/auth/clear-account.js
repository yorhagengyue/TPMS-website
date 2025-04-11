/**
 * Clear Student Account Tool
 * 
 * This script removes user accounts associated with a specific student ID
 * Usage: node tools/clear-account.js <studentId>
 * Example: node tools/clear-account.js 2403880d
 */

const mysql = require('mysql2/promise');
const config = require('../config');

async function clearStudentAccount(studentId) {
  if (!studentId) {
    console.error('Error: Student ID is required');
    console.log('Usage: node tools/clear-account.js <studentId>');
    console.log('Example: node tools/clear-account.js 2403880d');
    process.exit(1);
  }

  let connection;
  
  try {
    console.log(`Starting account cleanup for student ID: ${studentId}`);
    console.log(`Environment: ${config.NODE_ENV}`);
    console.log(`Database: ${config.DB_CONFIG.database}`);
    
    // 连接到数据库
    connection = await mysql.createConnection(config.DB_CONFIG);
    
    // 先找到学生记录
    const [students] = await connection.query(
      'SELECT id, name FROM students WHERE index_number = ?',
      [studentId]
    );
    
    if (students.length === 0) {
      console.log(`Student with ID ${studentId} not found in database`);
      return;
    }
    
    const student = students[0];
    console.log(`Found student: ${student.name} (ID: ${student.id})`);
    
    // 查找与该学生关联的用户账户
    const [users] = await connection.query(
      'SELECT id, username, role FROM users WHERE student_id = ?',
      [student.id]
    );
    
    if (users.length === 0) {
      console.log('No user accounts found for this student');
      return;
    }
    
    console.log(`Found ${users.length} user account(s):`);
    console.table(users);
    
    // 删除用户账户
    const [result] = await connection.query(
      'DELETE FROM users WHERE student_id = ?',
      [student.id]
    );
    
    console.log(`Deleted ${result.affectedRows} user account(s) for student ID ${studentId}`);
    console.log('Account cleanup completed successfully');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// 从命令行参数获取学生ID
const studentId = process.argv[2];
clearStudentAccount(studentId); 