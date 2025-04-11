/**
 * Sample Data Migration Script for TPMS
 * 
 * This script imports the sample Excel files created by create-sample-excel.js
 */

const mysql = require('mysql2/promise');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tpms_db'
};

// Fixed paths for sample files
const studentListPath = path.join(__dirname, 'uploads', 'students.xlsx');
const attendanceSystemPath = path.join(__dirname, 'uploads', 'attendance.xlsx');

// Migration function
async function migrateSampleDataToMySQL() {
  console.log('Starting sample data migration to MySQL...');
  
  // Verify files exist
  if (!fs.existsSync(studentListPath)) {
    console.log(`Sample student list file not found at: ${studentListPath}`);
    return;
  }
  
  if (!fs.existsSync(attendanceSystemPath)) {
    console.log(`Sample attendance file not found at: ${attendanceSystemPath}`);
    return;
  }
  
  console.log(`Student list file: ${studentListPath}`);
  console.log(`Attendance file: ${attendanceSystemPath}`);
  
  // Create MySQL connection
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database');
    
    // Clear existing sample data
    await clearExistingSampleData(connection);
    
    // Import students from Excel
    await importStudents(connection);
    
    // Import attendance from Excel
    await importAttendance(connection);
    
    console.log('Sample data migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Clear existing sample data
async function clearExistingSampleData(connection) {
  console.log('Clearing existing sample data...');
  
  try {
    // Clear attendance records
    await connection.query('DELETE FROM attendance');
    console.log('- Attendance records cleared');
    
    // Clear student records with index numbers matching our pattern
    await connection.query('DELETE FROM students WHERE index_number LIKE "2401%"');
    console.log('- Student records cleared');
  } catch (error) {
    console.error('Error clearing existing data:', error.message);
    throw error;
  }
}

// Import students from Excel
async function importStudents(connection) {
  try {
    console.log(`Reading student data from: ${studentListPath}`);
    
    // Read Excel file
    const workbook = XLSX.readFile(studentListPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Found ${jsonData.length} student records`);
    
    // Process each row
    let inserted = 0;
    let errors = 0;
    
    for (const row of jsonData) {
      try {
        const name = row['Name'] || '';
        const course = row['Course'] || '';
        const indexNumber = (row['index number'] || '').toString().trim();
        
        if (!name || !indexNumber) {
          console.log(`Skipping record - missing name or index number: ${JSON.stringify(row)}`);
          errors++;
          continue;
        }
        
        // Insert student
        await connection.query(
          'INSERT INTO students (name, course, index_number) VALUES (?, ?, ?)',
          [name, course, indexNumber.toLowerCase()]
        );
        inserted++;
      } catch (error) {
        console.error(`Error processing student record:`, error.message);
        errors++;
      }
    }
    
    console.log(`Student import results:`);
    console.log(`- Inserted: ${inserted}`);
    console.log(`- Errors: ${errors}`);
    
  } catch (error) {
    console.error('Failed to import students:', error.message);
    throw error;
  }
}

// Import attendance from Excel
async function importAttendance(connection) {
  try {
    console.log(`Reading attendance data from: ${attendanceSystemPath}`);
    
    // Read Excel file
    const workbook = XLSX.readFile(attendanceSystemPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Found ${jsonData.length} attendance records`);
    
    // Process each row
    let inserted = 0;
    let errors = 0;
    
    for (const row of jsonData) {
      try {
        const indexNumber = (row['Admin No.'] || '').toString().trim();
        const checkInTime = new Date(row['Check-in Time']);
        const locationLat = parseFloat(row['Latitude'] || '1.3456');
        const locationLng = parseFloat(row['Longitude'] || '103.9321');
        
        if (!indexNumber) {
          errors++;
          continue;
        }
        
        // Find the student ID
        const [student] = await connection.query(
          'SELECT id FROM students WHERE index_number = ?',
          [indexNumber.toLowerCase()]
        );
        
        if (student.length === 0) {
          errors++;
          continue;
        }
        
        // Insert attendance record
        await connection.query(
          'INSERT INTO attendance (student_id, check_in_time, location_lat, location_lng) VALUES (?, ?, ?, ?)',
          [student[0].id, checkInTime, locationLat, locationLng]
        );
        
        inserted++;
      } catch (error) {
        console.error(`Error processing attendance record:`, error.message);
        errors++;
      }
    }
    
    console.log(`Attendance import results:`);
    console.log(`- Inserted: ${inserted}`);
    console.log(`- Errors: ${errors}`);
    
  } catch (error) {
    console.error('Failed to import attendance:', error.message);
    throw error;
  }
}

// Run the migration
migrateSampleDataToMySQL(); 