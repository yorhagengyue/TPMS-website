/**
 * Test Database Setup Script
 * 
 * This script creates and initializes the test database with sample data
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// First set environment to test
process.env.NODE_ENV = 'test';
const config = require('./config');

async function setupTestDatabase() {
  let connection;
  let testDbConfig = {...config.DB_CONFIG};
  
  try {
    console.log('Setting up test database environment...');
    
    // First connect without database to create it if needed
    delete testDbConfig.database;
    connection = await mysql.createConnection(testDbConfig);
    
    // Create test database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${config.DB_CONFIG.database}`);
    console.log(`Test database created: ${config.DB_CONFIG.database}`);
    
    // Connect to the test database
    await connection.end();
    connection = await mysql.createConnection(config.DB_CONFIG);
    
    // Read the SQL setup script
    const sqlScript = fs.readFileSync(path.join(__dirname, 'setup-db.sql'), 'utf8');
    
    // Split SQL script into individual commands
    const commands = sqlScript
      .replace(/--.*$/gm, '') // Remove comments
      .split(';')
      .filter(cmd => cmd.trim() !== '');
    
    // Execute each command
    for (const cmd of commands) {
      // Skip database creation command as we've already created it
      if (cmd.includes('CREATE DATABASE') || cmd.includes('USE')) {
        continue;
      }
      await connection.query(cmd);
    }
    
    console.log('Tables created in test database');
    
    // Insert sample test data
    await insertSampleData(connection);
    
    console.log('Test database setup completed successfully');
  } catch (error) {
    console.error('Error setting up test database:', error.message);
    if (error.message.includes('connect')) {
      console.log('\nDatabase connection issue. Please check:');
      console.log('1. MySQL server is running');
      console.log('2. Database credentials in .env.test file are correct');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

async function insertSampleData(connection) {
  // Insert sample students
  const sampleStudents = [
    { name: 'Test Student 1', course: 'Computer Science', index_number: 'test001' },
    { name: 'Test Student 2', course: 'Engineering', index_number: 'test002' },
    { name: 'Test Student 3', course: 'Business', index_number: 'test003' }
  ];
  
  console.log('Inserting sample students...');
  for (const student of sampleStudents) {
    await connection.query(
      'INSERT INTO students (name, course, index_number) VALUES (?, ?, ?)',
      [student.name, student.course, student.index_number]
    );
  }
  
  // Get student IDs
  const [students] = await connection.query('SELECT id FROM students');
  
  // Insert sample attendance records
  console.log('Inserting sample attendance records...');
  for (const student of students) {
    // Add a few attendance records for each student
    for (let i = 0; i < 3; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i * 7); // One record per week in the past
      
      await connection.query(
        'INSERT INTO attendance (student_id, check_in_time, location_lat, location_lng) VALUES (?, ?, ?, ?)',
        [student.id, date, 1.3456, 103.9321]
      );
    }
  }
  
  console.log('Sample data inserted successfully');
}

// Run setup if this script is executed directly
if (require.main === module) {
  setupTestDatabase().catch(console.error);
}

module.exports = setupTestDatabase; 