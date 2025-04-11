/**
 * Database Schema Update Script
 * 
 * This script updates the database schema to ensure all required fields are present
 */

const mysql = require('mysql2/promise');
const config = require('./config');

async function updateDatabaseSchema() {
  let connection;
  
  try {
    console.log('Starting database schema update...');
    console.log(`Environment: ${config.NODE_ENV}`);
    console.log(`Database: ${config.DB_CONFIG.database}`);
    
    // Connect to the database
    connection = await mysql.createConnection(config.DB_CONFIG);
    
    // Check if students table exists
    const [tables] = await connection.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'students'`,
      [config.DB_CONFIG.database]
    );
    
    if (tables.length === 0) {
      console.error('Students table does not exist. Please run setup-db.sql first.');
      return;
    }
    
    // Get current columns in students table
    const [columns] = await connection.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'students'`,
      [config.DB_CONFIG.database]
    );
    
    const existingColumns = columns.map(col => col.COLUMN_NAME.toLowerCase());
    console.log('Existing columns:', existingColumns);
    
    // Add missing columns to students table
    const columnsToAdd = [];
    
    if (!existingColumns.includes('email')) {
      columnsToAdd.push('ADD COLUMN email VARCHAR(255)');
    }
    
    if (!existingColumns.includes('total_sessions')) {
      columnsToAdd.push('ADD COLUMN total_sessions INT DEFAULT 0');
    }
    
    if (!existingColumns.includes('attended_sessions')) {
      columnsToAdd.push('ADD COLUMN attended_sessions INT DEFAULT 0');
    }
    
    if (!existingColumns.includes('attendance_rate')) {
      columnsToAdd.push('ADD COLUMN attendance_rate DECIMAL(5,2) DEFAULT 0.00');
    }
    
    if (!existingColumns.includes('last_attendance')) {
      columnsToAdd.push('ADD COLUMN last_attendance TIMESTAMP NULL');
    }
    
    // Execute ALTER TABLE if there are columns to add
    if (columnsToAdd.length > 0) {
      const alterQuery = `ALTER TABLE students ${columnsToAdd.join(', ')}`;
      console.log('Executing:', alterQuery);
      await connection.query(alterQuery);
      console.log('Students table updated successfully');
    } else {
      console.log('No updates needed for students table');
    }
    
    // Check if attendance_analysis table exists
    const [analysisTables] = await connection.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'attendance_analysis'`,
      [config.DB_CONFIG.database]
    );
    
    if (analysisTables.length === 0) {
      console.log('Creating attendance_analysis table...');
      await connection.query(`
        CREATE TABLE attendance_analysis (
          id INT AUTO_INCREMENT PRIMARY KEY,
          analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          total_students INT NOT NULL,
          total_sessions INT NOT NULL,
          average_attendance_rate DECIMAL(5,2) NOT NULL
        )
      `);
      console.log('Attendance analysis table created');
    }
    
    // Check if attendance_sessions table exists
    const [sessionTables] = await connection.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'attendance_sessions'`,
      [config.DB_CONFIG.database]
    );
    
    if (sessionTables.length === 0) {
      console.log('Creating attendance_sessions table...');
      await connection.query(`
        CREATE TABLE attendance_sessions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          analysis_id INT NOT NULL,
          session_date VARCHAR(50) NOT NULL,
          FOREIGN KEY (analysis_id) REFERENCES attendance_analysis(id) ON DELETE CASCADE
        )
      `);
      console.log('Attendance sessions table created');
    }
    
    console.log('Database schema update completed');
    
  } catch (error) {
    console.error('Error updating database schema:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the update if script is called directly
if (require.main === module) {
  updateDatabaseSchema().catch(console.error);
}

module.exports = updateDatabaseSchema; 