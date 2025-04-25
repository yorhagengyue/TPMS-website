/**
 * Add User Script for TPMS
 * 
 * This script adds a new user to the database with the specified credentials.
 * 
 * Usage: node add-user.js [username] [password] [db_user] [db_password]
 * Example: node add-user.js 2403880d 123123 root mypassword
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const readline = require('readline');

// 从命令行获取参数
const args = process.argv.slice(2);
const username = args[0] || '2403880d';
const password = args[1] || '123123';
const dbUser = args[2] || 'root';
const dbPassword = args[3] || '';

// 数据库连接配置
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: dbUser,
  password: dbPassword,
  database: 'tpms_db'
};

// 创建readline接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 提示输入
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function addUser() {
  let connection;
  
  try {
    console.log('=== TPMS User Creation Tool ===');
    console.log(`Adding user: ${username}`);
    console.log(`Database: ${dbConfig.database}`);
    console.log(`Database user: ${dbConfig.user}`);
    
    // Connect to the database
    console.log('\nConnecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database.');
    
    // User data
    const name = 'Student ' + username;
    const indexNumber = username;
    
    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    console.log(`\nAdding student record for ${name} (${indexNumber})...`);
    
    // First, check if the student already exists
    const [existingStudents] = await connection.execute(
      'SELECT id FROM students WHERE index_number = ?',
      [indexNumber]
    );
    
    let studentId;
    
    if (existingStudents.length > 0) {
      // Student already exists
      studentId = existingStudents[0].id;
      console.log(`Student with index number ${indexNumber} already exists with ID: ${studentId}`);
    } else {
      // Insert student record
      const [studentResult] = await connection.execute(
        'INSERT INTO students (name, index_number, email) VALUES (?, ?, ?)',
        [name, indexNumber, `${username}@tp.edu.sg`]
      );
      
      studentId = studentResult.insertId;
      console.log(`Added new student with ID: ${studentId}`);
    }
    
    // Check if user already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    
    if (existingUsers.length > 0) {
      // Update existing user
      await connection.execute(
        'UPDATE users SET password_hash = ? WHERE username = ?',
        [passwordHash, username]
      );
      console.log(`Updated existing user ${username} with new password`);
    } else {
      // Insert user record
      await connection.execute(
        'INSERT INTO users (username, password_hash, student_id, email, role) VALUES (?, ?, ?, ?, ?)',
        [username, passwordHash, studentId, `${username}@tp.edu.sg`, 'student']
      );
      console.log(`Added new user account for ${username}`);
    }
    
    console.log(`\n✅ Successfully created/updated user account:`);
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log(`\nThe user can now login with these credentials.`);
    
  } catch (error) {
    console.error('\n❌ Error adding user:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Access denied. Please check your database username and password.');
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      console.error('Tables do not exist. Please run setup-db.sql to create database tables first.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Could not connect to MySQL server. Please ensure MySQL is running.');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
    rl.close();
  }
}

// Run the function
addUser().catch(console.error); 