/**
 * 修复出勤率计算脚本
 * 
 * 此脚本用于修复数据库中所有学生的出勤率计算
 * 使用方式: node tools/fix-attendance-rates.js
 */

const db = require('../database');

async function fixAttendanceRates() {
  let connection;
  
  try {
    console.log('开始修复出勤率计算...');
    connection = await db.getConnection();
    
    // 开始事务
    await connection.beginTransaction();
    
    // 获取所有学生记录
    const studentsQuery = db.isPostgres
      ? 'SELECT id, total_sessions, attended_sessions FROM students'
      : 'SELECT id, total_sessions, attended_sessions FROM students';
    
    const students = await connection.query(studentsQuery);
    console.log(`找到 ${students.length} 个学生记录`);
    
    // 为每个学生重新计算出勤率
    let updated = 0;
    let errors = 0;
    let dataFixed = 0;
    
    for (const student of students) {
      try {
        let totalSessions = student.total_sessions || 0;
        let attendedSessions = student.attended_sessions || 0;
        let needUpdate = false;
        
        // 检查并修复数据不一致情况：总课程数应至少等于出勤次数
        if (attendedSessions > 0 && totalSessions < attendedSessions) {
          totalSessions = attendedSessions;
          needUpdate = true;
          dataFixed++;
          console.log(`修复数据不一致: 学生ID ${student.id}, 总课程数 ${student.total_sessions} 小于出勤次数 ${attendedSessions}, 已更新总课程数为 ${totalSessions}`);
        }
        
        // 计算正确的出勤率
        let attendanceRate = 0;
        if (totalSessions > 0) {
          attendanceRate = (attendedSessions * 100.0 / totalSessions);
        }
        
        // 更新学生记录
        const updateQuery = db.isPostgres
          ? 'UPDATE students SET total_sessions = $1, attendance_rate = $2 WHERE id = $3'
          : 'UPDATE students SET total_sessions = ?, attendance_rate = ? WHERE id = ?';
        
        await connection.query(updateQuery, [totalSessions, attendanceRate, student.id]);
        updated++;
        
        // 打印进度
        if (updated % 10 === 0) {
          console.log(`已处理 ${updated}/${students.length} 个学生记录`);
        }
      } catch (error) {
        console.error(`更新学生ID ${student.id} 出错:`, error);
        errors++;
      }
    }
    
    // 提交事务
    await connection.commit();
    
    console.log('\n出勤率修复完成:');
    console.log(`- 总计学生: ${students.length}`);
    console.log(`- 更新成功: ${updated}`);
    console.log(`- 数据不一致已修复: ${dataFixed}`);
    console.log(`- 更新失败: ${errors}`);
    
  } catch (error) {
    console.error('修复出勤率时出错:', error);
    if (connection) {
      await connection.rollback();
    }
  } finally {
    if (connection) {
      connection.release();
    }
    console.log('脚本执行完毕。');
    process.exit(0);
  }
}

// 执行修复
fixAttendanceRates(); 