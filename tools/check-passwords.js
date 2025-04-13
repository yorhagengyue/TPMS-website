/**
 * Check Password Status Tool
 * 
 * This script checks if all student accounts have empty passwords
 * and their 'needs_password' flag status
 * 
 * Usage: node tools/check-passwords.js
 */

const mysql = require('mysql2/promise');
const { DB_CONFIG } = require('../config');

async function checkPasswordStatus() {
  console.log('Checking password status for all student accounts...');
  
  let connection;
  try {
    // Connect to the database
    connection = await mysql.createConnection(DB_CONFIG);
    console.log(`Connected to database: ${DB_CONFIG.database}`);
    
    // Query users table to check password status
    const [users] = await connection.execute(
      `SELECT u.id, u.username, u.password_hash, u.needs_password, s.id as student_id, s.full_name 
       FROM users u 
       LEFT JOIN students s ON u.student_id = s.id
       WHERE u.role = 'student'
       ORDER BY s.id`
    );
    
    console.log(`\nFound ${users.length} student accounts in the database\n`);
    
    // Analyze password status
    let emptyPasswords = 0;
    let needsPasswordFlag = 0;
    
    console.log('Password Status Report:');
    console.log('------------------------------------------------------------------------------');
    console.log('| Student ID | Name                 | Has Password | Needs Password | User ID |');
    console.log('------------------------------------------------------------------------------');
    
    users.forEach(user => {
      const hasPassword = user.password_hash !== null && user.password_hash.trim() !== '';
      const needsPassword = user.needs_password === 1;
      const studentIdDisplay = user.student_id ? user.student_id.toString() : 'N/A';
      const fullNameDisplay = user.full_name || user.username || 'Unknown';
      
      if (!hasPassword) emptyPasswords++;
      if (needsPassword) needsPasswordFlag++;
      
      console.log(`| ${studentIdDisplay.padEnd(10)} | ${fullNameDisplay.toString().padEnd(20)} | ${hasPassword ? 'Yes' : 'No '.padEnd(11)} | ${needsPassword ? 'Yes' : 'No '.padEnd(13)} | ${user.id.toString().padEnd(7)} |`);
    });
    
    console.log('------------------------------------------------------------------------------');
    
    // Summary
    console.log(`\nSummary:`);
    console.log(`Total accounts: ${users.length}`);
    console.log(`Accounts with empty passwords: ${emptyPasswords} (${Math.round(emptyPasswords/users.length*100)}%)`);
    console.log(`Accounts with 'needs_password' flag: ${needsPasswordFlag} (${Math.round(needsPasswordFlag/users.length*100)}%)`);
    
    if (emptyPasswords === users.length) {
      console.log('\n✅ All accounts have empty passwords');
    } else {
      console.log(`\n❌ There are ${users.length - emptyPasswords} accounts with non-empty passwords`);
    }
    
    if (needsPasswordFlag === users.length) {
      console.log('✅ All accounts have the needs_password flag set');
    } else {
      console.log(`❌ There are ${users.length - needsPasswordFlag} accounts without the needs_password flag`);
    }
    
  } catch (error) {
    console.error('Error checking password status:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
  
  return true;
}

// Run the password check if called directly
if (require.main === module) {
  checkPasswordStatus()
    .then(success => {
      if (success) {
        console.log('Password status check completed successfully');
      } else {
        console.log('Password status check failed');
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Error during password status check:', err);
      process.exit(1);
    });
}

module.exports = { checkPasswordStatus }; 