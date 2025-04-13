/**
 * Reset All Account Passwords
 * 
 * This script resets ALL user passwords to empty strings,
 * which will trigger the password setup flow when they login.
 * 
 * Usage:
 * node tools/reset-all-accounts.js
 */

const mysql = require('mysql2/promise');
const config = require('../config');

async function resetAllPasswords() {
  let connection;

  try {
    // Connect to database
    console.log('Connecting to database...');
    console.log(`Environment: ${config.NODE_ENV}`);
    console.log(`Database: ${config.DB_CONFIG.database}`);
    connection = await mysql.createConnection(config.DB_CONFIG);
    
    // Reset ALL passwords
    console.log('Resetting ALL account passwords...');
    
    const [result] = await connection.execute(
      'UPDATE users SET password_hash = ""'
    );
    
    console.log(`Successfully reset ${result.affectedRows} account passwords.`);
    
    // Verify the changes
    const [users] = await connection.query(
      'SELECT id, username, role, LENGTH(password_hash) as pwd_length FROM users'
    );
    
    const emptyPasswords = users.filter(u => u.pwd_length === 0);
    
    console.log(`\nTotal users: ${users.length}`);
    console.log(`Users with empty passwords: ${emptyPasswords.length}`);
    
    if (emptyPasswords.length === users.length) {
      console.log('\n✅ ALL passwords have been successfully reset.');
      console.log('The registration flow should now work correctly for all accounts.');
    } else {
      console.log('\n⚠️ WARNING: Not all passwords were reset:');
      users
        .filter(u => u.pwd_length > 0)
        .forEach(u => console.log(` - ${u.username} (${u.role})`));
    }
    
  } catch (error) {
    console.error('Error in resetAllPasswords:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed.');
    }
  }
}

// Run the function
resetAllPasswords()
  .then(() => console.log('Password reset operation completed.'))
  .catch(err => console.error('Failed to reset passwords:', err.message)); 