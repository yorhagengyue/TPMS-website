/**
 * New Students Import Utility
 * 
 * This script imports only new students from an Excel file
 * Default file: src/cca attendance system.xlsx
 * Run with: node tools/import-new-students.js
 * Or specify path: node tools/import-new-students.js path/to/excel.xlsx
 */

const db = require('../database');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// 默认Excel文件路径
const DEFAULT_EXCEL_PATH = path.join(__dirname, '../src/cca attendance system.xlsx');

async function importNewStudents(filePath) {
  console.log(`Reading Excel file from: ${filePath}`);
  
  // Read Excel file - with higher cell count limit and debug info
  const workbook = XLSX.readFile(filePath, { 
    cellStyles: true,
    cellDates: true,
    cellNF: true
  });
  
  // 显示所有可用的工作表名称
  console.log(`Available sheets: ${workbook.SheetNames.join(', ')}`);
  
  // 尝试找到名为"Attendance"的工作表，如果没有，则使用第一个
  let sheetName = workbook.SheetNames.includes('Attendance') 
    ? 'Attendance' 
    : workbook.SheetNames[0];
  
  console.log(`Using sheet: ${sheetName}`);
  
  const worksheet = workbook.Sheets[sheetName];
  
  // 显示工作表范围信息
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
  console.log(`Sheet range: ${worksheet['!ref']}, rows: ${range.e.r - range.s.r + 1}`);
  
  // 提取表头以便调试
  const headers = [];
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cell = worksheet[XLSX.utils.encode_cell({r:range.s.r, c:C})];
    headers.push(cell ? cell.v : undefined);
  }
  console.log(`Headers: ${JSON.stringify(headers)}`);
  
  // 尝试使用不同的选项解析JSON数据
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
    defval: '',
    header: 1,
    raw: false,
    dateNF: 'yyyy-mm-dd'
  });
  
  // 转换为正确的格式，基于发现的表头
  const processedData = [];
  
  // 识别关键列的索引
  let nameIdx = -1;
  let emailIdx = -1;
  let idIdx = -1;
  
  // 查找关键列
  headers.forEach((header, idx) => {
    if (!header) return;
    const h = String(header).toLowerCase();
    if (h.includes('name')) nameIdx = idx;
    if (h.includes('email') || h.includes('@student')) emailIdx = idx;
    if (h.includes('admin no') || h.includes('index') || h === 'c') idIdx = idx;
  });
  
  console.log(`Key column indexes - Name: ${nameIdx}, Email: ${emailIdx}, ID: ${idIdx}`);
  
  // 处理每一行数据
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length === 0) continue;
    
    const student = {};
    
    // 处理学生姓名
    if (nameIdx >= 0 && row[nameIdx]) {
      student.name = row[nameIdx];
    }
    
    // 处理学生邮箱
    if (emailIdx >= 0 && row[emailIdx]) {
      student.email = row[emailIdx];
      
      // 如果email是ID格式，尝试提取ID
      if (student.email && student.email.includes('@student.tp.edu.sg')) {
        const match = student.email.match(/^([^@]+)@/);
        if (match && match[1]) {
          student.indexNumber = match[1];
        }
      }
    }
    
    // 处理学生ID
    if (idIdx >= 0 && row[idIdx]) {
      // 如果我们还没有从邮箱中提取ID
      if (!student.indexNumber) {
        student.indexNumber = row[idIdx];
      }
    }
    
    // 如果有足够的数据，添加到处理列表
    if (student.name && student.indexNumber) {
      processedData.push(student);
    }
  }
  
  if (processedData.length === 0) {
    console.error('No valid student data found in Excel file');
    // 尝试更直接的解析方法
    const directData = [];
    // 直接从单元格A和B列提取数据
    for (let r = range.s.r + 1; r <= range.e.r; r++) {
      const emailCell = worksheet[XLSX.utils.encode_cell({r, c:0})]; // A列
      const nameCell = worksheet[XLSX.utils.encode_cell({r, c:1})];  // B列
      const idCell = worksheet[XLSX.utils.encode_cell({r, c:2})];    // C列
      
      if (emailCell && nameCell) {
        const student = {
          email: emailCell.v,
          name: nameCell.v,
          indexNumber: (idCell && idCell.v) ? idCell.v : ''
        };
        
        // 如果email中包含学生ID，从中提取
        if (student.email && student.email.includes('@student.tp.edu.sg')) {
          const match = student.email.match(/^([^@]+)@/);
          if (match && match[1]) {
            student.indexNumber = match[1];
          }
        }
        
        if (student.name && student.email) {
          directData.push(student);
        }
      }
    }
    
    if (directData.length > 0) {
      console.log(`Found ${directData.length} students using direct cell access`);
      processedData.push(...directData);
    } else {
      console.error('Failed to extract any student data using alternative methods');
      process.exit(1);
    }
  }

  console.log(`Found ${processedData.length} valid students in Excel file`);
  
  // 显示前5条记录作为样本
  console.log('Sample records:');
  processedData.slice(0, 5).forEach((student, idx) => {
    console.log(`  ${idx+1}. ${student.name} (${student.indexNumber}), Email: ${student.email || 'N/A'}`);
  });
  
  const connection = await db.getConnection();
  let newUsers = 0;
  let existing = 0;
  let errors = 0;

  try {
    await connection.beginTransaction();

    // 收集所有学生ID进行单一数据库查询
    const indexNumbers = processedData
      .map(student => student.indexNumber.toString().toLowerCase().trim())
      .filter(id => id);

    // 获取所有现有学生
    let existingStudentsMap = new Map();
    if (indexNumbers.length > 0) {
      // 为防止参数过多，分批查询
      const batchSize = 200;
      for (let i = 0; i < indexNumbers.length; i += batchSize) {
        const batch = indexNumbers.slice(i, i + batchSize);
        const placeholders = batch.map((_, i) => db.isPostgres ? `$${i+1}` : '?').join(',');
        
        const query = db.isPostgres
          ? `SELECT id, LOWER(index_number) as index_number FROM students WHERE LOWER(index_number) IN (${placeholders})`
          : `SELECT id, LOWER(index_number) as index_number FROM students WHERE LOWER(index_number) IN (${placeholders})`;
        
        const existingStudents = await connection.query(query, batch);
        
        // 创建高效查找映射
        existingStudents.forEach(student => {
          existingStudentsMap.set(student.index_number.toLowerCase(), student.id);
        });
      }
    }

    console.log(`Found ${existingStudentsMap.size} existing students in database`);

    // 处理每个学生
    for (const student of processedData) {
      const name = student.name;
      const course = student.course || '';
      const indexNumber = student.indexNumber;
      const email = student.email || '';
      const phoneNumber = student.phoneNumber || '';
      
      // 跳过缺少必要字段的记录
      if (!name || !indexNumber) {
        console.error(`Skipping record with missing name or index number: ${JSON.stringify(student)}`);
        errors++;
        continue;
      }

      const normalizedIndexNumber = indexNumber.toLowerCase();
      
      try {
        // 检查学生是否已存在
        if (!existingStudentsMap.has(normalizedIndexNumber)) {
          // 插入新学生
          const insertQuery = db.isPostgres
            ? 'INSERT INTO students (name, course, index_number, email, phone_number) VALUES ($1, $2, $3, $4, $5)'
            : 'INSERT INTO students (name, course, index_number, email, phone_number) VALUES (?, ?, ?, ?, ?)';
          
          await connection.query(insertQuery, [
            name, 
            course, 
            indexNumber, 
            email, 
            phoneNumber
          ]);
          
          console.log(`ADDED: ${name} (${indexNumber})`);
          newUsers++;
        } else {
          // 跳过已存在的学生
          console.log(`EXISTS: ${name} (${indexNumber})`);
          existing++;
        }
      } catch (error) {
        console.error(`Error processing student ${name} (${indexNumber}):`, error);
        errors++;
      }
    }

    await connection.commit();
    console.log(`\nImport summary:`);
    console.log(`- ${processedData.length} valid students in Excel`);
    console.log(`- ${existing} already in database (skipped)`);
    console.log(`- ${newUsers} new students added`);
    console.log(`- ${errors} errors encountered`);
  } catch (error) {
    await connection.rollback();
    console.error('Transaction failed:', error);
  } finally {
    connection.release();
  }
}

// Main execution
async function main() {
  // 使用命令行参数提供的路径，或使用默认路径
  const filePath = process.argv.length > 2 
    ? path.resolve(process.argv[2])
    : DEFAULT_EXCEL_PATH;
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    console.error(`Please check that the Excel file exists at this location or specify the correct path.`);
    process.exit(1);
  }

  try {
    await importNewStudents(filePath);
    console.log('Import completed successfully');
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

// 仅当此脚本直接运行时才执行main函数
if (require.main === module) {
  main();
}

// 导出函数以便其他脚本可以使用
module.exports = { importNewStudents }; 