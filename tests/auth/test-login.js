/**
 * Login Test Script
 * 
 * This script tests the login functionality by authenticating with sample user credentials
 */

const { authenticateUser } = require('./src/lib/auth');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const config = require('./config');

async function updateAdminPassword() {
  console.log('Updating admin password...');
  
  try {
    // Generate new password hash for admin123
    const passwordHash = await bcrypt.hash('admin123', 10);
    console.log(`New password hash generated: ${passwordHash}`);
    
    // Update in database
    const connection = await mysql.createConnection(config.DB_CONFIG);
    
    await connection.query(
      'UPDATE users SET password_hash = ? WHERE username = ?',
      [passwordHash, 'admin']
    );
    
    console.log('Admin password updated in database');
    await connection.end();
    
    return true;
  } catch (error) {
    console.error('Error updating admin password:', error.message);
    return false;
  }
}

async function testLogin() {
  // 先更新管理员密码
  await updateAdminPassword();
  
  console.log('\nTesting login functionality...');
  console.log('================================');
  
  // 测试案例1：使用第一个样本用户尝试登录
  const username1 = '2403880d';
  const name1 = 'Geng Yue'; 
  // 密码生成逻辑：
  // 1. 移除姓名中的空格
  const sanitizedName1 = name1.replace(/\s+/g, '');
  // 2. 获取移除空格后的姓名的最后4个字符
  const namePart1 = sanitizedName1.length >= 4 ? sanitizedName1.slice(-4).toLowerCase() : sanitizedName1.toLowerCase();
  // 3. 获取学号的前4个字符
  const indexPart1 = username1.slice(0, 4).toLowerCase();
  // 4. 组合成密码
  const password1 = `${indexPart1}${namePart1}`;
  
  console.log(`\nTest Case 1: Login with username "${username1}"`);
  console.log(`Name: ${name1}`);
  console.log(`Password: ${password1}`);
  console.log('--------------------------------');
  
  try {
    const result1 = await authenticateUser(username1, password1);
    console.log('Login result:', result1.success ? 'SUCCESS' : 'FAILED');
    
    if (result1.success) {
      console.log('User details:');
      console.log(`- Name: ${result1.user.name}`);
      console.log(`- Username: ${result1.user.username}`);
      console.log(`- Role: ${result1.user.role}`);
      console.log(`- Student ID: ${result1.user.index_number}`);
    } else {
      console.log('Error message:', result1.message);
    }
  } catch (error) {
    console.error('Error during login test 1:', error.message);
  }
  
  // 测试案例2：使用另一个样本用户尝试登录
  const username2 = '2401360i';
  const name2 = 'Chew Khai Yeoh Caven';
  // 密码生成逻辑：
  // 1. 移除姓名中的空格
  const sanitizedName2 = name2.replace(/\s+/g, '');
  // 2. 获取移除空格后的姓名的最后4个字符
  const namePart2 = sanitizedName2.length >= 4 ? sanitizedName2.slice(-4).toLowerCase() : sanitizedName2.toLowerCase();
  // 3. 获取学号的前4个字符
  const indexPart2 = username2.slice(0, 4).toLowerCase();
  // 4. 组合成密码
  const password2 = `${indexPart2}${namePart2}`;
  
  console.log(`\nTest Case 2: Login with username "${username2}"`);
  console.log(`Name: ${name2}`);
  console.log(`Password: ${password2}`);
  console.log('--------------------------------');
  
  try {
    const result2 = await authenticateUser(username2, password2);
    console.log('Login result:', result2.success ? 'SUCCESS' : 'FAILED');
    
    if (result2.success) {
      console.log('User details:');
      console.log(`- Name: ${result2.user.name}`);
      console.log(`- Username: ${result2.user.username}`);
      console.log(`- Role: ${result2.user.role}`);
      console.log(`- Student ID: ${result2.user.index_number}`);
    } else {
      console.log('Error message:', result2.message);
    }
  } catch (error) {
    console.error('Error during login test 2:', error.message);
  }
  
  // 测试案例3：使用管理员账户尝试登录
  const username3 = 'admin';
  const password3 = 'admin123';
  
  console.log(`\nTest Case 3: Login with admin "${username3}"`);
  console.log(`Password: ${password3}`);
  console.log('--------------------------------');
  
  try {
    const result3 = await authenticateUser(username3, password3);
    console.log('Login result:', result3.success ? 'SUCCESS' : 'FAILED');
    
    if (result3.success) {
      console.log('User details:');
      console.log(`- Name: ${result3.user.name}`);
      console.log(`- Username: ${result3.user.username}`);
      console.log(`- Role: ${result3.user.role}`);
      console.log(`- Student ID: ${result3.user.index_number}`);
    } else {
      console.log('Error message:', result3.message);
    }
  } catch (error) {
    console.error('Error during login test 3:', error.message);
  }
  
  // 测试案例4：使用错误的凭据尝试登录
  const username4 = '2403880d';
  const password4 = 'wrongpassword';
  
  console.log(`\nTest Case 4: Login with incorrect password`);
  console.log(`Username: ${username4}, Password: ${password4}`);
  console.log('--------------------------------');
  
  try {
    const result4 = await authenticateUser(username4, password4);
    console.log('Login result:', result4.success ? 'SUCCESS' : 'FAILED');
    
    if (!result4.success) {
      console.log('Error message:', result4.message);
    }
  } catch (error) {
    console.error('Error during login test 4:', error.message);
  }
  
  console.log('\n================================');
  console.log('Login tests completed');
}

// Run the tests
testLogin().catch(console.error); 