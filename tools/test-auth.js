/**
 * Authentication Test Script
 * 
 * This script tests the student verification and registration process
 * to diagnose the "Student already has an account" issue
 */

const { verifyStudentId, registerUser } = require('./src/lib/auth');
const mysql = require('mysql2/promise');
const config = require('./config');

async function checkDatabase() {
  let connection;
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection(config.DB_CONFIG);
    
    // 检查数据库表结构
    console.log('\n=== DATABASE STRUCTURE ===');
    
    // 检查users表结构
    console.log('\nUsers table structure:');
    const [usersColumns] = await connection.query(`
      SHOW COLUMNS FROM users
    `);
    console.table(usersColumns.map(col => ({
      Field: col.Field,
      Type: col.Type,
      Key: col.Key,
      Default: col.Default
    })));
    
    // 检查外键
    console.log('\nForeign keys in users table:');
    const [foreignKeys] = await connection.query(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM
        information_schema.KEY_COLUMN_USAGE
      WHERE
        TABLE_SCHEMA = ? AND
        TABLE_NAME = 'users' AND
        REFERENCED_TABLE_NAME IS NOT NULL
    `, [config.DB_CONFIG.database]);
    console.table(foreignKeys);
    
    // 检查特定学生记录
    const testStudentId = '2403880d';
    console.log(`\n=== CHECKING STUDENT: ${testStudentId} ===`);
    
    const [students] = await connection.query(
      'SELECT * FROM students WHERE index_number = ?',
      [testStudentId]
    );
    
    if (students.length === 0) {
      console.log(`Student ID ${testStudentId} not found in database`);
    } else {
      console.log('Student record found:');
      console.table(students);
      
      const student = students[0];
      
      // 使用student_id检查是否有用户账户
      const [usersByStudentId] = await connection.query(
        'SELECT * FROM users WHERE student_id = ?',
        [student.id]
      );
      
      console.log('\nUser accounts associated with student_id:');
      if (usersByStudentId.length === 0) {
        console.log('No user account found using student_id');
      } else {
        console.table(usersByStudentId);
      }
      
      // 使用username检查是否有用户账户
      const [usersByUsername] = await connection.query(
        'SELECT * FROM users WHERE username = ?',
        [testStudentId.toLowerCase()]
      );
      
      console.log('\nUser accounts with username matching student ID:');
      if (usersByUsername.length === 0) {
        console.log('No user account found with matching username');
      } else {
        console.table(usersByUsername);
      }
    }
    
  } catch (error) {
    console.error('Database check error:', error);
  } finally {
    if (connection) await connection.end();
  }
}

async function testVerification() {
  console.log('\n=== TESTING STUDENT VERIFICATION ===');
  const testStudentId = '2403880d';
  
  try {
    console.log(`Verifying student ID: ${testStudentId}`);
    const result = await verifyStudentId(testStudentId);
    
    console.log('Verification result:');
    console.log(`Success: ${result.success}`);
    console.log(`Message: ${result.message || 'No message'}`);
    
    if (result.success) {
      console.log('Student info:');
      console.table(result.student);
    }
  } catch (error) {
    console.error('Verification error:', error);
  }
}

async function clearExistingAccount() {
  let connection;
  const testStudentId = '2403880d';
  
  try {
    console.log(`\n=== CLEARING EXISTING ACCOUNT FOR ${testStudentId} ===`);
    connection = await mysql.createConnection(config.DB_CONFIG);
    
    // 先找到学生记录
    const [students] = await connection.query(
      'SELECT id FROM students WHERE index_number = ?',
      [testStudentId]
    );
    
    if (students.length === 0) {
      console.log('Student not found, cannot clear account');
      return;
    }
    
    const studentId = students[0].id;
    
    // 删除与student_id相关联的用户记录
    const [result] = await connection.query(
      'DELETE FROM users WHERE student_id = ?',
      [studentId]
    );
    
    console.log(`Deleted ${result.affectedRows} user account(s) for student ID ${testStudentId}`);
  } catch (error) {
    console.error('Error clearing account:', error);
  } finally {
    if (connection) await connection.end();
  }
}

async function testRegistration() {
  console.log('\n=== TESTING STUDENT REGISTRATION ===');
  const testStudentId = '2403880d';
  const testPassword = 'test123456';
  
  try {
    console.log(`Registering student ID: ${testStudentId} with password: ${testPassword}`);
    const result = await registerUser(testStudentId, testPassword);
    
    console.log('Registration result:');
    console.log(`Success: ${result.success}`);
    console.log(`Message: ${result.message || 'No message'}`);
    
    if (result.success) {
      console.log('User created:');
      console.table({
        id: result.user.id,
        username: result.user.username,
        name: result.user.name,
        index_number: result.user.index_number,
        role: result.user.role
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
  }
}

async function runTests() {
  console.log('Starting authentication tests...');
  
  // 1. 检查数据库当前状态
  await checkDatabase();
  
  // 2. 测试验证
  await testVerification();
  
  // 3. 清理现有账户
  await clearExistingAccount();
  
  // 4. 再次检查验证
  await testVerification();
  
  // 5. 测试注册
  await testRegistration();
  
  console.log('\nTests completed');
}

// 运行测试
runTests().catch(console.error); 