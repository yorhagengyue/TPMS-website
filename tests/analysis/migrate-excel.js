/**
 * Excel to MySQL Migration Script
 * 
 * This script reads Excel files (name list.xlsx and cca attendance system.xlsx)
 * and imports the data into MySQL database
 */

const mysql = require('mysql2/promise');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const config = require('./config');

// Database connection configuration
const dbConfig = config.DB_CONFIG;

// Excel file paths - search for Excel files in different directories
const searchPaths = [
  path.join(__dirname, 'src'),
  path.join(__dirname),
  path.join(__dirname, 'uploads')
];

// Student data file name patterns to search for
const studentFilePatterns = [
  'name list.xlsx',
  'namelist.xlsx',
  'student list.xlsx',
  'students.xlsx'
];

// Attendance file name patterns to search for
const attendanceFilePatterns = [
  'cca attendance system.xlsx',
  'attendance.xlsx',
  'cca attendance.xlsx'
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

// Migration function
async function migrateExcelToMySQL() {
  console.log('Starting Excel to MySQL migration...');
  console.log(`Database: ${config.DB_CONFIG.database}`);
  console.log(`Environment: ${config.NODE_ENV}`);
  
  // Find Excel files
  const studentListPath = findExcelFiles(studentFilePatterns);
  const attendanceSystemPath = findExcelFiles(attendanceFilePatterns);
  
  console.log(`Student list file: ${studentListPath || 'Not found'}`);
  console.log(`Attendance file: ${attendanceSystemPath || 'Not found'}`);
  
  if (!studentListPath) {
    console.log('No student list Excel file found in the specified directories.');
    console.log('Please place a student list Excel file (e.g., "name list.xlsx") in one of these directories:');
    searchPaths.forEach(dir => console.log(`- ${dir}`));
    return;
  }
  
  // Create MySQL connection
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database');
    
    // Import students from Excel
    await importStudents(connection, studentListPath);
    
    // Import attendance from Excel if available
    if (attendanceSystemPath) {
      await importAttendance(connection, attendanceSystemPath);
    } else {
      console.log('Attendance file not found, skipping attendance import.');
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error.message);
    if (error.message.includes('connect')) {
      console.log('\nDatabase connection issue. Please check:');
      console.log('1. MySQL server is running');
      console.log('2. Database credentials in .env file are correct');
      console.log(`3. Database ${dbConfig.database} exists`);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Import students from Excel
async function importStudents(connection, filePath) {
  try {
    console.log(`Reading student data from: ${filePath}`);
    
    // Read Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });
    
    console.log(`Found ${jsonData.length} student records`);
    
    // Check if the file has the expected columns
    const firstRow = jsonData[0] || {};
    const hasNameColumn = 'Name' in firstRow || 'name' in firstRow;
    const hasIndexColumn = 'index number' in firstRow || 'Index Number' in firstRow || 'Admin No.' in firstRow;
    
    if (!hasNameColumn || !hasIndexColumn) {
      console.log('Excel format is not as expected. Looking for columns: "Name" and "index number" or "Admin No."');
      console.log('Found columns:', Object.keys(firstRow).join(', '));
      
      // Try to identify the columns that might contain the required information
      console.log('\nAttempting to infer column mapping...');
      const possibleNameColumns = Object.keys(firstRow).filter(key => 
        key.toLowerCase().includes('name') || key.toLowerCase().includes('student')
      );
      
      const possibleIndexColumns = Object.keys(firstRow).filter(key => 
        key.toLowerCase().includes('number') || 
        key.toLowerCase().includes('index') || 
        key.toLowerCase().includes('id') ||
        key.toLowerCase().includes('admin')
      );
      
      if (possibleNameColumns.length > 0 || possibleIndexColumns.length > 0) {
        console.log('Possible name columns:', possibleNameColumns.join(', '));
        console.log('Possible index columns:', possibleIndexColumns.join(', '));
      }
      
      // Display sample data for debugging
      console.log('\nSample data from first row:');
      console.log(firstRow);
    }
    
    // Process each row
    let inserted = 0;
    let updated = 0;
    let errors = 0;
    
    for (const row of jsonData) {
      try {
        // Extract student information with flexible column names
        const name = row['Name'] || row['name'] || row['Name '] || row['NAME'] || row['Student Name'] || '';
        const course = row['Course'] || row['course'] || row['COURSE'] || '';
        const indexNumber = (row['index number'] || row['Index Number'] || row['Admin No.'] || row['ID'] || '').toString().trim();
        
        if (!name || !indexNumber) {
          console.log(`Skipping record - missing name or index number:`, JSON.stringify(row));
          errors++;
          continue;
        }
        
        // Check if student already exists
        const [existing] = await connection.query(
          'SELECT id FROM students WHERE index_number = ?', 
          [indexNumber.toLowerCase()]
        );
        
        if (existing.length === 0) {
          // Insert new student
          await connection.query(
            'INSERT INTO students (name, course, index_number) VALUES (?, ?, ?)',
            [name, course, indexNumber.toLowerCase()]
          );
          inserted++;
        } else {
          // Update existing student
          await connection.query(
            'UPDATE students SET name = ?, course = ? WHERE index_number = ?',
            [name, course, indexNumber.toLowerCase()]
          );
          updated++;
        }
      } catch (error) {
        console.error(`Error processing student record:`, error.message);
        errors++;
      }
    }
    
    console.log(`Student migration results:`);
    console.log(`- Inserted: ${inserted}`);
    console.log(`- Updated: ${updated}`);
    console.log(`- Errors: ${errors}`);
    
  } catch (error) {
    console.error('Failed to import students:', error.message);
    throw error;
  }
}

// Import attendance from Excel
async function importAttendance(connection, filePath) {
  try {
    console.log(`Reading attendance data from: ${filePath}`);
    
    // Read Excel file
    const workbook = XLSX.readFile(filePath);
    
    // Get all sheets
    const sheetNames = workbook.SheetNames;
    
    console.log(`Found ${sheetNames.length} sheets in attendance file`);
    
    let totalImported = 0;
    let totalErrors = 0;
    
    // Process each sheet
    for (const sheetName of sheetNames) {
      console.log(`\nProcessing sheet: ${sheetName}`);
      
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });
      
      console.log(`Found ${jsonData.length} records in sheet ${sheetName}`);
      
      // Display sample data for debugging
      if (jsonData.length > 0) {
        console.log('Sample data (first row):');
        console.log(jsonData[0]);
      }
      
      let inserted = 0;
      let errors = 0;
      
      for (const row of jsonData) {
        try {
          // Extract data from attendance record with flexible column names
          const indexNumber = (
            row['Student ID'] || 
            row['index number'] || 
            row['Index Number'] || 
            row['Admin No.'] || 
            row['Admin No.'] || 
            ''
          ).toString().trim();
          
          // Skip if no index number
          if (!indexNumber) {
            errors++;
            continue;
          }
          
          // Convert date formats
          let checkInTime;
          if (row['Check-in Time']) {
            checkInTime = new Date(row['Check-in Time']);
          } else if (row['Date'] || row['Date ']) {
            const dateStr = row['Date'] || row['Date '];
            checkInTime = new Date(dateStr);
          } else if (row['Actual Time']) {
            // Handle Excel date numbers
            const excelDate = Number(row['Actual Time']);
            if (!isNaN(excelDate)) {
              // Excel dates are days since Dec 30, 1899
              const date = new Date((excelDate - 25569) * 86400 * 1000);
              checkInTime = date;
            }
          } else {
            checkInTime = new Date();
          }
          
          const locationLat = parseFloat(row['Latitude'] || '1.3456');
          const locationLng = parseFloat(row['Longitude'] || '103.9321');
          
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
      
      totalImported += inserted;
      totalErrors += errors;
      
      console.log(`Results for sheet ${sheetName}:`);
      console.log(`- Records inserted: ${inserted}`);
      console.log(`- Errors: ${errors}`);
    }
    
    console.log(`\nTotal attendance migration results:`);
    console.log(`- Total records inserted: ${totalImported}`);
    console.log(`- Total errors: ${totalErrors}`);
    
  } catch (error) {
    console.error('Failed to import attendance:', error.message);
    throw error;
  }
}

// Run the migration
migrateExcelToMySQL(); 