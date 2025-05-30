/**
 * 全面的签到记录导出脚本
 * 
 * 功能特性：
 * - 支持导出为 Excel (.xlsx)、CSV、JSON 格式
 * - 支持多种筛选条件（日期范围、学生、课程、部门等）
 * - 包含详细的统计信息
 * - 支持分页导出大量数据
 * 
 * 使用方法：
 * node export-all-attendance.js [选项]
 * 
 * 选项：
 * --format=excel|csv|json    导出格式 (默认: excel)
 * --start-date=YYYY-MM-DD    开始日期
 * --end-date=YYYY-MM-DD      结束日期
 * --student-id=ID            指定学生ID
 * --course=课程名            指定课程
 * --include-stats            包含统计信息
 * --output-dir=路径          输出目录 (默认: 当前目录)
 * --limit=数量               限制导出记录数量
 * 
 * 示例：
 * node export-all-attendance.js --format=excel --start-date=2025-01-01 --end-date=2025-12-31 --include-stats
 * node export-all-attendance.js --format=csv --student-id=2403880d
 * node export-all-attendance.js --format=json --course=Computer\ Science --output-dir=./exports
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const db = require('./database');

// 解析命令行参数
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {
    format: 'excel',
    startDate: null,
    endDate: null,
    studentId: null,
    course: null,
    includeStats: false,
    outputDir: process.cwd(),
    limit: null
  };

  args.forEach(arg => {
    if (arg.startsWith('--format=')) {
      options.format = arg.split('=')[1];
    } else if (arg.startsWith('--start-date=')) {
      options.startDate = arg.split('=')[1];
    } else if (arg.startsWith('--end-date=')) {
      options.endDate = arg.split('=')[1];
    } else if (arg.startsWith('--student-id=')) {
      options.studentId = arg.split('=')[1];
    } else if (arg.startsWith('--course=')) {
      options.course = arg.split('=')[1];
    } else if (arg.startsWith('--output-dir=')) {
      options.outputDir = arg.split('=')[1];
    } else if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1]);
    } else if (arg === '--include-stats') {
      options.includeStats = true;
    }
  });

  return options;
}

// 构建查询条件
function buildQuery(options) {
  let whereClause = [];
  let params = [];
  let paramIndex = 1;

  // 日期过滤
  if (options.startDate && options.endDate) {
    if (db.isPostgres) {
      whereClause.push(`a.check_in_time BETWEEN $${paramIndex++} AND $${paramIndex++}`);
      params.push(new Date(options.startDate), new Date(options.endDate));
    } else {
      whereClause.push('a.check_in_time BETWEEN ? AND ?');
      params.push(new Date(options.startDate), new Date(options.endDate));
    }
  }

  // 学生ID过滤
  if (options.studentId) {
    if (db.isPostgres) {
      whereClause.push(`s.index_number = $${paramIndex++}`);
      params.push(options.studentId);
    } else {
      whereClause.push('s.index_number = ?');
      params.push(options.studentId);
    }
  }

  // 课程过滤
  if (options.course) {
    if (db.isPostgres) {
      whereClause.push(`s.course ILIKE $${paramIndex++}`);
      params.push(`%${options.course}%`);
    } else {
      whereClause.push('s.course LIKE ?');
      params.push(`%${options.course}%`);
    }
  }

  const whereStatement = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';
  
  let limitStatement = '';
  if (options.limit) {
    if (db.isPostgres) {
      limitStatement = `LIMIT $${paramIndex++}`;
      params.push(options.limit);
    } else {
      limitStatement = 'LIMIT ?';
      params.push(options.limit);
    }
  }

  const query = `
    SELECT 
      a.id,
      s.name,
      s.index_number,
      s.course,
      s.email,
      s.phone_number,
      a.check_in_time,
      a.location_lat,
      a.location_lng,
      a.session_id,
      s.total_sessions,
      s.attended_sessions,
      s.attendance_rate
    FROM attendance a
    JOIN students s ON a.student_id = s.id
    ${whereStatement}
    ORDER BY a.check_in_time DESC
    ${limitStatement}
  `;

  return { query, params };
}

// 获取统计信息
async function getStatistics(options) {
  try {
    let whereClause = [];
    let params = [];
    let paramIndex = 1;

    // 应用相同的过滤条件
    if (options.startDate && options.endDate) {
      if (db.isPostgres) {
        whereClause.push(`a.check_in_time BETWEEN $${paramIndex++} AND $${paramIndex++}`);
        params.push(new Date(options.startDate), new Date(options.endDate));
      } else {
        whereClause.push('a.check_in_time BETWEEN ? AND ?');
        params.push(new Date(options.startDate), new Date(options.endDate));
      }
    }

    if (options.studentId) {
      if (db.isPostgres) {
        whereClause.push(`s.index_number = $${paramIndex++}`);
        params.push(options.studentId);
      } else {
        whereClause.push('s.index_number = ?');
        params.push(options.studentId);
      }
    }

    if (options.course) {
      if (db.isPostgres) {
        whereClause.push(`s.course ILIKE $${paramIndex++}`);
        params.push(`%${options.course}%`);
      } else {
        whereClause.push('s.course LIKE ?');
        params.push(`%${options.course}%`);
      }
    }

    const whereStatement = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

    const statsQuery = `
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT s.id) as unique_students,
        COUNT(DISTINCT DATE(a.check_in_time)) as unique_days,
        AVG(s.attendance_rate) as avg_attendance_rate,
        MIN(a.check_in_time) as first_checkin,
        MAX(a.check_in_time) as last_checkin
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      ${whereStatement}
    `;

    const courseStatsQuery = `
      SELECT 
        s.course,
        COUNT(*) as record_count,
        COUNT(DISTINCT s.id) as student_count
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      ${whereStatement}
      GROUP BY s.course
      ORDER BY record_count DESC
    `;

    const [generalStats] = await db.query(statsQuery, params);
    const courseStats = await db.query(courseStatsQuery, params);

    return {
      general: generalStats,
      byCourse: courseStats
    };
  } catch (error) {
    console.error('获取统计信息错误:', error);
    return null;
  }
}

// 格式化数据
function formatData(records) {
  return records.map(record => ({
    'ID': record.id,
    '学生姓名': record.name,
    '学号': record.index_number,
    '课程': record.course || 'N/A',
    '邮箱': record.email || 'N/A',
    '电话': record.phone_number || 'N/A',
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
    '纬度': record.location_lat,
    '经度': record.location_lng,
    '会话ID': record.session_id || 'N/A',
    '总会话数': record.total_sessions,
    '已参加会话数': record.attended_sessions,
    '出勤率 (%)': record.attendance_rate
  }));
}

// 导出为Excel格式
async function exportToExcel(data, stats, options, filename) {
  const workbook = XLSX.utils.book_new();
  
  // 主数据工作表
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // 设置列宽
  const columnsWidth = [
    { wch: 8 },   // ID
    { wch: 15 },  // 学生姓名
    { wch: 12 },  // 学号
    { wch: 20 },  // 课程
    { wch: 25 },  // 邮箱
    { wch: 15 },  // 电话
    { wch: 20 },  // 签到时间
    { wch: 12 },  // 签到日期
    { wch: 10 },  // 签到时刻
    { wch: 10 },  // 纬度
    { wch: 10 },  // 经度
    { wch: 10 },  // 会话ID
    { wch: 12 },  // 总会话数
    { wch: 15 },  // 已参加会话数
    { wch: 12 }   // 出勤率
  ];
  worksheet['!cols'] = columnsWidth;
  
  XLSX.utils.book_append_sheet(workbook, worksheet, '签到记录');
  
  // 如果包含统计信息，添加统计工作表
  if (options.includeStats && stats) {
    const statsData = [
      { '统计项目': '总签到记录数', '数值': stats.general.total_records },
      { '统计项目': '独特学生数', '数值': stats.general.unique_students },
      { '统计项目': '签到天数', '数值': stats.general.unique_days },
      { '统计项目': '平均出勤率 (%)', '数值': parseFloat(stats.general.avg_attendance_rate || 0).toFixed(2) },
      { '统计项目': '首次签到时间', '数值': stats.general.first_checkin ? new Date(stats.general.first_checkin).toLocaleString('zh-CN') : 'N/A' },
      { '统计项目': '最后签到时间', '数值': stats.general.last_checkin ? new Date(stats.general.last_checkin).toLocaleString('zh-CN') : 'N/A' }
    ];
    
    const statsWorksheet = XLSX.utils.json_to_sheet(statsData);
    XLSX.utils.book_append_sheet(workbook, statsWorksheet, '统计信息');
    
    // 按课程统计工作表
    if (stats.byCourse.length > 0) {
      const courseStatsData = stats.byCourse.map(item => ({
        '课程': item.course || '未知课程',
        '签到记录数': item.record_count,
        '学生人数': item.student_count
      }));
      const courseWorksheet = XLSX.utils.json_to_sheet(courseStatsData);
      XLSX.utils.book_append_sheet(workbook, courseWorksheet, '按课程统计');
    }
  }
  
  XLSX.writeFile(workbook, filename);
}

// 导出为CSV格式
function exportToCSV(data, filename) {
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(value => 
      typeof value === 'string' && value.includes(',') ? `"${value}"` : value
    ).join(',')
  );
  const csvContent = [headers, ...rows].join('\n');
  fs.writeFileSync(filename, '\uFEFF' + csvContent, 'utf8'); // 添加BOM以支持中文
}

// 导出为JSON格式
function exportToJSON(data, stats, options, filename) {
  const exportData = {
    exportInfo: {
      timestamp: new Date().toISOString(),
      totalRecords: data.length,
      filters: {
        startDate: options.startDate,
        endDate: options.endDate,
        studentId: options.studentId,
        course: options.course,
        limit: options.limit
      }
    },
    data: data
  };
  
  if (options.includeStats && stats) {
    exportData.statistics = stats;
  }
  
  fs.writeFileSync(filename, JSON.stringify(exportData, null, 2), 'utf8');
}

// 主导出函数
async function exportAttendanceData() {
  try {
    const options = parseArguments();
    
    console.log('=== 签到记录导出工具 ===');
    console.log('导出格式:', options.format);
    if (options.startDate && options.endDate) {
      console.log('日期范围:', options.startDate, '至', options.endDate);
    }
    if (options.studentId) {
      console.log('学生ID:', options.studentId);
    }
    if (options.course) {
      console.log('课程:', options.course);
    }
    if (options.limit) {
      console.log('限制记录数:', options.limit);
    }
    console.log('输出目录:', options.outputDir);
    console.log('-------------------');
    
    // 确保输出目录存在
    if (!fs.existsSync(options.outputDir)) {
      fs.mkdirSync(options.outputDir, { recursive: true });
    }
    
    // 构建查询
    const { query, params } = buildQuery(options);
    console.log('正在查询签到记录...');
    
    // 执行查询
    const records = await db.query(query, params);
    console.log(`找到 ${records.length} 条签到记录`);
    
    if (records.length === 0) {
      console.log('没有找到符合条件的签到记录');
      return;
    }
    
    // 格式化数据
    const formattedData = formatData(records);
    
    // 获取统计信息
    let stats = null;
    if (options.includeStats) {
      console.log('正在计算统计信息...');
      stats = await getStatistics(options);
    }
    
    // 生成文件名
    const now = new Date();
    let baseFilename = '签到记录_全量导出';
    if (options.startDate && options.endDate) {
      baseFilename = `签到记录_${options.startDate}_至_${options.endDate}`;
    }
    if (options.studentId) {
      baseFilename += `_学生${options.studentId}`;
    }
    if (options.course) {
      baseFilename += `_${options.course}`;
    }
    baseFilename += `_${now.toISOString().substring(0, 19).replace(/[:-]/g, '')}`;
    
    // 根据格式导出
    let filename;
    switch (options.format.toLowerCase()) {
      case 'csv':
        filename = path.join(options.outputDir, `${baseFilename}.csv`);
        exportToCSV(formattedData, filename);
        break;
      case 'json':
        filename = path.join(options.outputDir, `${baseFilename}.json`);
        exportToJSON(formattedData, stats, options, filename);
        break;
      case 'excel':
      default:
        filename = path.join(options.outputDir, `${baseFilename}.xlsx`);
        await exportToExcel(formattedData, stats, options, filename);
        break;
    }
    
    console.log(`✅ 导出完成! 文件保存至: ${filename}`);
    
    // 显示简要统计
    if (stats) {
      console.log('\n=== 导出数据统计 ===');
      console.log(`总签到记录数: ${stats.general.total_records}`);
      console.log(`独特学生数: ${stats.general.unique_students}`);
      console.log(`签到天数: ${stats.general.unique_days}`);
      console.log(`平均出勤率: ${parseFloat(stats.general.avg_attendance_rate || 0).toFixed(2)}%`);
      if (stats.general.first_checkin) {
        console.log(`首次签到: ${new Date(stats.general.first_checkin).toLocaleString('zh-CN')}`);
      }
      if (stats.general.last_checkin) {
        console.log(`最后签到: ${new Date(stats.general.last_checkin).toLocaleString('zh-CN')}`);
      }
    }
    
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
=== 签到记录导出工具使用说明 ===

使用方法：
  node export-all-attendance.js [选项]

选项：
  --format=excel|csv|json    导出格式 (默认: excel)
  --start-date=YYYY-MM-DD    开始日期
  --end-date=YYYY-MM-DD      结束日期
  --student-id=ID            指定学生ID
  --course=课程名            指定课程 (支持模糊匹配)
  --include-stats            包含统计信息
  --output-dir=路径          输出目录 (默认: 当前目录)
  --limit=数量               限制导出记录数量
  --help                     显示此帮助信息

示例：
  # 导出所有记录为Excel格式，包含统计信息
  node export-all-attendance.js --format=excel --include-stats

  # 导出指定日期范围的记录为CSV格式
  node export-all-attendance.js --format=csv --start-date=2025-01-01 --end-date=2025-12-31

  # 导出指定学生的记录为JSON格式
  node export-all-attendance.js --format=json --student-id=2403880d

  # 导出指定课程的记录，限制1000条
  node export-all-attendance.js --course="Computer Science" --limit=1000

  # 导出到指定目录
  node export-all-attendance.js --output-dir=./exports --include-stats
`);
}

// 检查是否需要显示帮助
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
} else {
  exportAttendanceData();
} 