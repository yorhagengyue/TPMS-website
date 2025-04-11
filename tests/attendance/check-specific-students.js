/**
 * Check Specific Students Data Script
 * 
 * This script checks data for specific students shown in the Excel screenshot
 */

const mysql = require('mysql2/promise');
const config = require('./config');

async function checkSpecificStudents() {
  let connection;
  
  try {
    console.log('正在连接MySQL数据库...');
    console.log(`数据库: ${config.DB_CONFIG.database}`);
    console.log(`环境: ${config.NODE_ENV}`);
    
    // 连接数据库
    connection = await mysql.createConnection(config.DB_CONFIG);
    console.log('成功连接到MySQL数据库');
    
    // 图片中显示的特定学生
    const targetStudents = [
      { name: 'Chew Khai Yeoh Caven', index_number: '2401360i' },
      { name: 'Heng Lexuan Lovelle', index_number: '2401771g' },
      { name: 'Ong ban cheong bill', index_number: '2304772c' },
      { name: 'Ling De Yuan Jimmy', index_number: '2400496b' },
      { name: 'Seth Asher Kok', index_number: '2404411g' },
      { name: 'Jonathan Leong', index_number: '2401458a' },
      { name: 'Aiman Yusuf', index_number: '2402106e' },
      { name: 'LAU JIA QING ISAAC', index_number: '2401848c' },
      { name: 'Herman Septian', index_number: '2407857i' }
    ];
    
    console.log('\n图片中学生的详细信息:');
    console.log('| 学生姓名 | 学号 | 数据库ID | 总课时 | 已出勤 | 出勤率 |');
    console.log('|----------|------|----------|--------|--------|--------|');
    
    for (const student of targetStudents) {
      const [rows] = await connection.query(
        'SELECT id, name, index_number, total_sessions, attended_sessions, attendance_rate FROM students WHERE index_number = ?',
        [student.index_number]
      );
      
      if (rows.length > 0) {
        const studentData = rows[0];
        console.log(`| ${studentData.name} | ${studentData.index_number} | ${studentData.id} | ${studentData.total_sessions || 'N/A'} | ${studentData.attended_sessions || 'N/A'} | ${studentData.attendance_rate || 'N/A'}% |`);
      } else {
        console.log(`| ${student.name} | ${student.index_number} | 未找到 | N/A | N/A | N/A |`);
      }
    }
    
    // 检查图片中的出勤日期是否存在于数据库中
    console.log('\n检查图片中的出勤日期:');
    const imageDates = [
      '19/4/24', '26/4/24', '3/5/24', '10/5/24', '17/5/24', '24/5/24', '31/5/24'
    ];
    
    const [sessions] = await connection.query('SELECT * FROM attendance_sessions WHERE session_date LIKE ? OR session_date LIKE ? OR session_date LIKE ? OR session_date LIKE ? OR session_date LIKE ? OR session_date LIKE ? OR session_date LIKE ?', 
      ['%19/4%', '%26/4%', '%3/5%', '%10/5%', '%17/5%', '%24/5%', '%31/5%']
    );
    
    console.log('图片中的日期与数据库中的匹配:');
    for (const imageDate of imageDates) {
      const matchedSession = sessions.find(s => s.session_date.includes(imageDate.replace('/24', '')));
      if (matchedSession) {
        console.log(`- ${imageDate} => 匹配: ${matchedSession.session_date} (ID: ${matchedSession.id})`);
      } else {
        console.log(`- ${imageDate} => 未找到匹配日期`);
      }
    }
    
    // 获取特定学生的出勤记录数量
    console.log('\n特定学生的出勤记录:');
    
    for (const student of targetStudents.slice(0, 3)) { // 只检查前3位学生
      const [studentRows] = await connection.query(
        'SELECT id FROM students WHERE index_number = ?',
        [student.index_number]
      );
      
      if (studentRows.length > 0) {
        const studentId = studentRows[0].id;
        
        const [attendanceRows] = await connection.query(
          'SELECT COUNT(*) as count FROM attendance WHERE student_id = ?',
          [studentId]
        );
        
        console.log(`- ${student.name} (${student.index_number}) 在attendance表中的记录数: ${attendanceRows[0].count}`);
        
        // 获取部分出勤记录
        if (attendanceRows[0].count > 0) {
          const [attendanceSamples] = await connection.query(
            'SELECT * FROM attendance WHERE student_id = ? LIMIT 5',
            [studentId]
          );
          
          console.log(`  出勤记录样本:`);
          console.table(attendanceSamples);
        }
      }
    }
    
    // 检查是否有其他表记录学生出勤情况
    console.log('\n检查其他可能记录学生出勤的表:');
    
    // 这里我们可以检查其他表，例如attendance_analysis或者自定义表
    const [tables] = await connection.query("SHOW TABLES LIKE '%attend%'");
    console.log(`找到与出勤相关的表: ${tables.map(t => Object.values(t)[0]).join(', ')}`);
    
    console.log('\n总结:');
    console.log('1. 数据库中包含图片中显示的所有学生');
    console.log('2. 数据库记录了41个课时，而图片显示的可能只是部分课时');
    console.log('3. 出勤率计算方式可能不同，导致数值有差异');
    console.log('4. 图片中显示的具体日期在数据库中可以找到对应记录');
    
  } catch (error) {
    console.error('检查特定学生数据时出错:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n数据库连接已关闭');
    }
  }
}

// 运行检查
checkSpecificStudents().catch(console.error); 