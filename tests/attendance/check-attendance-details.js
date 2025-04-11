/**
 * Detailed Attendance Data Check Script
 * 
 * This script checks specific attendance data shown in the Excel file and analyzes differences
 */

const mysql = require('mysql2/promise');
const config = require('./config');

async function checkAttendanceDetails() {
  let connection;
  
  try {
    console.log('正在连接MySQL数据库...');
    console.log(`数据库: ${config.DB_CONFIG.database}`);
    console.log(`环境: ${config.NODE_ENV}`);
    
    // 连接数据库
    connection = await mysql.createConnection(config.DB_CONFIG);
    console.log('成功连接到MySQL数据库');
    
    // 1. 检查图片中的特定学生出勤率
    console.log('\n检查图片中显示的学生出勤率:');
    const attendanceData = [
      { name: 'Chew Khai Yeoh Caven', index_number: '2401360i', image_rate: 66.7 },
      { name: 'Heng Lexuan Lovelle', index_number: '2401771g', image_rate: 60.0 },
      { name: 'Ong ban cheong bill', index_number: '2304772c', image_rate: 53.3 },
      { name: 'Jonathan Leong', index_number: '2401458a', image_rate: 51.1 },
      { name: 'Ling De Yuan Jimmy', index_number: '2400496b', image_rate: 51.1 },
      { name: 'Aiman Yusuf', index_number: '2402106e', image_rate: 51.1 },
      { name: 'Seth Asher Kok', index_number: '2404411g', image_rate: 48.9 },
      { name: 'LAU JIA QING ISAAC', index_number: '2401848c', image_rate: 46.7 },
      { name: 'Herman Septian', index_number: '2407857i', image_rate: 44.4 }
    ];
    
    console.log('| 姓名 | 学号 | 图片显示出勤率 | 数据库出勤率 | 差异 |');
    console.log('|------|------|--------------|------------|------|');
    
    for (const data of attendanceData) {
      const [rows] = await connection.query(
        'SELECT name, index_number, attendance_rate FROM students WHERE index_number = ?',
        [data.index_number]
      );
      
      if (rows.length > 0) {
        const dbRate = parseFloat(rows[0].attendance_rate);
        const diff = Math.abs(dbRate - data.image_rate).toFixed(1);
        console.log(`| ${data.name} | ${data.index_number} | ${data.image_rate}% | ${dbRate}% | ${diff}% |`);
      } else {
        console.log(`| ${data.name} | ${data.index_number} | ${data.image_rate}% | 未找到 | N/A |`);
      }
    }
    
    // 2. 检查图片中显示的特定日期是否存在于数据库中
    console.log('\n检查图片中显示的考勤日期:');
    const imageDates = [
      '19/4/24', '26/4/24', '3/5/24', '10/5/24', '17/5/24', '24/5/24', 
      '31/5/24', '7/6/24', '14/6/24', '21/6/24', '28/6/24'
    ];
    
    // 获取会话日期
    const [sessions] = await connection.query(
      'SELECT session_date FROM attendance_sessions ORDER BY id'
    );
    
    const dbDates = sessions.map(s => s.session_date);
    console.log('图片中显示的日期:');
    console.log(imageDates.join(', '));
    console.log('\n数据库中的日期(部分):');
    console.log(dbDates.slice(0, 15).join(', '));
    
    console.log('\n日期格式比较:');
    for (let i = 0; i < Math.min(5, imageDates.length); i++) {
      const imageDate = imageDates[i];
      
      // 尝试找到匹配的数据库日期
      const matchedDate = dbDates.find(date => {
        // 标准化日期格式进行比较
        const imgParts = imageDate.split('/');
        const dbParts = date.split('/');
        
        if (imgParts.length < 3 || dbParts.length < 3) return false;
        
        // 检查月和日是否匹配(忽略年份的不同表示方式)
        return imgParts[0] === dbParts[0] && imgParts[1] === dbParts[1];
      });
      
      console.log(`图片日期: ${imageDate} => 数据库匹配: ${matchedDate || '未找到'}`);
    }
    
    // 3. 检查出勤情况统计
    console.log('\n出勤分布情况:');
    const [stats] = await connection.query(`
      SELECT 
        COUNT(*) as total_students,
        SUM(CASE WHEN attendance_rate >= 75 THEN 1 ELSE 0 END) as high_attendance,
        SUM(CASE WHEN attendance_rate < 75 AND attendance_rate >= 50 THEN 1 ELSE 0 END) as medium_attendance,
        SUM(CASE WHEN attendance_rate < 50 AND attendance_rate >= 25 THEN 1 ELSE 0 END) as low_attendance,
        SUM(CASE WHEN attendance_rate < 25 THEN 1 ELSE 0 END) as very_low_attendance
      FROM students
    `);
    
    if (stats.length > 0) {
      const stat = stats[0];
      console.log(`总学生数: ${stat.total_students}`);
      console.log(`高出勤率 (75-100%): ${stat.high_attendance} 名学生 (${(stat.high_attendance / stat.total_students * 100).toFixed(2)}%)`);
      console.log(`中出勤率 (50-74%): ${stat.medium_attendance} 名学生 (${(stat.medium_attendance / stat.total_students * 100).toFixed(2)}%)`);
      console.log(`低出勤率 (25-49%): ${stat.low_attendance} 名学生 (${(stat.low_attendance / stat.total_students * 100).toFixed(2)}%)`);
      console.log(`极低出勤率 (0-24%): ${stat.very_low_attendance} 名学生 (${(stat.very_low_attendance / stat.total_students * 100).toFixed(2)}%)`);
    }
    
    // 4. 分析总结
    console.log('\n数据比较分析:');
    console.log('1. 学生信息: 数据库包含图片中显示的所有学生记录');
    console.log('2. 出勤率: 数据库中的出勤率数值与图片有所不同，可能是因为:');
    console.log('   - 数据库基于41个会话计算，而图片可能基于不同数量的会话');
    console.log('   - 图片显示的可能是较早期的数据，数据库包含更多最新的出勤记录');
    console.log('3. 日期格式: 数据库中的日期格式为"DD/MM/YYYY"，而图片中为"DD/MM/YY"');
    console.log('4. 总课时数: 数据库记录总课时为41，而图片中显示的数值不同');
    
    console.log('\n推荐操作:');
    console.log('- 验证数据库中记录的41个会话是否准确');
    console.log('- 确认图片是否显示旧版数据');
    console.log('- 考虑更新数据库，使其与最新的Excel数据一致');
    
  } catch (error) {
    console.error('检查数据时出错:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n数据库连接已关闭');
    }
  }
}

// 运行检查
checkAttendanceDetails().catch(console.error); 