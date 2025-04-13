/**
 * Student Activity Test Script
 * 
 * This script tests the student attendance and CCA session functionality
 * Usage: node tools/test-activity.js [student_id]
 * Example: node tools/test-activity.js 2403880d
 */

const mysql = require('mysql2/promise');
const config = require('../config');

// Get student ID from command line or use default
const testStudentId = process.argv[2] || '2403880d';

/**
 * Check student attendance records
 */
async function checkAttendance(studentId) {
  let connection;
  
  try {
    console.log(`\n=== CHECKING ATTENDANCE FOR STUDENT ID: ${studentId} ===`);
    connection = await mysql.createConnection(config.DB_CONFIG);
    
    // Get student info
    const [students] = await connection.query(
      'SELECT * FROM students WHERE index_number = ?',
      [studentId]
    );
    
    if (students.length === 0) {
      console.log(`Student ID ${studentId} not found in database`);
      return;
    }
    
    const student = students[0];
    console.log('\nStudent information:');
    console.table({
      id: student.id,
      name: student.name,
      index_number: student.index_number,
      course: student.course,
      total_sessions: student.total_sessions,
      attended_sessions: student.attended_sessions,
      attendance_rate: student.attendance_rate,
      last_attendance: student.last_attendance
    });
    
    // Get attendance records
    const [attendance] = await connection.query(
      'SELECT * FROM attendance WHERE student_id = ? ORDER BY check_in_time DESC',
      [student.id]
    );
    
    console.log(`\nAttendance Records (${attendance.length} total):`);
    if (attendance.length === 0) {
      console.log('No attendance records found for this student');
    } else {
      console.table(attendance.slice(0, 10).map(record => ({
        id: record.id,
        date: new Date(record.check_in_time).toLocaleDateString(),
        time: new Date(record.check_in_time).toLocaleTimeString(),
        location: record.location_lat && record.location_lng ? 
          `${record.location_lat.toFixed(4)}, ${record.location_lng.toFixed(4)}` : 'N/A',
        session_id: record.session_id || 'N/A'
      })));
      
      if (attendance.length > 10) {
        console.log(`... and ${attendance.length - 10} more records`);
      }
    }
    
    // Check if attendance matches the summary in students table
    if (attendance.length !== student.attended_sessions) {
      console.log('\n⚠️ WARNING: Attendance record count does not match attended_sessions in student table:');
      console.log(`- Attendance records: ${attendance.length}`);
      console.log(`- Student attended_sessions: ${student.attended_sessions}`);
    }
    
  } catch (error) {
    console.error('Error checking attendance:', error);
  } finally {
    if (connection) await connection.end();
  }
}

/**
 * Check CCA sessions
 */
async function checkCCASessions() {
  let connection;
  
  try {
    console.log('\n=== CHECKING CCA SESSIONS ===');
    connection = await mysql.createConnection(config.DB_CONFIG);
    
    // Get CCA sessions
    const [sessions] = await connection.query(
      'SELECT * FROM cca_sessions ORDER BY start_time DESC'
    );
    
    console.log(`\nCCA Sessions (${sessions.length} total):`);
    if (sessions.length === 0) {
      console.log('No CCA sessions found in database');
    } else {
      console.table(sessions.slice(0, 10).map(session => ({
        id: session.id,
        title: session.title,
        department: session.department_id,
        date: new Date(session.start_time).toLocaleDateString(),
        start: new Date(session.start_time).toLocaleTimeString(),
        end: new Date(session.end_time).toLocaleTimeString(),
        location: session.location
      })));
      
      if (sessions.length > 10) {
        console.log(`... and ${sessions.length - 10} more sessions`);
      }
    }
    
    // Check upcoming sessions
    const now = new Date();
    const [upcomingSessions] = await connection.query(
      'SELECT * FROM cca_sessions WHERE start_time > ? ORDER BY start_time ASC LIMIT 5',
      [now]
    );
    
    console.log('\nUpcoming CCA Sessions:');
    if (upcomingSessions.length === 0) {
      console.log('No upcoming CCA sessions found');
    } else {
      console.table(upcomingSessions.map(session => ({
        id: session.id,
        title: session.title,
        department: session.department_id,
        date: new Date(session.start_time).toLocaleDateString(),
        start: new Date(session.start_time).toLocaleTimeString(),
        end: new Date(session.end_time).toLocaleTimeString()
      })));
    }
    
  } catch (error) {
    console.error('Error checking CCA sessions:', error);
  } finally {
    if (connection) await connection.end();
  }
}

/**
 * Test creating a mock attendance record
 */
async function testCreateAttendance(studentId) {
  let connection;
  
  try {
    console.log(`\n=== TESTING ATTENDANCE CREATION FOR STUDENT ID: ${studentId} ===`);
    connection = await mysql.createConnection(config.DB_CONFIG);
    
    // Get student info
    const [students] = await connection.query(
      'SELECT * FROM students WHERE index_number = ?',
      [studentId]
    );
    
    if (students.length === 0) {
      console.log(`Student ID ${studentId} not found in database`);
      return;
    }
    
    const student = students[0];
    
    // Check for active CCA session
    const now = new Date();
    const [activeSessions] = await connection.query(
      'SELECT * FROM cca_sessions WHERE start_time <= ? AND end_time >= ? LIMIT 1',
      [now, now]
    );
    
    let sessionId = null;
    if (activeSessions.length > 0) {
      sessionId = activeSessions[0].id;
      console.log(`Found active CCA session: ${activeSessions[0].title} (ID: ${sessionId})`);
    } else {
      console.log('No active CCA session found, continuing without session ID');
    }
    
    // Create a mock location (TP campus approximate coordinates)
    const locationLat = 1.3456 + (Math.random() * 0.002 - 0.001);
    const locationLng = 103.9321 + (Math.random() * 0.002 - 0.001);
    
    // Insert attendance record
    const [result] = await connection.query(
      'INSERT INTO attendance (student_id, check_in_time, location_lat, location_lng, session_id) VALUES (?, NOW(), ?, ?, ?)',
      [student.id, locationLat, locationLng, sessionId]
    );
    
    console.log('\nCreated test attendance record:');
    console.log(`- Student: ${student.name} (ID: ${student.id})`);
    console.log(`- Attendance ID: ${result.insertId}`);
    console.log(`- Location: ${locationLat.toFixed(6)}, ${locationLng.toFixed(6)}`);
    console.log(`- Session ID: ${sessionId || 'N/A'}`);
    
    // Update student attendance stats
    const [updateResult] = await connection.query(`
      UPDATE students SET 
        attended_sessions = attended_sessions + 1,
        attendance_rate = (attended_sessions + 1) / (CASE WHEN total_sessions = 0 THEN 1 ELSE total_sessions END) * 100,
        last_attendance = NOW()
      WHERE id = ?
    `, [student.id]);
    
    console.log('\nUpdated student attendance stats:');
    console.log(`- Rows affected: ${updateResult.affectedRows}`);
    
    // Get updated student info
    const [updatedStudents] = await connection.query(
      'SELECT * FROM students WHERE id = ?',
      [student.id]
    );
    
    if (updatedStudents.length > 0) {
      const updatedStudent = updatedStudents[0];
      console.log('\nUpdated student information:');
      console.table({
        id: updatedStudent.id,
        name: updatedStudent.name,
        total_sessions: updatedStudent.total_sessions,
        attended_sessions: updatedStudent.attended_sessions,
        attendance_rate: updatedStudent.attendance_rate,
        last_attendance: updatedStudent.last_attendance
      });
    }
    
  } catch (error) {
    console.error('Error creating test attendance:', error);
  } finally {
    if (connection) await connection.end();
  }
}

async function printUsageStatistics() {
  let connection;
  
  try {
    console.log('\n=== SYSTEM USAGE STATISTICS ===');
    connection = await mysql.createConnection(config.DB_CONFIG);
    
    // Get total counts
    const [counts] = await connection.query(`
      SELECT 
        (SELECT COUNT(*) FROM students) AS total_students,
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM attendance) AS total_attendance,
        (SELECT COUNT(*) FROM cca_sessions) AS total_sessions
    `);
    
    console.log('\nSystem Counts:');
    console.table(counts[0]);
    
    // Get attendance statistics
    const [stats] = await connection.query(`
      SELECT 
        AVG(attendance_rate) as average_rate,
        MAX(attendance_rate) as max_rate,
        MIN(attendance_rate) as min_rate
      FROM students
      WHERE attended_sessions > 0
    `);
    
    if (stats.length > 0) {
      console.log('\nAttendance Statistics:');
      console.table({
        'Average Rate': parseFloat(stats[0].average_rate).toFixed(2) + '%',
        'Maximum Rate': parseFloat(stats[0].max_rate).toFixed(2) + '%',
        'Minimum Rate': parseFloat(stats[0].min_rate).toFixed(2) + '%'
      });
    }
    
    // Get students with most attendances
    const [topStudents] = await connection.query(`
      SELECT 
        s.id, s.name, s.index_number, s.attended_sessions, s.attendance_rate
      FROM 
        students s
      WHERE 
        s.attended_sessions > 0
      ORDER BY 
        s.attended_sessions DESC, s.attendance_rate DESC
      LIMIT 5
    `);
    
    console.log('\nTop 5 Students by Attendance:');
    if (topStudents.length === 0) {
      console.log('No attendance data found');
    } else {
      console.table(topStudents);
    }
    
  } catch (error) {
    console.error('Error getting usage statistics:', error);
  } finally {
    if (connection) await connection.end();
  }
}

async function runTests() {
  console.log('========================================');
  console.log('  TPMS Student Activity Test Tool');
  console.log(`  Environment: ${config.NODE_ENV}`);
  console.log(`  Database: ${config.DB_CONFIG.database}`);
  console.log('========================================');
  
  // 1. Check student attendance
  await checkAttendance(testStudentId);
  
  // 2. Check CCA sessions
  await checkCCASessions();
  
  // 3. Print system usage statistics
  await printUsageStatistics();
  
  // 4. Ask user if they want to create a test attendance record
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  readline.question('\nDo you want to create a test attendance record? (y/n): ', async (answer) => {
    if (answer.toLowerCase() === 'y') {
      await testCreateAttendance(testStudentId);
    }
    
    console.log('\nTests completed');
    readline.close();
  });
}

// Run tests
runTests().catch(console.error); 