/**
 * Fix User Accounts Tool
 * 
 * This script identifies and repairs inconsistent user accounts
 * It checks for common issues like:
 * - Duplicate user accounts for the same student
 * - Missing student records for user accounts
 * 
 * Usage:
 * node tools/fix-user-accounts.js [--verify-only]
 */

const mysql = require('mysql2/promise');
const config = require('../config');

async function checkUserAccounts() {
  console.log('Checking for inconsistent user accounts...');
  
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
    
    // Find accounts with empty password hash
    const [emptyPasswords] = await connection.execute(
      'SELECT id, username, student_id FROM users WHERE password_hash IS NULL OR password_hash = ""'
    );
    
    // Find duplicate accounts (multiple users for same student_id)
    const [duplicateQuery] = await connection.execute(
      'SELECT student_id, COUNT(*) as count FROM users GROUP BY student_id HAVING count > 1'
    );
    
    // Find orphaned accounts (users without corresponding student record)
    const [orphanedAccounts] = await connection.execute(
      'SELECT u.id, u.username, u.student_id FROM users u LEFT JOIN students s ON u.student_id = s.id WHERE s.id IS NULL'
    );
    
    // Find students with no account
    const [studentsWithoutAccounts] = await connection.execute(
      'SELECT s.id, s.name, s.index_number FROM students s LEFT JOIN users u ON s.id = u.student_id WHERE u.id IS NULL'
    );
    
    // Result summary
    console.log('\n=== Account Issues Summary ===');
    console.log(`Accounts with empty passwords: ${emptyPasswords.length}`);
    console.log(`Students with multiple user accounts: ${duplicateQuery.length}`);
    console.log(`Orphaned user accounts: ${orphanedAccounts.length}`);
    console.log(`Students without user accounts: ${studentsWithoutAccounts.length}`);
    
    return {
      emptyPasswords,
      duplicateAccounts: duplicateQuery,
      orphanedAccounts,
      studentsWithoutAccounts
    };
  } catch (error) {
    console.error('Error checking user accounts:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function fixDuplicateAccounts(verifyOnly = false) {
  console.log('\n=== Fixing Duplicate User Accounts ===');
  
  let connection;
  try {
    connection = await mysql.createConnection({
      host: config.DB_CONFIG.host,
      user: config.DB_CONFIG.user,
      password: config.DB_CONFIG.password,
      database: config.DB_CONFIG.database
    });
    
    // Find duplicate accounts (multiple users for same student_id)
    const [duplicateStudents] = await connection.execute(
      'SELECT student_id, COUNT(*) as count FROM users GROUP BY student_id HAVING count > 1'
    );
    
    if (duplicateStudents.length === 0) {
      console.log('No duplicate accounts found. Nothing to fix.');
      return;
    }
    
    console.log(`Found ${duplicateStudents.length} students with multiple accounts:`);
    
    for (const duplicate of duplicateStudents) {
      // Get details of the duplicate accounts
      const [accounts] = await connection.execute(
        'SELECT id, username, password_hash, last_login, created_at FROM users WHERE student_id = ? ORDER BY last_login DESC, created_at DESC',
        [duplicate.student_id]
      );
      
      console.log(`  Student ID ${duplicate.student_id} has ${accounts.length} accounts:`);
      accounts.forEach((account, index) => {
        console.log(`    ${index + 1}. User ID: ${account.id}, Username: ${account.username}, Created: ${account.created_at}, Last Login: ${account.last_login || 'Never'}`);
      });
      
      if (!verifyOnly) {
        // Keep the most recently used account (based on last_login or creation date)
        const keptAccount = accounts[0];
        const accountsToDelete = accounts.slice(1);
        
        console.log(`  Keeping account: User ID ${keptAccount.id}`);
        
        for (const accountToDelete of accountsToDelete) {
          await connection.execute(
            'DELETE FROM users WHERE id = ?',
            [accountToDelete.id]
          );
          console.log(`  Deleted account: User ID ${accountToDelete.id}`);
        }
      }
    }
    
    if (verifyOnly) {
      console.log('Verify-only mode. Not making any changes.');
    }
  } catch (error) {
    console.error('Error fixing duplicate accounts:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function fixOrphanedAccounts(verifyOnly = false) {
  console.log('\n=== Fixing Orphaned User Accounts ===');
  
  let connection;
  try {
    connection = await mysql.createConnection({
      host: config.DB_CONFIG.host,
      user: config.DB_CONFIG.user,
      password: config.DB_CONFIG.password,
      database: config.DB_CONFIG.database
    });
    
    // Find orphaned accounts (users without corresponding student record)
    const [orphanedAccounts] = await connection.execute(
      'SELECT u.id, u.username, u.student_id FROM users u LEFT JOIN students s ON u.student_id = s.id WHERE s.id IS NULL'
    );
    
    if (orphanedAccounts.length === 0) {
      console.log('No orphaned accounts found. Nothing to fix.');
      return;
    }
    
    console.log(`Found ${orphanedAccounts.length} orphaned accounts:`);
    orphanedAccounts.forEach(user => {
      console.log(`  User ID: ${user.id}, Username: ${user.username}, Invalid Student ID: ${user.student_id}`);
    });
    
    if (verifyOnly) {
      console.log('Verify-only mode. Not making any changes.');
      return;
    }
    
    // This is dangerous! Consider other options before deleting
    const confirmDelete = false; // Set to true to enable deletion
    
    if (confirmDelete) {
      for (const user of orphanedAccounts) {
        await connection.execute(
          'DELETE FROM users WHERE id = ?',
          [user.id]
        );
        console.log(`  Deleted orphaned account: User ID ${user.id}`);
      }
    } else {
      console.log('WARNING: Orphaned accounts found but not deleted for safety.');
      console.log('Review these accounts manually and set confirmDelete to true if you want to delete them.');
    }
  } catch (error) {
    console.error('Error fixing orphaned accounts:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function runRepairs() {
  try {
    console.log('=== USER ACCOUNT REPAIR TOOL ===');
    
    // Check if verify-only mode is enabled
    const verifyOnly = process.argv.includes('--verify-only');
    if (verifyOnly) {
      console.log('Running in verify-only mode. Will identify issues but not make changes.');
    }
    
    // Check for issues
    const issues = await checkUserAccounts();
    
    // Fix issues (skipping password issues since we don't have needs_password column)
    await fixDuplicateAccounts(verifyOnly);
    await fixOrphanedAccounts(verifyOnly);
    
    console.log('\n=== Repair Process Complete ===');
    
    if (verifyOnly) {
      console.log('Verify-only mode was enabled. No changes were made.');
      console.log('Run again without --verify-only to apply fixes.');
    }
  } catch (error) {
    console.error('Error during repair process:', error);
  }
}

// Run the repairs if this script is executed directly
if (require.main === module) {
  runRepairs().then(() => {
    console.log('\nUser account repair process completed');
  });
} 