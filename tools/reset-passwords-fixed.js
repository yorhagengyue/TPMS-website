#!/usr/bin/env node

/**
 * TPMS Tool: Reset Student Passwords (Fixed Version)
 * 
 * Description:
 *   This script resets passwords for student accounts to NULL. This will trigger
 *   the password setup flow when students log in next time.
 * 
 * Usage:
 *   - Reset specific student accounts:
 *     node reset-passwords-fixed.js <studentId1> <studentId2> ...
 * 
 *   - Reset ALL student accounts:
 *     node reset-passwords-fixed.js
 */

const mysql = require('mysql2/promise');
const config = require('../config');

async function resetPasswords() {
  const studentIds = process.argv.slice(2);
  let connection;

  try {
    // Connect to database
    console.log('Connecting to database...');
    console.log(`Environment: ${config.NODE_ENV}`);
    console.log(`Database: ${config.DB_CONFIG.database}`);
    connection = await mysql.createConnection(config.DB_CONFIG);
    
    // If no student IDs provided, reset all passwords
    if (studentIds.length === 0) {
      console.log('No specific student IDs provided. Resetting ALL student passwords...');
      
      // Get all students with associated user accounts
      const [rows] = await connection.execute(
        'SELECT s.id, s.index_number FROM students s JOIN users u ON s.id = u.student_id'
      );
      
      if (rows.length === 0) {
        console.log('No student accounts found in the database.');
        return;
      }
      
      console.log(`Found ${rows.length} student accounts to reset.`);
      
      // Reset each password
      for (const row of rows) {
        await resetSinglePassword(connection, row.index_number);
      }
      
      console.log(`Successfully reset ${rows.length} student passwords.`);
    } else {
      // Reset passwords for specific student IDs
      console.log(`Resetting passwords for ${studentIds.length} student accounts...`);
      
      for (const studentId of studentIds) {
        await resetSinglePassword(connection, studentId);
      }
    }
  } catch (error) {
    console.error('Error in resetPasswords:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

async function resetSinglePassword(connection, studentId) {
  try {
    // Check if student exists by index_number
    const [students] = await connection.execute(
      'SELECT id, name FROM students WHERE index_number = ?', 
      [studentId]
    );
    
    if (students.length === 0) {
      console.log(`Student with ID ${studentId} not found in database.`);
      return false;
    }
    
    const student = students[0];
    console.log(`Found student: ${student.name || 'Unknown'} (ID: ${student.id})`);
    
    // Check if user account exists
    const [users] = await connection.execute(
      'SELECT id, username, password_hash FROM users WHERE student_id = ?', 
      [student.id]
    );
    
    if (users.length === 0) {
      console.log(`No user account found for student ID ${studentId}.`);
      return false;
    }
    
    console.log(`Found user account: ${users[0].username} (ID: ${users[0].id})`);
    
    // Reset password to empty string instead of NULL
    await connection.execute(
      'UPDATE users SET password_hash = "" WHERE student_id = ?',
      [student.id]
    );
    
    console.log(`Successfully reset password for student ID ${studentId}.`);
    return true;
  } catch (error) {
    console.error(`Error resetting password for student ID ${studentId}:`, error.message);
    return false;
  }
}

// Run the function
resetPasswords()
  .then(() => console.log('Password reset operation completed.'))
  .catch(err => console.error('Failed to reset passwords:', err.message)); 