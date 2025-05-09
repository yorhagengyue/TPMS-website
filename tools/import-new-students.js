/**
 * New Students Import Utility
 * 
 * This script imports only new students from an Excel file
 * Default file: src/cca attendance system.xlsx
 * Run with: node tools/import-new-students.js
 * Or specify path: node tools/import-new-students.js path/to/excel.xlsx
 */

const db = require('../database');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// 默认Excel文件路径
const DEFAULT_EXCEL_PATH = path.join(__dirname, '../src/cca attendance system.xlsx');

async function importNewStudents(filePath) {
  console.log(`Reading Excel file from: ${filePath}`);
  
  // Read Excel file
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet);

  if (jsonData.length === 0) {
    console.error('Excel file is empty');
    process.exit(1);
  }

  console.log(`Found ${jsonData.length} students in Excel file`);
  
  const connection = await db.getConnection();
  let newUsers = 0;
  let existing = 0;
  let errors = 0;

  try {
    await connection.beginTransaction();

    // Collect all student IDs for a single database query
    const indexNumbers = jsonData.map(row => {
      const indexNum = (row['index number'] || row['Admission Numbers'] || row['Admission Number'] || '').toString().trim().toLowerCase();
      return indexNum;
    }).filter(id => id);

    // Get all existing students in a single query
    let existingStudentsMap = new Map();
    if (indexNumbers.length > 0) {
      const placeholders = indexNumbers.map((_, i) => db.isPostgres ? `$${i+1}` : '?').join(',');
      
      const query = db.isPostgres
        ? `SELECT id, LOWER(index_number) as index_number FROM students WHERE LOWER(index_number) IN (${placeholders})`
        : `SELECT id, LOWER(index_number) as index_number FROM students WHERE LOWER(index_number) IN (${placeholders})`;
      
      const existingStudents = await connection.query(query, indexNumbers);
      
      // Create a map for efficient lookups
      existingStudents.forEach(student => {
        existingStudentsMap.set(student.index_number.toLowerCase(), student.id);
      });
    }

    console.log(`Found ${existingStudentsMap.size} existing students in database`);

    // Process each student
    for (const row of jsonData) {
      const name = row['Name'] || '';
      const course = row['Course'] || '';
      const indexNumber = (row['index number'] || row['Admission Numbers'] || row['Admission Number'] || '').toString().trim();
      const email = row['Email'] || '';
      const phoneNumber = row['Phone Number'] || '';
      const totalSessions = parseInt(row['Total Number Training Sessions'] || 0);
      const attendanceRate = parseFloat(row['Percentage for Attendance'] || 0);
      const attendedSessions = Math.round((attendanceRate / 100) * totalSessions) || 0;
      
      // Skip records with missing required fields
      if (!name || !indexNumber) {
        console.error(`Skipping record with missing name or index number: ${JSON.stringify(row)}`);
        errors++;
        continue;
      }

      const normalizedIndexNumber = indexNumber.toLowerCase();
      
      try {
        // Check if student already exists using our map
        if (!existingStudentsMap.has(normalizedIndexNumber)) {
          // Insert new student
          const insertQuery = db.isPostgres
            ? 'INSERT INTO students (name, course, index_number, email, phone_number, total_sessions, attended_sessions, attendance_rate) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)'
            : 'INSERT INTO students (name, course, index_number, email, phone_number, total_sessions, attended_sessions, attendance_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
          
          await connection.query(insertQuery, [
            name, 
            course, 
            indexNumber, 
            email, 
            phoneNumber, 
            totalSessions, 
            attendedSessions, 
            attendanceRate
          ]);
          
          console.log(`ADDED: ${name} (${indexNumber})`);
          newUsers++;
        } else {
          // Skip existing students
          console.log(`EXISTS: ${name} (${indexNumber})`);
          existing++;
        }
      } catch (error) {
        console.error(`Error processing student ${name} (${indexNumber}):`, error);
        errors++;
      }
    }

    await connection.commit();
    console.log(`\nImport summary:`);
    console.log(`- ${jsonData.length} total students in Excel`);
    console.log(`- ${existing} already in database (skipped)`);
    console.log(`- ${newUsers} new students added`);
    console.log(`- ${errors} errors encountered`);
  } catch (error) {
    await connection.rollback();
    console.error('Transaction failed:', error);
  } finally {
    connection.release();
  }
}

// Main execution
async function main() {
  // 使用命令行参数提供的路径，或使用默认路径
  const filePath = process.argv.length > 2 
    ? path.resolve(process.argv[2])
    : DEFAULT_EXCEL_PATH;
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    console.error(`Please check that the Excel file exists at this location or specify the correct path.`);
    process.exit(1);
  }

  try {
    await importNewStudents(filePath);
    console.log('Import completed successfully');
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

// 仅当此脚本直接运行时才执行main函数
if (require.main === module) {
  main();
}

// 导出函数以便其他脚本可以使用
module.exports = { importNewStudents }; 