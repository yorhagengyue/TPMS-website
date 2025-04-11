/**
 * CCA Attendance System Analysis Script
 * 
 * This script uses Python to analyze the CCA attendance system Excel file
 * and stores results in database
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

// File name patterns to search for - focus on attendance system files
const filePatterns = [
  'cca attendance system.xlsx',
  'attendance.xlsx',
  'cca_attendance.xlsx',
  'attendance_system.xlsx'
];

// Find Excel files based on patterns
function findAttendanceFile(patterns) {
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

async function analyzeAttendance() {
  console.log('Starting CCA Attendance System analysis...');
  console.log(`Environment: ${config.NODE_ENV}`);
  console.log(`Database: ${config.DB_CONFIG.database}`);
  
  // Find attendance Excel file
  const excelPath = findAttendanceFile(filePatterns);
  
  if (!excelPath) {
    console.error('No CCA Attendance System file found in the specified directories.');
    console.log('Please place an attendance file (e.g., "cca attendance system.xlsx") in one of these directories:');
    searchPaths.forEach(dir => console.log(`- ${dir}`));
    return;
  }
  
  console.log(`Found CCA Attendance System file: ${excelPath}`);
  
  try {
    // Run Python script for analysis
    const options = {
      mode: 'json',
      pythonPath: 'python', // Use 'python3' if needed
      args: [excelPath]
    };
    
    console.log('Running Python attendance analysis script...');
    const results = await PythonShell.run('analyze_attendance.py', options);
    
    // Results should be a JSON object
    const analysisResult = results[0];
    
    if (analysisResult.error) {
      console.error(`Python analysis error: ${analysisResult.error}`);
      return;
    }
    
    console.log('CCA Attendance analysis completed successfully');
    console.log(`Found ${analysisResult.students.length} students with attendance records`);
    console.log(`Total sessions analyzed: ${analysisResult.summary.total_sessions}`);
    console.log(`Average attendance rate: ${analysisResult.summary.average_attendance_rate}%`);
    
    // Connect to database and store results
    await storeAttendanceResultsInDatabase(analysisResult);
    
  } catch (error) {
    console.error('Error during attendance analysis:', error.message);
  }
}

async function storeAttendanceResultsInDatabase(analysisResult) {
  let connection;
  
  try {
    console.log('Connecting to database to store attendance analysis results...');
    connection = await mysql.createConnection(config.DB_CONFIG);
    
    // Ensure required tables exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS attendance_analysis (
        id INT AUTO_INCREMENT PRIMARY KEY,
        analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_students INT NOT NULL,
        total_sessions INT NOT NULL,
        average_attendance_rate DECIMAL(5,2) NOT NULL
      )
    `);
    
    await connection.query(`
      CREATE TABLE IF NOT EXISTS attendance_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        analysis_id INT NOT NULL,
        session_date VARCHAR(50) NOT NULL,
        FOREIGN KEY (analysis_id) REFERENCES attendance_analysis(id) ON DELETE CASCADE
      )
    `);
    
    // Insert analysis summary
    const [summaryResult] = await connection.query(
      'INSERT INTO attendance_analysis (total_students, total_sessions, average_attendance_rate) VALUES (?, ?, ?)',
      [
        analysisResult.summary.total_students,
        analysisResult.summary.total_sessions,
        analysisResult.summary.average_attendance_rate
      ]
    );
    
    const analysisId = summaryResult.insertId;
    console.log(`Attendance analysis summary saved with ID: ${analysisId}`);
    
    // Store session dates
    for (const session of analysisResult.summary.sessions) {
      await connection.query(
        'INSERT INTO attendance_sessions (analysis_id, session_date) VALUES (?, ?)',
        [analysisId, session.toString()]
      );
    }
    
    // Process each student's attendance data
    let studentsUpdated = 0;
    let usersCreated = 0;
    let usersSkipped = 0;
    
    for (const student of analysisResult.students) {
      try {
        // Check if student exists in the database
        const [existingStudents] = await connection.query(
          'SELECT id FROM students WHERE index_number = ?',
          [student.index_number]
        );
        
        let studentId;
        
        if (existingStudents.length === 0) {
          // Insert new student - remove email field from query
          const [insertResult] = await connection.query(
            'INSERT INTO students (name, course, index_number, total_sessions, attended_sessions, attendance_rate) VALUES (?, ?, ?, ?, ?, ?)',
            [
              student.name,
              student.course || '',
              student.index_number,
              student.attendance.total_sessions,
              student.attendance.attended,
              student.attendance.attendance_rate
            ]
          );
          studentId = insertResult.insertId;
        } else {
          // Update existing student - remove email field from query
          studentId = existingStudents[0].id;
          await connection.query(
            `UPDATE students 
             SET name = ?, 
                 course = ?, 
                 total_sessions = ?, 
                 attended_sessions = ?, 
                 attendance_rate = ?
             WHERE id = ?`,
            [
              student.name,
              student.course || '',
              student.attendance.total_sessions,
              student.attendance.attended,
              student.attendance.attendance_rate,
              studentId
            ]
          );
        }
        
        studentsUpdated++;
        
        // 使用student_id字段检查用户是否存在
        const [existingUsers] = await connection.query(
          'SELECT id FROM users WHERE student_id = ?',
          [studentId]
        );
        
        // 检查用户名是否已被使用
        const username = student.index_number.toLowerCase();
        const [duplicateUsernames] = await connection.query(
          'SELECT id FROM users WHERE username = ? AND student_id != ?',
          [username, studentId]
        );
        
        if (existingUsers.length === 0) {
          // 检查是否有用户名冲突
          if (duplicateUsernames.length > 0) {
            console.log(`跳过创建用户 ${username}：用户名已被其他学生使用`);
            usersSkipped++;
            continue;
          }
          
          try {
            // 生成默认密码
            const sanitizedName = student.name.replace(/\s+/g, '');
            const namePart = sanitizedName.length >= 4 ? sanitizedName.slice(-4).toLowerCase() : sanitizedName.toLowerCase();
            const indexPart = student.index_number.slice(0, 4).toLowerCase();
            const defaultPassword = `${indexPart}${namePart}`;
            
            // 加密密码
            const passwordHash = await bcrypt.hash(defaultPassword, 10);
            
            // 创建用户
            await connection.query(
              'INSERT INTO users (username, password_hash, student_id, role) VALUES (?, ?, ?, ?)',
              [username, passwordHash, studentId, 'student']
            );
            
            usersCreated++;
          } catch (insertError) {
            // 如果插入失败但不是因为重复用户名，则记录错误
            if (!insertError.message.includes('Duplicate entry') && !insertError.message.includes('ER_DUP_ENTRY')) {
              console.error(`创建用户时出错 ${student.index_number}:`, insertError.message);
            } else {
              usersSkipped++;
              console.log(`跳过创建用户 ${username}：用户名已存在`);
            }
          }
        } else {
          usersSkipped++;
        }
        
      } catch (error) {
        // 只记录非重复键错误
        if (!error.message.includes('Duplicate entry') && !error.message.includes('ER_DUP_ENTRY')) {
          console.error(`处理学生数据时出错 ${student.index_number}:`, error.message);
        }
      }
    }
    
    console.log(`Students updated in database: ${studentsUpdated}`);
    console.log(`User accounts created: ${usersCreated}`);
    console.log(`User accounts skipped: ${usersSkipped}`);
    console.log('Attendance data update completed');
    
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
  analyzeAttendance().catch(console.error);
}

module.exports = analyzeAttendance; 