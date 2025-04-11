/**
 * Users Table Check Script
 * 
 * This script retrieves and displays information about the users table
 */

const mysql = require('mysql2/promise');
const config = require('./config');

async function checkUsersTable() {
  let connection;
  
  try {
    console.log('Connecting to MySQL database...');
    console.log(`Database: ${config.DB_CONFIG.database}`);
    console.log(`Environment: ${config.NODE_ENV}`);
    
    // Connect to the database
    connection = await mysql.createConnection(config.DB_CONFIG);
    console.log('Successfully connected to MySQL database');
    
    // Check table structure
    console.log('\nUsers Table Structure:');
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
      ORDER BY ORDINAL_POSITION
    `, [config.DB_CONFIG.database]);
    
    if (columns.length === 0) {
      console.log('Users table not found or has no columns');
    } else {
      console.table(columns);
    }
    
    // Check for records
    console.log('\nNumber of users:');
    const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users');
    console.log(`Total users: ${userCount[0].count}`);
    
    if (userCount[0].count > 0) {
      // Display sample users
      console.log('\nSample users:');
      const [users] = await connection.query(`
        SELECT u.id, u.username, u.student_id, s.index_number, s.name, u.role, u.created_at
        FROM users u
        JOIN students s ON u.student_id = s.id
        LIMIT 10
      `);
      console.table(users);
      
      // 获取一些学生和用户的关联信息
      console.log('\n学生ID和用户账号对应关系:');
      const [userMapping] = await connection.query(`
        SELECT s.id as student_id, s.name, s.index_number, u.username, u.role
        FROM students s
        JOIN users u ON s.id = u.student_id
        LIMIT 5
      `);
      console.table(userMapping);
    } else {
      console.log('No users found in the database');
    }
    
    // Check if index_number appears as a column name in different cases
    console.log('\nChecking for student_id column in different cases:');
    const [caseCheck] = await connection.query(`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'users'
        AND LOWER(COLUMN_NAME) LIKE '%student%'
    `, [config.DB_CONFIG.database]);
    
    if (caseCheck.length > 0) {
      console.log('Found columns with "student" in their name:');
      caseCheck.forEach(col => console.log(`- ${col.COLUMN_NAME}`));
    } else {
      console.log('No columns with "student" in their name found');
    }
    
    // Check for foreign keys
    console.log('\nForeign Keys in users table:');
    const [foreignKeys] = await connection.query(`
      SELECT
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM
        information_schema.KEY_COLUMN_USAGE
      WHERE
        TABLE_SCHEMA = ?
        AND TABLE_NAME = 'users'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [config.DB_CONFIG.database]);
    
    if (foreignKeys.length === 0) {
      console.log('No foreign keys found');
    } else {
      console.table(foreignKeys);
    }
    
  } catch (error) {
    console.error('Error checking users table:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

// Run if script is called directly
if (require.main === module) {
  checkUsersTable().catch(console.error);
}

module.exports = checkUsersTable; 