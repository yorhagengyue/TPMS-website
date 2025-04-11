/**
 * Database Check Script for TPMS
 * 
 * This script connects to the MySQL database and retrieves table information
 */

const mysql = require('mysql2/promise');
const config = require('./config');

async function checkDatabase() {
  try {
    console.log('Connecting to MySQL database...');
    console.log(`Database: ${config.DB_CONFIG.database}`);
    console.log(`Environment: ${config.NODE_ENV}`);
    
    // Create MySQL connection
    const connection = await mysql.createConnection(config.DB_CONFIG);
    
    console.log('Successfully connected to MySQL database');
    
    // Check tables
    console.log('\nChecking database tables:');
    const [tables] = await connection.query('SHOW TABLES');
    
    if (tables.length === 0) {
      console.log('No tables found in the database');
    } else {
      console.log(`Found ${tables.length} tables:`);
      tables.forEach(table => {
        const tableName = Object.values(table)[0];
        console.log(`- ${tableName}`);
      });
    }
    
    // Check data in students table
    const [studentCount] = await connection.query('SELECT COUNT(*) as count FROM students');
    console.log(`\nNumber of records in students table: ${studentCount[0].count}`);
    
    if (studentCount[0].count > 0) {
      console.log('\nSample student records:');
      const [students] = await connection.query('SELECT * FROM students LIMIT 5');
      console.table(students);
    }
    
    // Check data in attendance table
    const [attendanceCount] = await connection.query('SELECT COUNT(*) as count FROM attendance');
    console.log(`\nNumber of records in attendance table: ${attendanceCount[0].count}`);
    
    if (attendanceCount[0].count > 0) {
      console.log('\nSample attendance records:');
      const [attendance] = await connection.query(`
        SELECT a.id, s.name, s.index_number, a.check_in_time, a.location_lat, a.location_lng 
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        LIMIT 5
      `);
      console.table(attendance);
    }
    
    // Close connection
    await connection.end();
    console.log('\nDatabase connection closed');
    
  } catch (error) {
    console.error('Error checking database:', error.message);
    if (error.message.includes('connect')) {
      console.log('\nTroubleshooting connection issues:');
      console.log('1. Ensure MySQL server is running');
      console.log('2. Check the credentials in .env file');
      console.log('3. Verify the database exists');
      console.log('4. Make sure MySQL port (default 3306) is not blocked by firewall');
    }
  }
}

// Run the check
checkDatabase(); 