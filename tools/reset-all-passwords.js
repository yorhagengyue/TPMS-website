/**
 * Password Reset Tool
 * 
 * This script clears the password for all user accounts in the database
 * After running this, all users will need to set a new password
 */

const db = require('../database');

async function resetAllPasswords() {
  let connection;
  
  try {
    connection = await db.getConnection();
    
    // First count how many accounts we have
    const countQuery = 'SELECT COUNT(*) as total FROM users';
    const countResult = await connection.query(countQuery);
    const totalAccounts = countResult[0].total || countResult[0].count || 0;
    
    console.log(`Found ${totalAccounts} user accounts in database`);
    
    // Get all accounts before change (for verification)
    const selectQuery = 'SELECT id, username, (password_hash IS NOT NULL AND LENGTH(password_hash) > 0) as has_password FROM users';
    const accounts = await connection.query(selectQuery);
    
    console.log('Current account status:');
    const accountsWithPassword = accounts.filter(a => a.has_password).length;
    console.log(`- Accounts with password: ${accountsWithPassword}`);
    console.log(`- Accounts without password: ${accounts.length - accountsWithPassword}`);
    
    // Prompt for confirmation in non-automated environments
    if (process.stdin.isTTY) {
      console.log('\n⚠️ WARNING: This will clear ALL passwords for ALL accounts!');
      console.log('⚠️ All users will need to set their passwords again.\n');
      
      const rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      await new Promise((resolve) => {
        rl.question('Type "CONFIRM" to proceed: ', (answer) => {
          if (answer !== 'CONFIRM') {
            console.log('Operation cancelled');
            process.exit(0);
          }
          rl.close();
          resolve();
        });
      });
    }
    
    // Update all password fields to empty strings
    const updateQuery = db.isPostgres
      ? 'UPDATE users SET password_hash = $1'
      : 'UPDATE users SET password_hash = ?';
    
    const result = await connection.query(updateQuery, ['']);
    
    const affectedRows = result.rowCount || result.affectedRows || 0;
    console.log(`\n✅ Successfully reset passwords for ${affectedRows} accounts`);
    
    // Verify the changes
    const verifyQuery = 'SELECT COUNT(*) as total FROM users WHERE password_hash IS NULL OR LENGTH(password_hash) = 0';
    const verifyResult = await connection.query(verifyQuery);
    const emptyPasswords = verifyResult[0].total || verifyResult[0].count || 0;
    
    console.log(`Verification: ${emptyPasswords} accounts now have empty passwords`);
    
    if (emptyPasswords !== totalAccounts) {
      console.log(`⚠️ Warning: Some accounts (${totalAccounts - emptyPasswords}) still have passwords`);
    } else {
      console.log('✅ All accounts now have empty passwords');
    }
    
    console.log('\nNext steps:');
    console.log('1. Users will need to login with their student ID and leave password blank');
    console.log('2. They will be prompted to set a new password');
    console.log('3. After setting their password, they can login normally');
    
  } catch (error) {
    console.error('ERROR resetting passwords:', error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Execute the reset
resetAllPasswords().then(() => {
  console.log('\nPassword reset operation completed');
  process.exit(0);
}).catch(err => {
  console.error('Operation failed:', err);
  process.exit(1);
}); 