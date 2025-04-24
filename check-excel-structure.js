/**
 * Excel文件结构检查工具
 * 
 * 此脚本将读取指定的Excel文件并输出其结构信息，包括:
 * - 工作表列表
 * - 每个工作表的列名
 * - 示例数据
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// 要检查的Excel文件路径
const excelFiles = ['src/cca attendance system.xlsx', 'cca attendance system.xlsx'];
let excelFile = null;

// 查找文件
for (const file of excelFiles) {
  if (fs.existsSync(file)) {
    excelFile = file;
    break;
  }
}

if (!excelFile) {
  console.error('错误: 找不到Excel文件。请确保文件路径正确。');
  process.exit(1);
}

// 读取Excel文件
console.log(`\n====== 读取Excel文件: ${excelFile} ======\n`);
const workbook = XLSX.readFile(excelFile);

// 输出工作表列表
console.log(`工作表列表: ${workbook.SheetNames.join(', ')}\n`);

// 分析每个工作表
workbook.SheetNames.forEach((sheetName) => {
  console.log(`\n====== 工作表: ${sheetName} ======\n`);
  
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  if (data.length === 0) {
    console.log(`工作表为空或格式不支持\n`);
    return;
  }
  
  // 输出列名
  const columns = Object.keys(data[0]);
  console.log(`列名 (${columns.length}): ${columns.join(', ')}\n`);
  
  // 输出前2行数据作为示例
  console.log(`数据样例 (共${data.length}条记录):`);
  console.log(JSON.stringify(data.slice(0, 2), null, 2));
  
  // 检查数据一致性 - 检查是否所有行都有相同的列
  const hasConsistentColumns = data.every(row => 
    Object.keys(row).length === columns.length && 
    columns.every(col => col in row)
  );
  
  console.log(`\n数据列一致性: ${hasConsistentColumns ? '✓ 良好' : '✗ 存在不一致'}`);
  
  if (!hasConsistentColumns) {
    // 找出不一致的行
    data.forEach((row, i) => {
      const rowColumns = Object.keys(row);
      if (rowColumns.length !== columns.length || !columns.every(col => col in row)) {
        console.log(`  - 第${i+1}行列不一致: ${rowColumns.join(', ')}`);
      }
    });
  }
});

console.log('\n====== 建议映射 ======\n');
// 假设我们使用第一个工作表的数据
const firstSheet = workbook.SheetNames[0];
const data = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);

if (data.length > 0) {
  const columns = Object.keys(data[0]);
  
  // 猜测名称列
  const possibleNameCols = columns.filter(col => 
    /name|student|学生|姓名/i.test(col)
  );
  
  // 猜测ID列
  const possibleIdCols = columns.filter(col => 
    /id|index|number|学号|编号/i.test(col)
  );
  
  // 猜测课程/班级列
  const possibleCourseCols = columns.filter(col => 
    /course|class|班级|课程/i.test(col)
  );
  
  // 猜测邮箱列
  const possibleEmailCols = columns.filter(col => 
    /email|mail|邮箱|邮件/i.test(col)
  );
  
  console.log('根据当前Excel文件结构，建议在脚本中使用以下映射:');
  console.log(`姓名列 - 可能是: ${possibleNameCols.join(' 或 ')}`);
  console.log(`学号列 - 可能是: ${possibleIdCols.join(' 或 ')}`);
  console.log(`班级列 - 可能是: ${possibleCourseCols.join(' 或 ')}`);
  console.log(`邮箱列 - 可能是: ${possibleEmailCols.join(' 或 ')}`);
} 