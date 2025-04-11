/**
 * Attendance Analysis Check Script
 * 
 * This script retrieves and displays attendance analysis data from the database
 */

const mysql = require('mysql2/promise');
const config = require('./config');

async function checkAttendanceAnalysis() {
  let connection;
  
  try {
    console.log('Connecting to MySQL database...');
    console.log(`Database: ${config.DB_CONFIG.database}`);
    console.log(`Environment: ${config.NODE_ENV}`);
    
    // Connect to the database
    connection = await mysql.createConnection(config.DB_CONFIG);
    console.log('Successfully connected to MySQL database');
    
    // Query attendance analysis data
    console.log('\nAttendance Analysis Results:');
    const [analyses] = await connection.query('SELECT * FROM attendance_analysis ORDER BY id DESC');
    
    if (analyses.length === 0) {
      console.log('No attendance analysis data found');
    } else {
      console.table(analyses);
      
      // Get the most recent analysis
      const latestAnalysis = analyses[0];
      
      // Get session dates for the latest analysis
      console.log(`\nSessions for Analysis ID ${latestAnalysis.id}:`);
      const [sessions] = await connection.query(
        'SELECT * FROM attendance_sessions WHERE analysis_id = ? ORDER BY id',
        [latestAnalysis.id]
      );
      
      if (sessions.length === 0) {
        console.log('No session data found');
      } else {
        console.table(sessions);
      }
      
      // Get top 10 students with highest attendance rate
      console.log('\nTop 10 Students by Attendance Rate:');
      const [topStudents] = await connection.query(
        'SELECT id, name, index_number, total_sessions, attended_sessions, attendance_rate FROM students ORDER BY attendance_rate DESC LIMIT 10'
      );
      
      if (topStudents.length === 0) {
        console.log('No student data found');
      } else {
        console.table(topStudents);
      }
      
      // Get bottom 10 students with lowest attendance rate
      console.log('\nBottom 10 Students by Attendance Rate:');
      const [bottomStudents] = await connection.query(
        'SELECT id, name, index_number, total_sessions, attended_sessions, attendance_rate FROM students ORDER BY attendance_rate ASC LIMIT 10'
      );
      
      if (bottomStudents.length === 0) {
        console.log('No student data found');
      } else {
        console.table(bottomStudents);
      }
      
      // Calculate attendance statistics
      console.log('\nAttendance Statistics:');
      const [stats] = await connection.query(`
        SELECT 
          COUNT(*) as total_students,
          AVG(attendance_rate) as average_rate,
          MAX(attendance_rate) as max_rate,
          MIN(attendance_rate) as min_rate,
          SUM(CASE WHEN attendance_rate >= 75 THEN 1 ELSE 0 END) as high_attendance,
          SUM(CASE WHEN attendance_rate < 75 AND attendance_rate >= 50 THEN 1 ELSE 0 END) as medium_attendance,
          SUM(CASE WHEN attendance_rate < 50 AND attendance_rate >= 25 THEN 1 ELSE 0 END) as low_attendance,
          SUM(CASE WHEN attendance_rate < 25 THEN 1 ELSE 0 END) as very_low_attendance
        FROM students
      `);
      
      if (stats.length > 0) {
        const stat = stats[0];
        console.log(`Total Students: ${stat.total_students}`);
        console.log(`Average Attendance Rate: ${parseFloat(stat.average_rate).toFixed(2)}%`);
        console.log(`Highest Attendance Rate: ${parseFloat(stat.max_rate).toFixed(2)}%`);
        console.log(`Lowest Attendance Rate: ${parseFloat(stat.min_rate).toFixed(2)}%`);
        console.log(`\nAttendance Distribution:`);
        console.log(`High Attendance (75-100%): ${stat.high_attendance} students (${(stat.high_attendance / stat.total_students * 100).toFixed(2)}%)`);
        console.log(`Medium Attendance (50-74%): ${stat.medium_attendance} students (${(stat.medium_attendance / stat.total_students * 100).toFixed(2)}%)`);
        console.log(`Low Attendance (25-49%): ${stat.low_attendance} students (${(stat.low_attendance / stat.total_students * 100).toFixed(2)}%)`);
        console.log(`Very Low Attendance (0-24%): ${stat.very_low_attendance} students (${(stat.very_low_attendance / stat.total_students * 100).toFixed(2)}%)`);
      }
    }
    
  } catch (error) {
    console.error('Error checking attendance analysis:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

// Run analysis check if script is called directly
if (require.main === module) {
  checkAttendanceAnalysis().catch(console.error);
}

module.exports = checkAttendanceAnalysis;