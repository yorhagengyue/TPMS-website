/**
 * Password Setting Test Tool
 * 
 * This script tests the password setting functionality of the authentication flow
 * It specifically focuses on the second step of the two-step authentication process
 * 
 * Usage:
 * node tools/test-password-setting.js [studentId]
 */

const mysql = require('mysql2/promise');
const http = require('http');
const config = require('../config');

// API endpoint for setting password
const API_HOST = 'localhost';
const API_PORT = 5000;
const SET_PASSWORD_PATH = '/api/auth/set-password';

/**
 * Make a POST request to the API
 */
function postRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      const chunks = [];
      
      res.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        let json;
        try {
          json = JSON.parse(body);
        } catch (e) {
          json = { error: 'Invalid JSON response', body };
        }
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

/**
 * Make a GET request to the API
 */
function getRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: path,
      method: 'GET'
    };
    
    const req = http.request(options, (res) => {
      const chunks = [];
      
      res.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        let json;
        try {
          json = JSON.parse(body);
        } catch (e) {
          json = { body };
        }
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

async function findUserAccount(studentId) {
  console.log(`\n=== FINDING USER ACCOUNT FOR STUDENT ${studentId} ===`);
  
  let connection;
  try {
    // Connect to the database
    connection = await mysql.createConnection({
      host: config.DB_CONFIG.host,
      user: config.DB_CONFIG.user,
      password: config.DB_CONFIG.password,
      database: config.DB_CONFIG.database
    });
    
    // First find the student record
    const [students] = await connection.execute(
      'SELECT id, index_number FROM students WHERE index_number = ?',
      [studentId]
    );
    
    if (students.length === 0) {
      console.log(`Student with ID ${studentId} not found in database`);
      return null;
    }
    
    const studentDbId = students[0].id;
    console.log(`Found student with database ID: ${studentDbId}`);
    
    // Find associated user account
    const [users] = await connection.execute(
      'SELECT id, username, student_id, password_hash FROM users WHERE student_id = ?',
      [studentDbId]
    );
    
    if (users.length === 0) {
      console.log(`No user account found for student ${studentId}`);
      return null;
    }
    
    console.log('Found user account:');
    console.log(`  User ID: ${users[0].id}`);
    console.log(`  Username: ${users[0].username}`);
    console.log(`  Password status: ${users[0].password_hash ? 'SET' : 'NOT SET'}`);
    
    return users[0];
  } catch (error) {
    console.error('Database error:', error.message);
    return null;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

async function clearUserPassword(userId) {
  console.log(`\n=== CLEARING PASSWORD FOR USER ID ${userId} ===`);
  
  let connection;
  try {
    connection = await mysql.createConnection({
      host: config.DB_CONFIG.host,
      user: config.DB_CONFIG.user,
      password: config.DB_CONFIG.password,
      database: config.DB_CONFIG.database
    });
    
    // Clear password
    await connection.execute(
      'UPDATE users SET password_hash = NULL WHERE id = ?',
      [userId]
    );
    
    console.log('Password cleared');
    
    // Verify the change
    const [users] = await connection.execute(
      'SELECT id, username, password_hash FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length > 0) {
      console.log('Updated user account:');
      console.log(`  User ID: ${users[0].id}`);
      console.log(`  Username: ${users[0].username}`);
      console.log(`  Password status: ${users[0].password_hash ? 'SET' : 'NOT SET'}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing password:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

async function testSetPassword(userId, studentId) {
  console.log(`\n=== TESTING PASSWORD SETTING FOR USER ID ${userId} ===`);
  
  // Test password to set
  const testPassword = 'Test123456';
  
  try {
    console.log('Making API request to set password...');
    console.log(`Endpoint: ${SET_PASSWORD_PATH}`);
    console.log(`Request payload: { userId: ${userId}, password: ${testPassword} }`);
    
    const response = await postRequest(SET_PASSWORD_PATH, {
      userId: userId,
      password: testPassword
    });
    
    console.log('Response status:', response.statusCode);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('✅ Password setting successful!');
      
      if (response.data.token) {
        console.log('Authentication token received');
      }
      
      if (response.data.user) {
        console.log('User information received:');
        console.log(`  Username: ${response.data.user.username}`);
        console.log(`  Role: ${response.data.user.role}`);
      }
    } else {
      console.log('❌ Password setting failed');
      console.log(`Error message: ${response.data.message}`);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error setting password:', error.message);
    return { success: false, error: error.message };
  }
}

async function testSetPasswordWithStudentId(userId, studentId) {
  console.log(`\n=== TESTING PASSWORD SETTING WITH STUDENT ID FOR USER ID ${userId} ===`);
  
  // Test password to set
  const testPassword = 'Test123456';
  
  try {
    console.log('Making API request to set password using studentId...');
    console.log(`Endpoint: ${SET_PASSWORD_PATH}`);
    console.log(`Request payload: { studentId: ${studentId}, password: ${testPassword} }`);
    
    const response = await postRequest(SET_PASSWORD_PATH, {
      studentId: studentId,
      password: testPassword
    });
    
    console.log('Response status:', response.statusCode);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('✅ Password setting successful (using studentId)!');
      
      if (response.data.token) {
        console.log('Authentication token received');
      }
      
      if (response.data.user) {
        console.log('User information received:');
        console.log(`  Username: ${response.data.user.username}`);
        console.log(`  Role: ${response.data.user.role}`);
      }
    } else {
      console.log('❌ Password setting failed (using studentId)');
      console.log(`Error message: ${response.data.message}`);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error setting password with studentId:', error.message);
    return { success: false, error: error.message };
  }
}

async function checkApiServer() {
  try {
    console.log(`\n=== CHECKING IF API SERVER IS RUNNING ===`);
    const response = await getRequest('/api/health');
    console.log(`API server is running. Status: ${response.statusCode}`);
    return true;
  } catch (error) {
    console.error(`Error: API server is not running at ${API_HOST}:${API_PORT}`);
    console.error('Please start the server before running this test');
    return false;
  }
}

async function runAllTests() {
  try {
    console.log('=== PASSWORD SETTING TEST TOOL ===');
    
    // Check if server is running
    const isServerRunning = await checkApiServer();
    if (!isServerRunning) {
      console.log('Aborting tests as API server is not available');
      return;
    }
    
    // Get student ID from command line or use default
    const studentId = process.argv[2] || '2403880d';
    console.log(`Using student ID: ${studentId}`);
    
    // Find user account for the student
    const user = await findUserAccount(studentId);
    if (!user) {
      console.log('Cannot proceed with tests without a valid user account');
      return;
    }
    
    // Clear user password to prepare for test
    const cleared = await clearUserPassword(user.id);
    if (!cleared) {
      console.log('Failed to clear user password, but continuing with tests');
    }
    
    // Test setting password with userId
    console.log('\n--- Testing password setting with userId ---');
    const userIdResult = await testSetPassword(user.id, studentId);
    
    // Clear user password again
    await clearUserPassword(user.id);
    
    // Test setting password with studentId
    console.log('\n--- Testing password setting with studentId ---');
    const studentIdResult = await testSetPasswordWithStudentId(user.id, studentId);
    
    // Print summary
    console.log('\n=== TEST SUMMARY ===');
    console.log(`Test for userId: ${userIdResult.success ? 'SUCCESS ✅' : 'FAILED ❌'}`);
    console.log(`Test for studentId: ${studentIdResult.success ? 'SUCCESS ✅' : 'FAILED ❌'}`);
    
    if (userIdResult.success || studentIdResult.success) {
      console.log('\nAt least one test passed! The password setting endpoint is working.');
    } else {
      console.log('\nAll tests failed! There may be issues with the password setting endpoint.');
    }
    
  } catch (error) {
    console.error('Unexpected error during tests:', error);
  }
}

// Run the tests if this script is executed directly
if (require.main === module) {
  runAllTests().then(() => {
    console.log('\nPassword setting tests completed');
  });
} 