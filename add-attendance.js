/**
 * 为指定学号添加一条签到记录
 * 
 * 使用方法: node add-attendance.js
 */

const db = require('./database');

async function addAttendanceRecord() {
  let connection;
  
  try {
    console.log('正在为学号 2403880d 添加签到记录...');
    connection = await db.getConnection();
    
    // 1. 首先查找该学号对应的学生ID
    const studentQuery = db.isPostgres
      ? 'SELECT id FROM students WHERE LOWER(index_number) = $1'
      : 'SELECT id FROM students WHERE LOWER(index_number) = ?';
      
    const students = await connection.query(studentQuery, ['2403880d']);
    
    if (students.length === 0) {
      console.error('错误: 未找到学号为 2403880d 的学生记录');
      return;
    }
    
    const studentId = students[0].id;
    console.log(`找到学生ID: ${studentId}`);
    
    // 2. 添加签到记录，使用当前时间作为签到时间
    const now = new Date();
    
    // 使用学校的默认位置
    const tpLocation = {
      lat: 1.3456,   // 使用配置中的学校坐标
      lng: 103.9321
    };
    
    const insertQuery = db.isPostgres
      ? 'INSERT INTO attendance (student_id, check_in_time, location_lat, location_lng) VALUES ($1, $2, $3, $4) RETURNING id'
      : 'INSERT INTO attendance (student_id, check_in_time, location_lat, location_lng) VALUES (?, ?, ?, ?)';
    
    const result = await connection.query(insertQuery, [
      studentId, 
      now,
      tpLocation.lat,
      tpLocation.lng
    ]);
    
    // 3. 更新学生的考勤统计信息
    const updateStatsQuery = db.isPostgres
      ? `UPDATE students 
         SET total_sessions = COALESCE(total_sessions, 0) + 1, 
             attended_sessions = COALESCE(attended_sessions, 0) + 1,
             last_attendance = $1
         WHERE id = $2`
      : `UPDATE students 
         SET total_sessions = COALESCE(total_sessions, 0) + 1, 
             attended_sessions = COALESCE(attended_sessions, 0) + 1,
             last_attendance = ?
         WHERE id = ?`;
         
    await connection.query(updateStatsQuery, [now, studentId]);
    
    // 4. 计算并更新出勤率
    const updateRateQuery = db.isPostgres
      ? `UPDATE students 
         SET attendance_rate = (attended_sessions * 100.0 / NULLIF(total_sessions, 0))
         WHERE id = $1`
      : `UPDATE students 
         SET attendance_rate = (attended_sessions * 100.0 / NULLIF(total_sessions, 0))
         WHERE id = ?`;
         
    await connection.query(updateRateQuery, [studentId]);
    
    console.log('成功添加签到记录!');
    console.log(`签到时间: ${now.toLocaleString()}`);
    console.log(`位置: 纬度=${tpLocation.lat}, 经度=${tpLocation.lng}`);
    
  } catch (error) {
    console.error('添加签到记录时出错:', error);
  } finally {
    if (connection) {
      connection.release();
    }
    // 关闭数据库连接
    db.closeConnections().then(() => {
      console.log('数据库连接已关闭');
      process.exit(0);
    });
  }
}

// 执行添加签到记录的操作
addAttendanceRecord();
