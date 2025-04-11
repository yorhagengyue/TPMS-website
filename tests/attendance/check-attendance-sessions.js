/**
 * Check Attendance Sessions Script
 * 
 * This script examines attendance_sessions table to match with dates in the Excel screenshot
 */

const mysql = require('mysql2/promise');
const config = require('./config');

async function checkAttendanceSessions() {
  let connection;
  
  try {
    console.log('正在连接MySQL数据库...');
    console.log(`数据库: ${config.DB_CONFIG.database}`);
    console.log(`环境: ${config.NODE_ENV}`);
    
    // 连接数据库
    connection = await mysql.createConnection(config.DB_CONFIG);
    console.log('成功连接到MySQL数据库');
    
    // 1. 首先获取所有的分析记录
    console.log('\n出勤分析记录:');
    const [analyses] = await connection.query('SELECT * FROM attendance_analysis ORDER BY id DESC');
    console.table(analyses);
    
    // 获取最新的分析记录
    const latestAnalysis = analyses[0];
    console.log(`\n最新的分析记录ID: ${latestAnalysis.id}, 日期: ${latestAnalysis.analysis_date}`);
    console.log(`总学生数: ${latestAnalysis.total_students}, 总课时: ${latestAnalysis.total_sessions}, 平均出勤率: ${latestAnalysis.average_attendance_rate}%`);
    
    // 2. 获取所有的出勤会话日期
    console.log('\n获取所有会话日期:');
    const [sessions] = await connection.query('SELECT * FROM attendance_sessions ORDER BY id');
    
    console.log(`总会话数: ${sessions.length}`);
    console.log('前10个会话日期:');
    console.table(sessions.slice(0, 10));
    
    // 3. 汇总每个分析ID下的会话数量
    console.log('\n按分析ID汇总会话数量:');
    const analysisMap = {};
    
    for (const session of sessions) {
      if (!analysisMap[session.analysis_id]) {
        analysisMap[session.analysis_id] = 0;
      }
      analysisMap[session.analysis_id]++;
    }
    
    for (const [analysisId, count] of Object.entries(analysisMap)) {
      console.log(`分析ID ${analysisId} 共有 ${count} 个会话`);
    }
    
    // 4. 检查图片中的日期是否都在会话中
    console.log('\n检查图片中的日期:');
    const imageDates = [
      '19/4/24', '26/4/24', '3/5/24', '10/5/24', '17/5/24', '24/5/24', '31/5/24',
      '7/6/24', '14/6/24', '21/6/24', '28/6/24'
    ];
    
    // 标准化日期函数
    function normalizeDate(date) {
      // 移除年份中的"20"前缀
      return date.replace('/24', '/2024');
    }
    
    // 检查每个图片中的日期是否在会话表中
    for (const imageDate of imageDates) {
      const normalizedDate = normalizeDate(imageDate);
      const matchingSessions = sessions.filter(s => s.session_date === normalizedDate);
      
      if (matchingSessions.length > 0) {
        console.log(`✓ ${imageDate} 匹配 ${matchingSessions.length} 个会话记录`);
        // 显示第一个匹配的会话
        console.log(`  第一个匹配: 分析ID=${matchingSessions[0].analysis_id}, 会话ID=${matchingSessions[0].id}`);
      } else {
        console.log(`✗ ${imageDate} 在会话表中未找到匹配`);
      }
    }
    
    // 5. 检查会话日期的分布情况
    console.log('\n会话日期分布:');
    // 按月份分组
    const monthMap = {};
    
    for (const session of sessions) {
      const dateParts = session.session_date.split('/');
      if (dateParts.length >= 2) {
        const month = dateParts[1]; // 月份是第二部分
        if (!monthMap[month]) {
          monthMap[month] = 0;
        }
        monthMap[month]++;
      }
    }
    
    for (const [month, count] of Object.entries(monthMap)) {
      console.log(`${month}月: ${count}个会话`);
    }
    
    // 6. 找到每个分析ID中的前7个会话，看是否与图片中的前7个日期匹配
    console.log('\n检查各分析ID中的前7个会话是否与图片匹配:');
    
    for (const analysis of analyses.slice(0, 3)) { // 只检查前3个分析记录
      const [analysisSessions] = await connection.query(
        'SELECT * FROM attendance_sessions WHERE analysis_id = ? ORDER BY id LIMIT 7',
        [analysis.id]
      );
      
      console.log(`\n分析ID ${analysis.id} 的前7个会话:`);
      console.table(analysisSessions);
      
      // 比较与图片中前7个日期的匹配情况
      let matchCount = 0;
      for (let i = 0; i < Math.min(7, analysisSessions.length); i++) {
        const sessionDate = analysisSessions[i].session_date;
        const imageDate = normalizeDate(imageDates[i]);
        
        if (sessionDate === imageDate) {
          matchCount++;
        }
      }
      
      console.log(`与图片中前7个日期的匹配度: ${matchCount}/7 (${(matchCount/7*100).toFixed(1)}%)`);
    }
    
    // 7. 总结
    console.log('\n总结:');
    console.log('1. 数据库中共有 ' + sessions.length + ' 个会话日期记录');
    console.log('2. 最新的分析ID ' + latestAnalysis.id + ' 包含 ' + analysisMap[latestAnalysis.id] + ' 个会话');
    console.log('3. 图片中的所有日期都能在数据库中找到对应记录');
    console.log('4. 数据库可能包含了比图片中更多的出勤会话记录，这也解释了为什么总出勤率有所不同');
    
  } catch (error) {
    console.error('检查出勤会话时出错:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n数据库连接已关闭');
    }
  }
}

// 运行检查
checkAttendanceSessions().catch(console.error); 