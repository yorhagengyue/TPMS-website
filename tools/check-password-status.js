/**
 * Check Password Status Tool
 * 
 * This script checks the password status of all users in the system
 * It reports which users have passwords set and which don't
 * 
 * Usage:
 * node tools/check-password-status.js
 */

const mysql = require('mysql2/promise');
const config = require('../config');

async function checkPasswordStatus() {
  console.log('Checking password status for all users...');
  
  let connection;
  try {
    // Connect to the database
    connection = await mysql.createConnection({
      host: config.DB_CONFIG.host,
      user: config.DB_CONFIG.user,
      password: config.DB_CONFIG.password,
      database: config.DB_CONFIG.database
    });
    
    console.log(`Connected to database: ${config.DB_CONFIG.database}`);
    
    // Check users table structure
    const [columns] = await connection.execute(
      'SHOW COLUMNS FROM users'
    );
    console.log('User table structure:');
    columns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });
    
    // Query all users
    const [users] = await connection.execute(
      'SELECT id, student_id, username, password, needs_password FROM users'
    );
    
    console.log('\n=== User Password Status ===');
    console.log(`Total users: ${users.length}`);
    
    // Count users with and without passwords
    const usersWithPassword = users.filter(user => user.password !== null && user.password !== '');
    const usersNeedingPassword = users.filter(user => user.needs_password === 1);
    
    console.log(`Users with password set: ${usersWithPassword.length}`);
    console.log(`Users with needs_password flag: ${usersNeedingPassword.length}`);
    
    // Print detailed info
    console.log('\n=== Detailed User Information ===');
    users.forEach(user => {
      console.log(`ID: ${user.id}, Student ID: ${user.student_id}, Username: ${user.username}`);
      console.log(`  Password status: ${user.password ? 'SET' : 'NOT SET'}`);
      console.log(`  Needs password flag: ${user.needs_password === 1 ? 'YES' : 'NO'}`);
      console.log('---');
    });
    
    return users;
  } catch (error) {
    console.error('Error checking password status:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Execute the function if this script is run directly
if (require.main === module) {
  checkPasswordStatus()
    .then(() => {
      console.log('Password status check completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Failed to check password status:', error);
      process.exit(1);
    });
} else {
  // Export for use in other scripts
  module.exports = { checkPasswordStatus };
} 