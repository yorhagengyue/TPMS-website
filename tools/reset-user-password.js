/**
 * Reset User Password Tool
 * 
 * This script clears a user's password by setting password_hash to an empty string
 * Usage: node tools/reset-user-password.js <studentId>
 */

const mysql = require('mysql2/promise');
const config = require('../config');

async function resetUserPassword(studentId) {
  if (!studentId) {
    console.error('Error: Student ID is required');
    console.log('Usage: node tools/reset-user-password.js <studentId>');
    console.log('Example: node tools/reset-user-password.js 2403880d');
    process.exit(1);
  }

  let connection;
  
  try {
    console.log(`Starting password reset for student ID: ${studentId}`);
    console.log(`Environment: ${config.NODE_ENV}`);
    console.log(`Database: ${config.DB_CONFIG.database}`);
    
    // Connect to the database
    connection = await mysql.createConnection(config.DB_CONFIG);
    
    // First find the student record
    const [students] = await connection.query(
      'SELECT id, name FROM students WHERE index_number = ?',
      [studentId]
    );
    
    if (students.length === 0) {
      console.log(`Student with ID ${studentId} not found in database`);
      return;
    }
    
    const student = students[0];
    console.log(`Found student: ${student.name} (ID: ${student.id})`);
    
    // Find associated user account
    const [users] = await connection.query(
      'SELECT id, username, password_hash, role FROM users WHERE student_id = ?',
      [student.id]
    );
    
    if (users.length === 0) {
      console.log('No user account found for this student');
      return;
    }
    
    const user = users[0];
    console.log(`Found user account: ${user.username} (ID: ${user.id})`);
    console.log(`Current password status: ${user.password_hash ? 'SET' : 'NOT SET'}`);
    
    // Set password to an empty string (since NULL is not allowed)
    await connection.query(
      'UPDATE users SET password_hash = "" WHERE id = ?',
      [user.id]
    );
    
    console.log('Password has been reset successfully');
    
    // Verify the change
    const [updatedUsers] = await connection.query(
      'SELECT id, username, password_hash FROM users WHERE id = ?',
      [user.id]
    );
    
    console.log(`Updated password hash: "${updatedUsers[0].password_hash}"`);
    console.log('Password reset completed successfully');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Get the student ID from command line arguments
const studentId = process.argv[2];
resetUserPassword(studentId); 