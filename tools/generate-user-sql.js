/**
 * Generate SQL to Add User
 * 
 * This script generates the SQL statements needed to add a user without connecting to the database.
 * Usage: node generate-user-sql.js
 */

const bcrypt = require('bcrypt');

async function generateUserSQL() {
  try {
    console.log('=== TPMS User SQL Generator ===');
    
    // User data
    const username = '2403880d';
    const password = '123123';
    const name = 'Student ' + username;
    const indexNumber = username;
    const email = `${username}@tp.edu.sg`;
    const role = 'student';
    
    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    console.log('\n--- Generated SQL Statements ---');
    console.log('\n-- Step 1: Add student record if not exists');
    console.log(`INSERT INTO students (name, index_number, email)
SELECT '${name}', '${indexNumber}', '${email}'
FROM dual
WHERE NOT EXISTS (
    SELECT 1 FROM students WHERE index_number = '${indexNumber}'
);`);

    console.log('\n-- Step 2: Get student ID');
    console.log(`SET @student_id = (SELECT id FROM students WHERE index_number = '${indexNumber}');`);

    console.log('\n-- Step 3: Create or update user account');
    console.log(`INSERT INTO users (username, password_hash, student_id, email, role)
VALUES ('${username}', '${passwordHash}', @student_id, '${email}', '${role}')
ON DUPLICATE KEY UPDATE password_hash = '${passwordHash}';`);

    console.log('\n--- User Information ---');
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log(`Password Hash: ${passwordHash}`);
    
    console.log('\n✅ SQL generation complete. Copy and run these statements in your MySQL client.');
    
  } catch (error) {
    console.error('Error generating SQL:', error.message);
  }
}

// Run the function
generateUserSQL().catch(console.error); 