/**
 * Database Migration Script
 * 
 * This script updates the users table structure to use student_id
 * instead of index_number and fixes any corrupted relationships
 */

const mysql = require('mysql2/promise');
const config = require('./config');

async function migrateDatabase() {
  let connection;
  
  try {
    console.log('Starting database migration...');
    console.log(`Environment: ${config.NODE_ENV}`);
    console.log(`Database: ${config.DB_CONFIG.database}`);
    
    // 连接到数据库
    connection = await mysql.createConnection(config.DB_CONFIG);
    
    // 1. 检查users表是否存在
    const [tables] = await connection.query(`
      SHOW TABLES LIKE 'users'
    `);
    
    if (tables.length === 0) {
      console.log('Users table not found, creating...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          student_id INT NOT NULL,
          email VARCHAR(255),
          role ENUM('admin', 'student', 'teacher') NOT NULL DEFAULT 'student',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMP NULL,
          FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
        )
      `);
      console.log('Users table created successfully');
      return;
    }
    
    // 2. 创建备份表
    console.log('Creating backup of users table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users_backup LIKE users
    `);
    
    await connection.query(`
      INSERT INTO users_backup SELECT * FROM users
    `);
    console.log('Backup created');
    
    // 3. 检查表结构
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM users
    `);
    
    const columnNames = columns.map(col => col.Field.toLowerCase());
    console.log('Current columns:', columnNames);
    
    const hasIndexNumber = columnNames.includes('index_number');
    const hasStudentId = columnNames.includes('student_id');
    
    // 4. 根据需要修改表结构
    if (hasIndexNumber && !hasStudentId) {
      console.log('Migrating from index_number to student_id...');
      
      // 4.1 获取外键约束名称
      const [constraints] = await connection.query(`
        SELECT CONSTRAINT_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = ? 
          AND TABLE_NAME = 'users'
          AND REFERENCED_TABLE_NAME IS NOT NULL
          AND COLUMN_NAME = 'index_number'
      `, [config.DB_CONFIG.database]);
      
      // 4.2 删除外键约束
      if (constraints.length > 0) {
        for (const constraint of constraints) {
          await connection.query(`
            ALTER TABLE users
            DROP FOREIGN KEY ${constraint.CONSTRAINT_NAME}
          `);
          console.log(`Dropped foreign key: ${constraint.CONSTRAINT_NAME}`);
        }
      }
      
      // 4.3 添加student_id列
      await connection.query(`
        ALTER TABLE users
        ADD COLUMN student_id INT NULL
      `);
      console.log('Added student_id column');
      
      // 4.4 填充student_id值
      await connection.query(`
        UPDATE users u
        JOIN students s ON u.index_number = s.index_number
        SET u.student_id = s.id
      `);
      console.log('Updated student_id values');
      
      // 4.5 设置student_id为NOT NULL
      await connection.query(`
        ALTER TABLE users
        MODIFY student_id INT NOT NULL
      `);
      
      // 4.6 创建新的外键约束
      await connection.query(`
        ALTER TABLE users
        ADD CONSTRAINT fk_users_student_id
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      `);
      console.log('Added foreign key constraint');
      
      // 4.7 删除旧的index_number列
      await connection.query(`
        ALTER TABLE users
        DROP COLUMN index_number
      `);
      console.log('Dropped index_number column');
      
      console.log('Migration successfully completed');
    } else if (hasStudentId) {
      console.log('Table structure already has student_id, checking foreign key...');
      
      // 检查student_id的外键是否正确设置
      const [fkConstraints] = await connection.query(`
        SELECT CONSTRAINT_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = ?
          AND TABLE_NAME = 'users'
          AND REFERENCED_TABLE_NAME = 'students'
          AND COLUMN_NAME = 'student_id'
      `, [config.DB_CONFIG.database]);
      
      if (fkConstraints.length === 0) {
        console.log('Foreign key for student_id not found, adding...');
        await connection.query(`
          ALTER TABLE users
          ADD CONSTRAINT fk_users_student_id
          FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
        `);
        console.log('Foreign key added');
      } else {
        console.log('Foreign key already exists');
      }
      
      if (hasIndexNumber) {
        console.log('Table structure already has student_id but index_number still exists, removing...');
        
        // 删除index_number的外键约束
        const [indexConstraints] = await connection.query(`
          SELECT CONSTRAINT_NAME
          FROM information_schema.KEY_COLUMN_USAGE
          WHERE TABLE_SCHEMA = ?
            AND TABLE_NAME = 'users'
            AND REFERENCED_TABLE_NAME IS NOT NULL
            AND COLUMN_NAME = 'index_number'
        `, [config.DB_CONFIG.database]);
        
        if (indexConstraints.length > 0) {
          for (const constraint of indexConstraints) {
            await connection.query(`
              ALTER TABLE users
              DROP FOREIGN KEY ${constraint.CONSTRAINT_NAME}
            `);
            console.log(`Dropped foreign key: ${constraint.CONSTRAINT_NAME}`);
          }
        }
        
        // 删除index_number列
        await connection.query(`
          ALTER TABLE users
          DROP COLUMN index_number
        `);
        console.log('Dropped index_number column');
      }
    } else {
      console.log('Unexpected table structure, please check manually');
    }
    
    // 5. 特殊处理: 清理测试学生ID的用户账户
    const testStudentId = '2403880d';
    console.log(`Cleaning up any existing accounts for student ID: ${testStudentId}`);
    
    const [students] = await connection.query(
      'SELECT id FROM students WHERE index_number = ?',
      [testStudentId]
    );
    
    if (students.length > 0) {
      const studentId = students[0].id;
      const [result] = await connection.query(
        'DELETE FROM users WHERE student_id = ?',
        [studentId]
      );
      console.log(`Deleted ${result.affectedRows} user accounts for student ID ${testStudentId}`);
    } else {
      console.log(`Student with ID ${testStudentId} not found in database`);
    }
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// 运行迁移
migrateDatabase().catch(console.error); 