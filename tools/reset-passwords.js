#!/usr/bin/env node

/**
 * TPMS Tool: Reset Student Passwords
 * 
 * Description:
 *   This script resets passwords for student accounts to NULL. This will trigger
 *   the password setup flow when students log in next time.
 * 
 * Usage:
 *   - Reset specific student accounts:
 *     node reset-passwords.js <studentId1> <studentId2> ...
 * 
 *   - Reset ALL student accounts:
 *     node reset-passwords.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'TPMS'
};

async function resetPasswords() {
  const studentIds = process.argv.slice(2);
  let connection;

  try {
    // Connect to database
    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    // If no student IDs provided, reset all passwords
    if (studentIds.length === 0) {
      console.log('No specific student IDs provided. Resetting ALL student passwords...');
      
      // Get all students with associated user accounts
      const [rows] = await connection.execute(
        'SELECT s.student_id FROM students s JOIN users u ON s.student_id = u.student_id'
      );
      
      if (rows.length === 0) {
        console.log('No student accounts found in the database.');
        return;
      }
      
      console.log(`Found ${rows.length} student accounts to reset.`);
      
      // Reset each password
      for (const row of rows) {
        await resetSinglePassword(connection, row.student_id);
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
    // Check if student exists
    const [students] = await connection.execute(
      'SELECT * FROM students WHERE student_id = ?', 
      [studentId]
    );
    
    if (students.length === 0) {
      console.log(`Student ID ${studentId} not found in database.`);
      return false;
    }
    
    // Check if user account exists
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE student_id = ?', 
      [studentId]
    );
    
    if (users.length === 0) {
      console.log(`No user account found for student ID ${studentId}.`);
      return false;
    }
    
    // Reset password to NULL
    await connection.execute(
      'UPDATE users SET password = NULL WHERE student_id = ?',
      [studentId]
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