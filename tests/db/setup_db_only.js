const mysql = require('mysql2/promise'); 
const fs = require('fs'); 
require('dotenv').config(); 

async function setup() { 
  try { 
    console.log('连接到数据库...'); 
    const conn = await mysql.createConnection({ 
      host: process.env.DB_HOST, 
      user: process.env.DB_USER, 
      password: process.env.DB_PASSWORD, 
      multipleStatements: true 
    }); 
    
    console.log('读取SQL脚本...'); 
    const sql = fs.readFileSync('setup-db.sql', 'utf8'); 
    
    console.log('执行SQL脚本...'); 
    await conn.query(sql); 
    console.log('数据库表创建成功!'); 
    
    await conn.end(); 
  } catch (e) { 
    console.error('设置失败:', e.message); 
  } 
} 

setup(); 