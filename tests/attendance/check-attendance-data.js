/**
 * Database Attendance Data Check Script
 * 
 * This script checks if the database contains the attendance data shown in the Excel file
 */

const mysql = require('mysql2/promise');
const config = require('./config');

async function checkAttendanceData() {
  let connection;
  
  try {
    console.log('Connecting to MySQL database...');
    console.log(`Database: ${config.DB_CONFIG.database}`);
    console.log(`Environment: ${config.NODE_ENV}`);
    
    // Connect to the database
    connection = await mysql.createConnection(config.DB_CONFIG);
    console.log('Successfully connected to MySQL database');
    
    // 1. 检查几个特定学生是否存在于数据库中（从图片中选择）
    console.log('\n检查图片中的学生是否存在于数据库中:');
    const targetStudents = [
      { name: 'Chew Khai Yeoh Caven', index_number: '2401360i' },
      { name: 'Heng Lexuan Lovelle', index_number: '2401771g' },
      { name: 'Ong ban cheong bill', index_number: '2304772c' },
      { name: 'Ling De Yuan Jimmy', index_number: '2400496b' },
      { name: 'Geng Yue', index_number: '2403880d' },
      { name: 'LAU JIA QING ISAAC', index_number: '2401848c' }
    ];
    
    for (const student of targetStudents) {
      const [rows] = await connection.query(
        'SELECT id, name, index_number, total_sessions, attended_sessions, attendance_rate FROM students WHERE index_number = ?',
        [student.index_number]
      );
      
      if (rows.length > 0) {
        console.log(`✓ 找到学生: ${student.name} (${student.index_number})`);
        console.log(`  - 总课时: ${rows[0].total_sessions || 'N/A'}`);
        console.log(`  - 已出勤: ${rows[0].attended_sessions || 'N/A'}`);
        console.log(`  - 出勤率: ${rows[0].attendance_rate || 'N/A'}%`);
      } else {
        console.log(`✗ 未找到学生: ${student.name} (${student.index_number})`);
      }
      console.log('------------------------');
    }
    
    // 2. 检查数据库中学生总数
    const [studentCount] = await connection.query('SELECT COUNT(*) as count FROM students');
    console.log(`\n数据库中的学生总数: ${studentCount[0].count}`);
    
    // 3. 检查图片中显示的学生总培训课时是否与数据库匹配
    console.log('\n检查特定学生的培训课时数据:');
    const sessionsData = [
      { name: 'Chew Khai Yeoh Caven', index_number: '2401360i', sessions: 30 },
      { name: 'Heng Lexuan Lovelle', index_number: '2401771g', sessions: 27 },
      { name: 'Ong ban cheong bill', index_number: '2304772c', sessions: 24 },
      { name: 'LAU JIA QING ISAAC', index_number: '2401848c', sessions: 21 }
    ];
    
    for (const data of sessionsData) {
      const [rows] = await connection.query(
        'SELECT total_sessions FROM students WHERE index_number = ?',
        [data.index_number]
      );
      
      if (rows.length > 0) {
        const dbSessions = rows[0].total_sessions || 0;
        const matches = dbSessions == data.sessions;
        console.log(`${matches ? '✓' : '✗'} ${data.name}: 图片显示=${data.sessions}, 数据库=${dbSessions}`);
      } else {
        console.log(`✗ 未找到学生: ${data.name}`);
      }
    }
    
    // 4. 检查考勤分析结果是否存在
    console.log('\n检查考勤分析结果:');
    const [analyses] = await connection.query('SELECT * FROM attendance_analysis ORDER BY id DESC LIMIT 1');
    
    if (analyses.length > 0) {
      console.log('找到最新的考勤分析结果:');
      console.table(analyses);
      
      // 获取会话日期
      const [sessions] = await connection.query(
        'SELECT * FROM attendance_sessions WHERE analysis_id = ? ORDER BY id',
        [analyses[0].id]
      );
      
      console.log(`\n考勤会话日期 (共${sessions.length}个):`);
      console.table(sessions);
    } else {
      console.log('未找到考勤分析结果');
    }
    
    // 5. 检查出勤率最高的学生
    console.log('\n出勤率最高的学生:');
    const [topAttendance] = await connection.query(
      'SELECT name, index_number, total_sessions, attended_sessions, attendance_rate FROM students ORDER BY attendance_rate DESC LIMIT 5'
    );
    console.table(topAttendance);
    
  } catch (error) {
    console.error('Error checking attendance data:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

// Run the check
checkAttendanceData().catch(console.error); 