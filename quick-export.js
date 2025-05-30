/**
 * 快速签到记录导出脚本
 * 
 * 简化版本的导出工具，支持最常用的导出需求
 * 
 * 使用方法：
 * node quick-export.js                           # 导出所有记录
 * node quick-export.js today                     # 导出今天的记录
 * node quick-export.js week                      # 导出本周的记录
 * node quick-export.js month                     # 导出本月的记录
 * node quick-export.js [学生ID]                  # 导出指定学生的记录
 * node quick-export.js [开始日期] [结束日期]      # 导出指定日期范围的记录
 */

const XLSX = require('xlsx');
const db = require('./database');
const path = require('path');

// 获取日期范围
function getDateRange(period) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'today':
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    
    case 'week':
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      return { start: startOfWeek, end: endOfWeek };
    
    case 'month':
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      return { start: startOfMonth, end: endOfMonth };
    
    default:
      return null;
  }
}

// 构建查询
function buildQuery(args) {
  let whereClause = [];
  let params = [];
  let paramIndex = 1;
  let description = '所有记录';

  if (args.length === 0) {
    // 无参数，导出所有记录
  } else if (args.length === 1) {
    const arg = args[0];
    
    // 检查是否是预定义的时间段
    const dateRange = getDateRange(arg);
    if (dateRange) {
      if (db.isPostgres) {
        whereClause.push(`a.check_in_time BETWEEN $${paramIndex++} AND $${paramIndex++}`);
        params.push(dateRange.start, dateRange.end);
      } else {
        whereClause.push('a.check_in_time BETWEEN ? AND ?');
        params.push(dateRange.start, dateRange.end);
      }
      description = `${arg === 'today' ? '今天' : arg === 'week' ? '本周' : '本月'}的记录`;
    } else {
      // 假设是学生ID
      if (db.isPostgres) {
        whereClause.push(`s.index_number = $${paramIndex++}`);
        params.push(arg);
      } else {
        whereClause.push('s.index_number = ?');
        params.push(arg);
      }
      description = `学生 ${arg} 的记录`;
    }
  } else if (args.length === 2) {
    // 两个参数，假设是开始和结束日期
    const [startDate, endDate] = args;
    if (db.isPostgres) {
      whereClause.push(`a.check_in_time BETWEEN $${paramIndex++} AND $${paramIndex++}`);
      params.push(new Date(startDate), new Date(endDate));
    } else {
      whereClause.push('a.check_in_time BETWEEN ? AND ?');
      params.push(new Date(startDate), new Date(endDate));
    }
    description = `${startDate} 至 ${endDate} 的记录`;
  }

  const whereStatement = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

  const query = `
    SELECT 
      a.id,
      s.name,
      s.index_number,
      s.course,
      s.email,
      a.check_in_time,
      a.location_lat,
      a.location_lng,
      s.attendance_rate
    FROM attendance a
    JOIN students s ON a.student_id = s.id
    ${whereStatement}
    ORDER BY a.check_in_time DESC
  `;

  return { query, params, description };
}

// 格式化数据
function formatData(records) {
  return records.map(record => ({
    'ID': record.id,
    '学生姓名': record.name,
    '学号': record.index_number,
    '课程': record.course || 'N/A',
    '邮箱': record.email || 'N/A',
    '签到时间': new Date(record.check_in_time).toLocaleString('zh-CN', {
      timeZone: 'Asia/Singapore',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    '签到日期': new Date(record.check_in_time).toLocaleDateString('zh-CN'),
    '签到时刻': new Date(record.check_in_time).toLocaleTimeString('zh-CN'),
    '纬度': record.location_lat || 'N/A',
    '经度': record.location_lng || 'N/A',
    '出勤率 (%)': record.attendance_rate || 0
  }));
}

// 主导出函数
async function quickExport() {
  try {
    const args = process.argv.slice(2);
    
    console.log('=== 快速签到记录导出 ===');
    
    // 构建查询
    const { query, params, description } = buildQuery(args);
    console.log(`导出范围: ${description}`);
    console.log('正在查询数据库...');
    
    // 执行查询
    const records = await db.query(query, params);
    console.log(`找到 ${records.length} 条签到记录`);
    
    if (records.length === 0) {
      console.log('没有找到符合条件的签到记录');
      return;
    }
    
    // 格式化数据
    const formattedData = formatData(records);
    
    // 生成文件名
    const now = new Date();
    const timestamp = now.toISOString().substring(0, 19).replace(/[:-]/g, '');
    let filename = '签到记录_快速导出';
    
    if (args.length === 1 && ['today', 'week', 'month'].includes(args[0])) {
      filename = `签到记录_${args[0] === 'today' ? '今天' : args[0] === 'week' ? '本周' : '本月'}`;
    } else if (args.length === 1) {
      filename = `签到记录_学生${args[0]}`;
    } else if (args.length === 2) {
      filename = `签到记录_${args[0]}_至_${args[1]}`;
    }
    
    filename += `_${timestamp}.xlsx`;
    
    // 创建Excel文件
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    
    // 设置列宽
    const columnsWidth = [
      { wch: 8 },   // ID
      { wch: 15 },  // 学生姓名
      { wch: 12 },  // 学号
      { wch: 20 },  // 课程
      { wch: 25 },  // 邮箱
      { wch: 20 },  // 签到时间
      { wch: 12 },  // 签到日期
      { wch: 10 },  // 签到时刻
      { wch: 10 },  // 纬度
      { wch: 10 },  // 经度
      { wch: 12 }   // 出勤率
    ];
    worksheet['!cols'] = columnsWidth;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, '签到记录');
    
    // 添加简单统计工作表
    const stats = {
      '总记录数': records.length,
      '独特学生数': new Set(records.map(r => r.index_number)).size,
      '导出时间': now.toLocaleString('zh-CN'),
      '数据范围': description
    };
    
    const statsData = Object.entries(stats).map(([key, value]) => ({
      '统计项目': key,
      '数值': value
    }));
    
    const statsWorksheet = XLSX.utils.json_to_sheet(statsData);
    XLSX.utils.book_append_sheet(workbook, statsWorksheet, '统计信息');
    
    // 保存文件
    const outputPath = path.join(process.cwd(), filename);
    XLSX.writeFile(workbook, outputPath);
    
    console.log(`✅ 导出完成!`);
    console.log(`📁 文件保存至: ${outputPath}`);
    console.log(`📊 导出统计:`);
    console.log(`   - 总记录数: ${records.length}`);
    console.log(`   - 独特学生数: ${new Set(records.map(r => r.index_number)).size}`);
    console.log(`   - 时间范围: ${records.length > 0 ? 
      new Date(records[records.length - 1].check_in_time).toLocaleDateString('zh-CN') + 
      ' 至 ' + 
      new Date(records[0].check_in_time).toLocaleDateString('zh-CN') : 'N/A'}`);
    
  } catch (error) {
    console.error('❌ 导出失败:', error);
  } finally {
    // 关闭数据库连接
    await db.closeConnections();
    console.log('\n数据库连接已关闭');
  }
}

// 显示帮助信息
function showHelp() {
  console.log(`
=== 快速签到记录导出工具 ===

使用方法：
  node quick-export.js [参数]

参数选项：
  无参数                      导出所有签到记录
  today                      导出今天的记录
  week                       导出本周的记录
  month                      导出本月的记录
  [学生ID]                   导出指定学生的所有记录
  [开始日期] [结束日期]        导出指定日期范围的记录

日期格式：YYYY-MM-DD (例如: 2025-01-01)

示例：
  node quick-export.js                          # 导出所有记录
  node quick-export.js today                    # 导出今天的记录
  node quick-export.js week                     # 导出本周的记录
  node quick-export.js month                    # 导出本月的记录
  node quick-export.js 2403880d                 # 导出学生2403880d的记录
  node quick-export.js 2025-01-01 2025-01-31    # 导出1月份的记录

输出：Excel格式文件(.xlsx)，包含签到记录和简单统计信息
`);
}

// 检查是否需要显示帮助
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
} else {
  quickExport();
} 