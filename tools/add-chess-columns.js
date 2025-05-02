/**
 * 添加Chess.com相关列到students表
 * 
 * 该脚本添加Chess.com用户名和评分相关列到students表中
 */

const db = require('../database');

async function addChessColumns() {
  try {
    console.log('开始添加Chess.com相关列...');
    
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      if (db.isPostgres) {
        // PostgreSQL版本
        await connection.query(`
          ALTER TABLE students ADD COLUMN IF NOT EXISTS chess_username VARCHAR(50) DEFAULT NULL;
          ALTER TABLE students ADD COLUMN IF NOT EXISTS chess_rating INT DEFAULT NULL;
          ALTER TABLE students ADD COLUMN IF NOT EXISTS chess_rapid_rating INT DEFAULT NULL;
          ALTER TABLE students ADD COLUMN IF NOT EXISTS chess_bullet_rating INT DEFAULT NULL;
          ALTER TABLE students ADD COLUMN IF NOT EXISTS chess_daily_rating INT DEFAULT NULL;
          ALTER TABLE students ADD COLUMN IF NOT EXISTS chess_tactics_rating INT DEFAULT NULL;
          ALTER TABLE students ADD COLUMN IF NOT EXISTS chess_puzzle_rush_rating INT DEFAULT NULL;
        `);
      } else {
        // MySQL版本
        
        // 检查chess_username列是否存在
        const columnCheckResult = await connection.query(`
          SHOW COLUMNS FROM students LIKE 'chess_username'
        `);
        
        if (columnCheckResult.length === 0) {
          // 添加所有Chess.com相关列
          await connection.query(`
            ALTER TABLE students 
            ADD COLUMN chess_username VARCHAR(50) DEFAULT NULL,
            ADD COLUMN chess_rating INT DEFAULT NULL,
            ADD COLUMN chess_rapid_rating INT DEFAULT NULL,
            ADD COLUMN chess_bullet_rating INT DEFAULT NULL,
            ADD COLUMN chess_daily_rating INT DEFAULT NULL,
            ADD COLUMN chess_tactics_rating INT DEFAULT NULL,
            ADD COLUMN chess_puzzle_rush_rating INT DEFAULT NULL
          `);
        } else {
          console.log('Chess.com相关列已存在，跳过添加');
        }
      }
      
      await connection.commit();
      console.log('成功添加Chess.com相关列');
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('添加Chess.com相关列失败:', error);
  } finally {
    // 关闭数据库连接
    process.exit(0);
  }
}

// 执行迁移
addChessColumns(); 