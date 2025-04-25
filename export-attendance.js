/**
 * 导出签到数据到Excel的独立脚本
 * 
 * 使用方法：
 * node export-attendance.js [开始日期] [结束日期] [学生ID]
 * 例如：node export-attendance.js 2025-04-01 2025-04-25
 * 或者：node export-attendance.js 2025-04-01 2025-04-25 2403880d
 */

const XLSX = require('xlsx');
const db = require('./database');
const path = require('path');

async function exportAttendanceData(startDate = null, endDate = null, studentId = null) {
  try {
    console.log('正在导出签到数据...');
    
    // 构建查询条件
    let whereClause = [];
    let params = [];
    let paramIndex = 1; // PostgreSQL使用$1, $2格式参数
    
    // 添加日期过滤条件
    if (startDate && endDate) {
      if (db.isPostgres) {
        whereClause.push(`a.check_in_time BETWEEN $${paramIndex++} AND $${paramIndex++}`);
        params.push(new Date(startDate), new Date(endDate));
      } else {
        whereClause.push('a.check_in_time BETWEEN ? AND ?');
        params.push(new Date(startDate), new Date(endDate));
      }
      console.log(`日期范围: ${startDate} 至 ${endDate}`);
    }
    
    // 添加学生ID过滤条件
    if (studentId) {
      if (db.isPostgres) {
        whereClause.push(`s.index_number = $${paramIndex++}`);
        params.push(studentId);
      } else {
        whereClause.push('s.index_number = ?');
        params.push(studentId);
      }
      console.log(`学生ID: ${studentId}`);
    }
    
    // 构建完整的WHERE子句
    const whereStatement = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';
    
    // 构建完整的查询语句
    const query = `
      SELECT 
        a.id, 
        s.name, 
        s.index_number, 
        s.course,
        a.check_in_time, 
        a.location_lat, 
        a.location_lng
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      ${whereStatement}
      ORDER BY a.check_in_time DESC
    `;
    
    console.log('执行查询：', query);
    console.log('参数：', params);
    
    // 执行查询获取签到记录
    const records = await db.query(query, params);
    console.log(`找到 ${records.length} 条签到记录`);
    
    if (records.length === 0) {
      console.log('没有找到符合条件的签到记录');
      return;
    }
    
    // 处理数据格式，使其更友好
    const formattedData = records.map(record => ({
      'ID': record.id,
      '学生姓名': record.name,
      '学号': record.index_number,
      '课程': record.course || 'N/A',
      '签到时间': new Date(record.check_in_time).toLocaleString(),
      '纬度': record.location_lat,
      '经度': record.location_lng
    }));
    
    // 创建一个新的Excel工作表
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    
    // 设置列宽
    const columnsWidth = [
      { wch: 8 },   // ID
      { wch: 25 },  // 学生姓名
      { wch: 15 },  // 学号
      { wch: 20 },  // 课程
      { wch: 20 },  // 签到时间
      { wch: 10 },  // 纬度
      { wch: 10 }   // 经度
    ];
    worksheet['!cols'] = columnsWidth;
    
    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, '签到记录');
    
    // 生成文件名
    const now = new Date();
    let filename = '签到记录';
    if (startDate && endDate) {
      filename += `_${startDate}_to_${endDate}`;
    } else {
      filename += `_${now.toISOString().substring(0, 10)}`;
    }
    if (studentId) {
      filename += `_${studentId}`;
    }
    filename += '.xlsx';
    
    const outputPath = path.join(process.cwd(), filename);
    
    // 写入Excel文件
    XLSX.writeFile(workbook, outputPath);
    
    console.log(`Excel文件已导出至: ${outputPath}`);
    
  } catch (error) {
    console.error('导出签到数据错误:', error);
  } finally {
    // 关闭数据库连接
    await db.closeConnections();
    console.log('数据库连接已关闭');
  }
}

// 获取命令行参数
const args = process.argv.slice(2);
const startDate = args[0] || null; // 例如: 2025-04-01
const endDate = args[1] || null;   // 例如: 2025-04-25
const studentId = args[2] || null; // 例如: 2403880d

// 执行导出
exportAttendanceData(startDate, endDate, studentId);
