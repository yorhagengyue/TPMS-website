/**
 * Database Tables Content Check Script
 * 
 * This script checks all tables in the database to see which ones have content
 */

const mysql = require('mysql2/promise');
const config = require('./config');

async function checkTablesContent() {
  let connection;
  
  try {
    console.log('正在连接MySQL数据库...');
    console.log(`数据库: ${config.DB_CONFIG.database}`);
    console.log(`环境: ${config.NODE_ENV}`);
    
    // 连接数据库
    connection = await mysql.createConnection(config.DB_CONFIG);
    console.log('成功连接到MySQL数据库');
    
    // 获取所有表名
    const [tables] = await connection.query(`
      SHOW TABLES FROM ${config.DB_CONFIG.database}
    `);
    
    console.log(`\n数据库 ${config.DB_CONFIG.database} 中共有 ${tables.length} 个表格:`);
    
    // 检查每个表的记录数
    console.log('\n表格内容统计:');
    console.log('| 表名 | 记录数 | 是否有内容 |');
    console.log('|------|--------|------------|');
    
    for (const tableObj of tables) {
      const tableName = Object.values(tableObj)[0];
      
      // 获取表中的记录数
      const [countResult] = await connection.query(`SELECT COUNT(*) AS count FROM ${tableName}`);
      const count = countResult[0].count;
      
      // 检查表结构
      const [columns] = await connection.query(`SHOW COLUMNS FROM ${tableName}`);
      
      // 显示结果
      console.log(`| ${tableName} | ${count} | ${count > 0 ? '✓' : '✗'} |`);
      
      // 如果表有内容，获取样本数据
      if (count > 0) {
        // 获取前3条记录作为样本
        const [sampleData] = await connection.query(`SELECT * FROM ${tableName} LIMIT 3`);
        
        console.log(`\n${tableName} 表样本数据 (前3条):`);
        console.table(sampleData);
        
        // 如果是特定表，显示更多详细信息
        if (tableName === 'departments') {
          console.log(`\n${tableName} 表中所有部门:`);
          const [allDepartments] = await connection.query(`SELECT * FROM departments`);
          console.table(allDepartments);
        }
      } else {
        console.log(`\n${tableName} 表无数据`);
      }
      
      console.log('------------------------');
    }
    
    // 总结
    console.log('\n数据库内容总结:');
    
    // 统计有内容的表格
    const [countQuery] = await connection.query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.tables 
              WHERE table_schema = '${config.DB_CONFIG.database}') as total_tables,
             SUM(table_rows) as total_records
      FROM information_schema.tables
      WHERE table_schema = '${config.DB_CONFIG.database}'
      GROUP BY table_schema
    `);
    
    if (countQuery.length > 0) {
      console.log(`总表格数: ${countQuery[0].total_tables}`);
      console.log(`总记录数: ${countQuery[0].total_records}`);
    }
    
    // 获取特定关系的信息
    console.log('\n主要数据关系:');
    console.log('1. 学生和用户: students <-> users');
    console.log('2. 学生和出勤: students <-> attendance');
    console.log('3. 出勤分析: attendance_analysis <-> attendance_sessions');
    
  } catch (error) {
    console.error('检查表格内容时出错:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n数据库连接已关闭');
    }
  }
}

// 运行检查
checkTablesContent().catch(console.error); 