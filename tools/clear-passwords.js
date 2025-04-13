/**
 * Clear Passwords Tool
 * 
 * This script clears passwords for existing user accounts and
 * sets the needs_password flag to true, allowing testing of
 * the new authentication flow with existing accounts.
 */

const mysql = require('mysql2/promise');
const config = require('../config');

async function clearAllPasswords() {
  let connection;
  
  try {
    console.log('=== CLEARING ALL USER PASSWORDS ===');
    connection = await mysql.createConnection(config.DB_CONFIG);
    
    // 更新所有用户账户，清除密码并设置needs_password标志
    const [result] = await connection.query(
      'UPDATE users SET password = NULL, needs_password = TRUE'
    );
    
    console.log(`Updated ${result.affectedRows} user account(s)`);
    console.log('All passwords have been cleared and needs_password flags set to TRUE');
    
    // 查询并显示更新后的用户列表
    const [users] = await connection.query(
      'SELECT id, username, name, role, created_at, needs_password FROM users'
    );
    
    console.log('\nUpdated users:');
    console.table(users);
    
  } catch (error) {
    console.error('Error clearing passwords:', error);
  } finally {
    if (connection) await connection.end();
  }
}

async function clearPasswordForStudent(studentId) {
  let connection;
  
  try {
    console.log(`=== CLEARING PASSWORD FOR STUDENT ${studentId} ===`);
    connection = await mysql.createConnection(config.DB_CONFIG);
    
    // 查找学生ID
    const [students] = await connection.query(
      'SELECT id FROM students WHERE index_number = ?',
      [studentId]
    );
    
    if (students.length === 0) {
      console.log(`Student with ID ${studentId} not found`);
      return;
    }
    
    const studentDbId = students[0].id;
    
    // 更新该学生的用户账户
    const [result] = await connection.query(
      'UPDATE users SET password = NULL, needs_password = TRUE WHERE student_id = ?',
      [studentDbId]
    );
    
    if (result.affectedRows === 0) {
      console.log(`No user account found for student ${studentId}`);
      return;
    }
    
    console.log(`Password cleared for student ${studentId}`);
    
    // 查询并显示更新后的用户信息
    const [users] = await connection.query(
      'SELECT id, username, name, role, created_at, needs_password FROM users WHERE student_id = ?',
      [studentDbId]
    );
    
    console.log('\nUpdated user:');
    console.table(users[0]);
    
  } catch (error) {
    console.error('Error clearing password:', error);
  } finally {
    if (connection) await connection.end();
  }
}

// 根据命令行参数执行不同的操作
if (process.argv.length > 2) {
  const studentId = process.argv[2];
  clearPasswordForStudent(studentId).catch(console.error);
} else {
  // 如果没有提供参数，清除所有密码
  clearAllPasswords().catch(console.error);
}

console.log('\nUsage:');
console.log('  node clear-passwords.js            - Clear all user passwords');
console.log('  node clear-passwords.js 2403880d   - Clear password for specific student'); 