/**
 * Authentication API Test Script
 * 
 * This script tests the authentication API endpoints, including:
 * 1. Student ID verification
 * 2. Account creation
 * 3. Password setting
 * 4. Login with credentials
 * 
 * It simulates HTTP requests to the API endpoints to ensure they're working correctly.
 */

const fetch = require('node-fetch');
const mysql = require('mysql2/promise');
const config = require('../config');

// 测试配置
const API_BASE_URL = 'http://localhost:5000/api';
const TEST_STUDENT_ID = '2403880d';
const TEST_PASSWORD = 'test123456';

// 全局存储测试状态
let authToken = null;
let userId = null;

// 用于清理测试账户
async function clearTestAccount() {
  let connection;
  
  try {
    console.log(`\n=== CLEARING TEST ACCOUNT FOR ${TEST_STUDENT_ID} ===`);
    connection = await mysql.createConnection(config.DB_CONFIG);
    
    // 获取学生记录
    const [students] = await connection.query(
      'SELECT id FROM students WHERE index_number = ?',
      [TEST_STUDENT_ID]
    );
    
    if (students.length === 0) {
      console.log('Student not found in database');
      return;
    }
    
    const studentId = students[0].id;
    
    // 删除与student_id相关联的用户记录
    const [result] = await connection.query(
      'DELETE FROM users WHERE student_id = ?',
      [studentId]
    );
    
    console.log(`Deleted ${result.affectedRows} user account(s) for student ID ${TEST_STUDENT_ID}`);
  } catch (error) {
    console.error('Error clearing account:', error);
  } finally {
    if (connection) await connection.end();
  }
}

// 格式化响应日志
function logResponse(endpoint, response, data) {
  console.log(`\n--- ${endpoint} Response ---`);
  console.log(`Status: ${response.status} ${response.statusText}`);
  console.log('Headers:', response.headers.raw());
  console.log('Body:', JSON.stringify(data, null, 2));
}

// 测试学生ID验证API
async function testVerifyStudentAPI() {
  console.log(`\n=== TESTING VERIFY STUDENT API ===`);
  console.log(`POST ${API_BASE_URL}/auth/verify-student`);
  console.log(`Body: { "studentId": "${TEST_STUDENT_ID}" }`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-student`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ studentId: TEST_STUDENT_ID })
    });
    
    const data = await response.json();
    logResponse('Verify Student', response, data);
    
    if (!data.success) {
      console.error('Student verification failed:', data.message);
      return false;
    }
    
    console.log('Verification result:');
    console.log(`Success: ${data.success}`);
    console.log(`Has Account: ${data.hasAccount || false}`);
    console.log(`Needs Password: ${data.needsPassword || false}`);
    console.log(`Message: ${data.message || 'No message'}`);
    
    return data;
  } catch (error) {
    console.error('Error testing verify student API:', error);
    return false;
  }
}

// 测试设置密码API
async function testSetPasswordAPI(userId) {
  console.log(`\n=== TESTING SET PASSWORD API ===`);
  console.log(`POST ${API_BASE_URL}/auth/set-password`);
  console.log(`Body: { "userId": "${userId}", "password": "${TEST_PASSWORD}" }`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/set-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        userId: userId, 
        password: TEST_PASSWORD 
      })
    });
    
    const data = await response.json();
    logResponse('Set Password', response, data);
    
    if (!data.success) {
      console.error('Setting password failed:', data.message);
      return false;
    }
    
    // 保存认证令牌和用户ID
    if (data.token) {
      authToken = data.token;
    }
    
    if (data.user && data.user.id) {
      userId = data.user.id;
    }
    
    return data;
  } catch (error) {
    console.error('Error testing set password API:', error);
    return false;
  }
}

// 测试登录API
async function testLoginAPI() {
  console.log(`\n=== TESTING LOGIN API ===`);
  console.log(`POST ${API_BASE_URL}/auth/login`);
  console.log(`Body: { "username": "${TEST_STUDENT_ID}", "password": "${TEST_PASSWORD}" }`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        username: TEST_STUDENT_ID, 
        password: TEST_PASSWORD 
      })
    });
    
    const data = await response.json();
    logResponse('Login', response, data);
    
    if (!data.success) {
      console.error('Login failed:', data.message);
      return false;
    }
    
    // 更新认证令牌
    authToken = data.token;
    return data;
  } catch (error) {
    console.error('Error testing login API:', error);
    return false;
  }
}

// 测试用户配置文件API
async function testUserProfileAPI() {
  if (!authToken) {
    console.log('\n=== SKIPPING PROFILE API TEST (No auth token) ===');
    return false;
  }
  
  console.log(`\n=== TESTING USER PROFILE API ===`);
  console.log(`GET ${API_BASE_URL}/users/profile`);
  console.log(`Headers: { "Authorization": "Bearer ${authToken}" }`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    logResponse('User Profile', response, data);
    
    if (!data.success) {
      console.error('Getting user profile failed:', data.message);
      return false;
    }
    
    return data;
  } catch (error) {
    console.error('Error testing user profile API:', error);
    return false;
  }
}

// 测试注销API
async function testLogoutAPI() {
  if (!authToken) {
    console.log('\n=== SKIPPING LOGOUT API TEST (No auth token) ===');
    return false;
  }
  
  console.log(`\n=== TESTING LOGOUT API ===`);
  console.log(`POST ${API_BASE_URL}/auth/logout`);
  console.log(`Headers: { "Authorization": "Bearer ${authToken}" }`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    logResponse('Logout', response, data);
    
    if (!data.success) {
      console.error('Logout failed:', data.message);
      return false;
    }
    
    // 清除认证令牌
    authToken = null;
    return data;
  } catch (error) {
    console.error('Error testing logout API:', error);
    return false;
  }
}

// 运行所有测试
async function runTests() {
  console.log('Starting authentication API tests...');
  console.log(`Test configuration: Student ID: ${TEST_STUDENT_ID}, Password: ${TEST_PASSWORD}`);
  
  // 清理测试账户
  await clearTestAccount();
  
  // 验证学生ID
  const verifyResult = await testVerifyStudentAPI();
  if (!verifyResult) {
    console.log('\n❌ Verification test failed. Stopping tests.');
    return;
  }
  console.log('\n✅ Verification test passed.');
  
  // 需要重新查询用户ID
  let connection;
  let userId;
  try {
    connection = await mysql.createConnection(config.DB_CONFIG);
    
    // 获取学生记录
    const [students] = await connection.query(
      'SELECT id FROM students WHERE index_number = ?',
      [TEST_STUDENT_ID]
    );
    
    if (students.length === 0) {
      console.log('\n❌ Cannot find student ID for password setup. Stopping tests.');
      return;
    }
    
    const studentId = students[0].id;
    
    // 获取用户ID
    const [users] = await connection.query(
      'SELECT id FROM users WHERE student_id = ?',
      [studentId]
    );
    
    if (users.length === 0) {
      console.log('\n❌ Cannot find user ID for password setup. Stopping tests.');
      return;
    }
    
    userId = users[0].id;
    console.log(`\nFound user ID: ${userId} for student ID: ${TEST_STUDENT_ID}`);
  } catch (error) {
    console.error('Error finding user ID:', error);
    return;
  } finally {
    if (connection) await connection.end();
  }
  
  // 设置密码
  const passwordResult = await testSetPasswordAPI(userId);
  if (!passwordResult) {
    console.log('\n❌ Set password test failed. Stopping tests.');
    return;
  }
  console.log('\n✅ Set password test passed.');
  
  // 登录
  const loginResult = await testLoginAPI();
  if (!loginResult) {
    console.log('\n❌ Login test failed. Stopping tests.');
    return;
  }
  console.log('\n✅ Login test passed.');
  
  // 获取用户信息
  const profileResult = await testUserProfileAPI();
  if (!profileResult) {
    console.log('\n❌ Profile test failed.');
  } else {
    console.log('\n✅ Profile test passed.');
  }
  
  // 注销
  const logoutResult = await testLogoutAPI();
  if (!logoutResult) {
    console.log('\n❌ Logout test failed.');
  } else {
    console.log('\n✅ Logout test passed.');
  }
  
  // 测试总结
  console.log('\n=== TEST SUMMARY ===');
  console.log(`Verify Student: ${verifyResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Set Password: ${passwordResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Login: ${loginResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`User Profile: ${profileResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Logout: ${logoutResult ? '✅ PASS' : '❌ FAIL'}`);
}

// 检查API服务器是否正在运行
async function checkApiServer() {
  try {
    console.log(`Checking API server at ${API_BASE_URL}...`);
    const response = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
    
    if (response.ok) {
      console.log('API server is online!');
      return true;
    } else {
      console.log(`API server returned status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('Cannot connect to API server. Is it running?');
    console.error(`Error details: ${error.message}`);
    console.error('Please start the server with: npm run dev');
    return false;
  }
}

// 主函数
async function main() {
  const serverAvailable = await checkApiServer();
  
  if (serverAvailable) {
    await runTests();
  } else {
    console.log('\nTests aborted due to server unavailability.');
  }
}

// 执行主函数
main().catch(console.error); 