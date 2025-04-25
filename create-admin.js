// 创建管理员账号（本地MySQL和Render PostgreSQL）
const db = require('./database');
const bcrypt = require('bcrypt');

// 配置信息
const adminConfig = {
  username: '2403880d',  // 管理员用户名 - 使用已存在的学号
  password: 'Admin@2025',  // 管理员密码
  email: 'admin@tp.edu.sg'  // 邮箱
};

// 创建管理员账号
async function createAdminAccount() {
  try {
    console.log('开始创建管理员账号...');
    
    // 生成密码哈希
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(adminConfig.password, saltRounds);
    console.log('密码哈希已生成');
    
    // 1. 查找现有学生记录
    let studentId;
    
    const findStudentQuery = db.isPostgres
      ? 'SELECT id FROM students WHERE index_number = $1'
      : 'SELECT id FROM students WHERE index_number = ?';
    
    const existingStudents = await db.query(findStudentQuery, [adminConfig.username]);
    
    if (existingStudents.length === 0) {
      console.error(`错误：找不到学号为 ${adminConfig.username} 的学生记录`);
      return;
    }
    
    studentId = existingStudents[0].id;
    console.log(`找到学生记录，ID: ${studentId}`);
    
    // 获取学生信息
    const getStudentInfoQuery = db.isPostgres
      ? 'SELECT name, course, email FROM students WHERE id = $1'
      : 'SELECT name, course, email FROM students WHERE id = ?';
    
    const studentInfo = await db.query(getStudentInfoQuery, [studentId]);
    console.log('学生信息:', studentInfo[0]);
    
    // 2. 查找是否已存在对应用户账号
    const findUserQuery = db.isPostgres
      ? 'SELECT id FROM users WHERE username = $1'
      : 'SELECT id FROM users WHERE username = ?';
    
    const existingUsers = await db.query(findUserQuery, [adminConfig.username]);
    
    if (existingUsers.length > 0) {
      // 更新已存在的用户账号
      const userId = existingUsers[0].id;
      const updateUserQuery = db.isPostgres
        ? 'UPDATE users SET password_hash = $1, role = $2, email = $3 WHERE id = $4'
        : 'UPDATE users SET password_hash = ?, role = ?, email = ? WHERE id = ?';
      
      await db.query(updateUserQuery, [passwordHash, 'admin', adminConfig.email, userId]);
      console.log(`已更新管理员用户账号，ID: ${userId}`);
    } else {
      // 创建新用户记录（管理员角色）
      if (db.isPostgres) {
        // PostgreSQL (Render)
        await db.query(
          'INSERT INTO users (username, password_hash, student_id, email, role) VALUES ($1, $2, $3, $4, $5)',
          [adminConfig.username, passwordHash, studentId, adminConfig.email, 'admin']
        );
      } else {
        // MySQL (本地)
        await db.query(
          'INSERT INTO users (username, password_hash, student_id, email, role) VALUES (?, ?, ?, ?, ?)',
          [adminConfig.username, passwordHash, studentId, adminConfig.email, 'admin']
        );
      }
      console.log('管理员用户账号已创建');
    }
    
    console.log('管理员用户已创建成功！');
    console.log(`用户名: ${adminConfig.username}`);
    console.log(`密码: ${adminConfig.password} (请妥善保管)`);
    
    // 检查创建的账号
    const userQuery = db.isPostgres
      ? 'SELECT u.id, u.username, u.role, s.name, s.index_number FROM users u JOIN students s ON u.student_id = s.id WHERE u.username = $1'
      : 'SELECT u.id, u.username, u.role, s.name, s.index_number FROM users u JOIN students s ON u.student_id = s.id WHERE u.username = ?';
    
    const userData = await db.query(userQuery, [adminConfig.username]);
    console.log('管理员账号信息:');
    console.log(userData[0]);
    
  } catch (error) {
    console.error('创建管理员账号时发生错误:', error);
    
    // 查看是否为重复键错误
    if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
      console.log('用户名或学号已存在，请修改adminConfig配置后重试');
    }
  } finally {
    // 关闭数据库连接
    await db.closeConnections();
    console.log('数据库连接已关闭');
  }
}

// 运行创建函数
createAdminAccount();
