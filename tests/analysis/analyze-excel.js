/**
 * Excel Analysis Script using Python with pandas
 * 
 * This script uses Python to analyze Excel data and stores results in database
 */

const { PythonShell } = require('python-shell');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
const config = require('./config');
const bcrypt = require('bcrypt');

// Search paths for Excel files
const searchPaths = [
  path.join(__dirname, 'src'),
  path.join(__dirname),
  path.join(__dirname, 'uploads')
];

// File name patterns to search for
const filePatterns = [
  'name list.xlsx',
  'namelist.xlsx',
  'student list.xlsx',
  'students.xlsx',
  'cca attendance system.xlsx'
];

// Find Excel files based on patterns
function findExcelFiles(patterns) {
  for (const pattern of patterns) {
    for (const dir of searchPaths) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          if (file.toLowerCase().includes(pattern.toLowerCase()) && file.endsWith('.xlsx')) {
            return path.join(dir, file);
          }
        }
      }
    }
  }
  return null;
}

async function analyzeExcel() {
  console.log('Starting Excel analysis with pandas...');
  console.log(`Environment: ${config.NODE_ENV}`);
  console.log(`Database: ${config.DB_CONFIG.database}`);
  
  // Find Excel file
  const excelPath = findExcelFiles(filePatterns);
  
  if (!excelPath) {
    console.error('No Excel file found in the specified directories.');
    console.log('Please place an Excel file (e.g., "name list.xlsx") in one of these directories:');
    searchPaths.forEach(dir => console.log(`- ${dir}`));
    return;
  }
  
  console.log(`Found Excel file: ${excelPath}`);
  
  try {
    // Run Python script for analysis
    const options = {
      mode: 'json',
      pythonPath: 'python', // Use 'python3' if needed
      args: [excelPath]
    };
    
    console.log('Running Python analysis script...');
    const results = await PythonShell.run('analyze_excel.py', options);
    
    // Results should be a JSON object
    const analysisResult = results[0];
    
    if (analysisResult.error) {
      console.error(`Python analysis error: ${analysisResult.error}`);
      return;
    }
    
    console.log('Excel analysis completed successfully');
    console.log(`Found ${analysisResult.students.length} students`);
    console.log(`Total sessions: ${analysisResult.summary.total_sessions}`);
    console.log(`Average attendance rate: ${analysisResult.summary.average_attendance_rate}%`);
    
    // Connect to database and store results
    await storeResultsInDatabase(analysisResult);
    
  } catch (error) {
    console.error('Error during Excel analysis:', error.message);
  }
}

async function storeResultsInDatabase(analysisResult) {
  let connection;
  
  try {
    console.log('Connecting to database to store analysis results...');
    connection = await mysql.createConnection(config.DB_CONFIG);
    
    // Check if users table exists, if not create it
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        index_number VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255),
        role ENUM('admin', 'student', 'teacher') NOT NULL DEFAULT 'student',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL,
        FOREIGN KEY (index_number) REFERENCES students(index_number) ON UPDATE CASCADE
      )
    `);
    
    // Check if analysis_results table exists, if not create it
    await connection.query(`
      CREATE TABLE IF NOT EXISTS analysis_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_students INT NOT NULL,
        total_sessions INT NOT NULL,
        average_attendance_rate DECIMAL(5,2) NOT NULL
      )
    `);
    
    // Insert analysis summary
    const [summaryResult] = await connection.query(
      'INSERT INTO analysis_results (total_students, total_sessions, average_attendance_rate) VALUES (?, ?, ?)',
      [
        analysisResult.summary.total_students,
        analysisResult.summary.total_sessions,
        analysisResult.summary.average_attendance_rate
      ]
    );
    
    const analysisId = summaryResult.insertId;
    console.log(`Analysis summary saved with ID: ${analysisId}`);
    
    // Process each student
    let studentsUpdated = 0;
    
    for (const student of analysisResult.students) {
      try {
        // First ensure student exists in students table
        const [existingStudents] = await connection.query(
          'SELECT id FROM students WHERE index_number = ?',
          [student.index_number]
        );
        
        if (existingStudents.length === 0) {
          // Insert student if not exists
          await connection.query(
            'INSERT INTO students (name, course, index_number) VALUES (?, ?, ?)',
            [student.name, student.course || '', student.index_number]
          );
          studentsUpdated++;
        } else {
          // Update existing student
          await connection.query(
            'UPDATE students SET name = ?, course = ? WHERE index_number = ?',
            [student.name, student.course || '', student.index_number]
          );
          studentsUpdated++;
        }
        
        // Update student attendance data if available
        if (student.attendance) {
          // Store attendance statistics
          await connection.query(`
            UPDATE students 
            SET total_sessions = ?, 
                attended_sessions = ?, 
                attendance_rate = ?
            WHERE index_number = ?
          `, [
            student.attendance.total_sessions,
            student.attendance.attended,
            student.attendance.attendance_rate,
            student.index_number
          ]);
        }
      } catch (error) {
        console.error(`Error processing student ${student.index_number}:`, error.message);
      }
    }
    
    console.log(`Students updated: ${studentsUpdated}`);
    console.log('Database update completed');
    
  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run analysis if this script is executed directly
if (require.main === module) {
  analyzeExcel().catch(console.error);
}

module.exports = analyzeExcel; 