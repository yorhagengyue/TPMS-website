/**
 * Two-Step Authentication Test Script
 * 
 * This script tests the new two-step authentication flow:
 * 1. Verify student ID and create an account without password
 * 2. Set password for the created account
 */

const { verifyStudentId, createUserAccount, setUserPassword } = require('../src/lib/auth');
const mysql = require('mysql2/promise');
const config = require('../config');

async function clearUserAccounts() {
  let connection;
  const testStudentId = '2403880d';
  
  try {
    console.log(`\n=== CLEARING EXISTING ACCOUNTS FOR ${testStudentId} ===`);
    connection = await mysql.createConnection(config.DB_CONFIG);
    
    // 获取学生记录
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

async function checkUserAccount(studentIndexNumber) {
  let connection;
  
  try {
    console.log(`\n=== CHECKING ACCOUNT FOR ${studentIndexNumber} ===`);
    connection = await mysql.createConnection(config.DB_CONFIG);
    
    // 获取学生记录
    const [students] = await connection.query(
      'SELECT id FROM students WHERE index_number = ?',
      [studentIndexNumber]
    );
    
    if (students.length === 0) {
      console.log('Student not found');
      return null;
    }
    
    const studentId = students[0].id;
    
    // 获取用户账户
    const [users] = await connection.query(
      'SELECT * FROM users WHERE student_id = ?',
      [studentId]
    );
    
    if (users.length === 0) {
      console.log('No user account found');
      return null;
    }
    
    console.log('User account found:');
    console.table(users[0]);
    return users[0];
  } catch (error) {
    console.error('Error checking account:', error);
    return null;
  } finally {
    if (connection) await connection.end();
  }
}

async function testVerifyAndCreateAccount() {
  console.log('\n=== TESTING STEP 1: VERIFY AND CREATE ACCOUNT ===');
  const testStudentId = '2403880d';
  
  try {
    // 1. 验证学生ID
    console.log(`Verifying student ID: ${testStudentId}`);
    const verifyResult = await verifyStudentId(testStudentId);
    
    console.log('Verification result:');
    console.log(`Success: ${verifyResult.success}`);
    console.log(`Message: ${verifyResult.message || 'No message'}`);
    
    if (!verifyResult.success) {
      return;
    }
    
    // 2. 创建无密码账户
    console.log('\nCreating account without password');
    const createResult = await createUserAccount(testStudentId);
    
    console.log('Account creation result:');
    console.log(`Success: ${createResult.success}`);
    console.log(`Message: ${createResult.message || 'No message'}`);
    
    if (createResult.success) {
      console.log('User created:');
      console.table({
        id: createResult.user.id,
        username: createResult.user.username,
        name: createResult.user.name,
        student_id: createResult.user.student_id,
        needs_password: createResult.user.needs_password
      });
    }
    
    return createResult;
  } catch (error) {
    console.error('Error in verify and create account:', error);
  }
}

async function testSetPassword(userId) {
  console.log('\n=== TESTING STEP 2: SET PASSWORD ===');
  const testStudentId = '2403880d';
  const testPassword = 'test123456';
  
  try {
    console.log(`Setting password for user ID: ${userId}`);
    const result = await setUserPassword(userId, testPassword);
    
    console.log('Set password result:');
    console.log(`Success: ${result.success}`);
    console.log(`Message: ${result.message || 'No message'}`);
    
    if (result.success) {
      console.log('User updated:');
      console.table({
        id: result.user.id,
        username: result.user.username,
        name: result.user.name,
        needs_password: result.user.needs_password,
        token: result.token ? '[TOKEN GENERATED]' : '[NO TOKEN]'
      });
    }
  } catch (error) {
    console.error('Error setting password:', error);
  }
}

async function runTwoStepAuthTest() {
  console.log('Starting two-step authentication tests...');
  
  // 1. 清理现有账户
  await clearUserAccounts();
  
  // 2. 检查清理后的用户账户
  let user = await checkUserAccount('2403880d');
  
  // 3. 测试第一步：验证并创建账户
  const createResult = await testVerifyAndCreateAccount();
  
  // 4. 再次检查用户账户
  user = await checkUserAccount('2403880d');
  
  // 5. 测试第二步：设置密码
  if (user) {
    await testSetPassword(user.id);
    
    // 6. 最终检查用户账户
    await checkUserAccount('2403880d');
  }
  
  console.log('\nTwo-step authentication tests completed');
}

// 运行测试
runTwoStepAuthTest().catch(console.error); 