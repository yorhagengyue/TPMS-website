/**
 * Admin User Fix Script
 * 
 * This script updates the admin user account to use student_id instead of index_number
 */

const mysql = require('mysql2/promise');
const config = require('./config');

async function fixAdminUser() {
  let connection;
  
  try {
    console.log('Connecting to MySQL database...');
    console.log(`Database: ${config.DB_CONFIG.database}`);
    console.log(`Environment: ${config.NODE_ENV}`);
    
    // Connect to the database
    connection = await mysql.createConnection(config.DB_CONFIG);
    console.log('Successfully connected to MySQL database');
    
    // 1. Check if admin user exists in students table
    console.log('\nChecking for admin user in students table...');
    const [adminStudents] = await connection.query(
      'SELECT id, name, index_number FROM students WHERE index_number = ?',
      ['admin001']
    );
    
    if (adminStudents.length === 0) {
      console.log('Admin user not found in students table. Creating...');
      
      // Create admin in students table
      const [insertResult] = await connection.query(
        'INSERT INTO students (name, course, index_number, email) VALUES (?, ?, ?, ?)',
        ['Administrator', 'System', 'admin001', 'admin@tp.edu.sg']
      );
      
      console.log(`Admin user created in students table with ID: ${insertResult.insertId}`);
      var adminStudentId = insertResult.insertId;
    } else {
      console.log('Admin user found in students table.');
      console.log('Admin user details:');
      console.table(adminStudents);
      var adminStudentId = adminStudents[0].id;
    }
    
    // 2. Check if admin user exists in users table
    console.log('\nChecking for admin user in users table...');
    const [adminUsers] = await connection.query(
      'SELECT id, username, student_id, role FROM users WHERE username = ?',
      ['admin']
    );
    
    if (adminUsers.length === 0) {
      console.log('Admin user not found in users table. Creating...');
      
      // Create admin in users table (password: admin123)
      await connection.query(
        'INSERT INTO users (username, password_hash, student_id, role) VALUES (?, ?, ?, ?)',
        ['admin', '$2b$10$4QO62sGI2Ysi/NrZx/RoRe/Z83Glo0Cz8AZ1Sjj1Gqm4OQjUm9dju', adminStudentId, 'admin']
      );
      
      console.log('Admin user created in users table');
    } else {
      console.log('Admin user found in users table. Updating...');
      
      // Update admin in users table to use student_id
      await connection.query(
        'UPDATE users SET student_id = ? WHERE username = ?',
        [adminStudentId, 'admin']
      );
      
      console.log('Admin user updated to use student_id');
    }
    
    // Verify the fix
    console.log('\nVerifying admin user setup...');
    const [verifiedAdmin] = await connection.query(
      `SELECT u.id, u.username, u.student_id, u.role, s.name, s.index_number 
       FROM users u
       JOIN students s ON u.student_id = s.id
       WHERE u.username = ?`,
      ['admin']
    );
    
    if (verifiedAdmin.length > 0) {
      console.log('Admin user successfully configured:');
      console.table(verifiedAdmin);
      console.log('\nFix completed successfully!');
    } else {
      console.log('Error: Admin user not properly configured');
    }
    
  } catch (error) {
    console.error('Error fixing admin user:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

// Run the fix
fixAdminUser().catch(console.error); 