const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const config = require('./config'); // 使用新的配置系统
const db = require('./database'); // 引入统一的数据库连接模块
const { authenticateUser, revokeToken, verifyStudentId, registerUser, setUserPassword, createUserAccount } = require('./src/lib/auth');
const { authenticate, authorize } = require('./src/lib/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'build')));

// Upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Initialize database
async function initializeDatabase() {
  try {
    const connection = await db.getConnection();
    
    if (db.isPostgres) {
      // PostgreSQL initialization
      await connection.beginTransaction();
      
      // Create students table - Postgres version
      await connection.query(`
        CREATE TABLE IF NOT EXISTS students (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          course VARCHAR(255),
          index_number VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(255),
          total_sessions INT DEFAULT 0,
          attended_sessions INT DEFAULT 0,
          attendance_rate DECIMAL(5,2) DEFAULT 0.00,
          last_attendance TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create attendance table - Postgres version
      await connection.query(`
        CREATE TABLE IF NOT EXISTS attendance (
          id SERIAL PRIMARY KEY,
          student_id INT NOT NULL,
          check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          location_lat DECIMAL(10, 8),
          location_lng DECIMAL(11, 8),
          session_id INT,
          FOREIGN KEY (student_id) REFERENCES students(id)
        )
      `);
      
      // Create users table - Postgres version
      // Note: Postgres doesn't support ENUM the same way, so using VARCHAR with CHECK constraint
      await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          student_id INT NOT NULL,
          email VARCHAR(255),
          role VARCHAR(10) NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student', 'teacher')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMP NULL,
          FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
        )
      `);
      
      // Create revoked tokens table - Postgres version
      await connection.query(`
        CREATE TABLE IF NOT EXISTS revoked_tokens (
          id SERIAL PRIMARY KEY,
          token_id VARCHAR(255) NOT NULL,
          expiry TIMESTAMP NOT NULL,
          revoked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Add indexes for revoked tokens - Postgres version
      await connection.query(`
        CREATE INDEX IF NOT EXISTS idx_token_id ON revoked_tokens (token_id);
        CREATE INDEX IF NOT EXISTS idx_expiry ON revoked_tokens (expiry);
      `);
      
      await connection.commit();
    } else {
      // MySQL initialization
      
      // Create students table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS students (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          course VARCHAR(255),
          index_number VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(255),
          total_sessions INT DEFAULT 0,
          attended_sessions INT DEFAULT 0,
          attendance_rate DECIMAL(5,2) DEFAULT 0.00,
          last_attendance TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create attendance table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS attendance (
          id INT AUTO_INCREMENT PRIMARY KEY,
          student_id INT NOT NULL,
          check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          location_lat DECIMAL(10, 8),
          location_lng DECIMAL(11, 8),
          session_id INT,
          FOREIGN KEY (student_id) REFERENCES students(id)
        )
      `);
      
      // Create users table
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
      
      // Create revoked tokens table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS revoked_tokens (
          id INT AUTO_INCREMENT PRIMARY KEY,
          token_id VARCHAR(255) NOT NULL,
          expiry TIMESTAMP NOT NULL,
          revoked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX (token_id),
          INDEX (expiry)
        )
      `);
    }
    
    connection.release();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// API Endpoints

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username is required' 
      });
    }
    
    const result = await authenticateUser(username, password);
    
    // 返回不同的响应，取决于是否需要设置密码
    if (result.success && result.needsPasswordSetup) {
      return res.json({
        success: true,
        needsPasswordSetup: true,
        user: result.user,
        message: result.message || 'Please set your password to continue'
      });
    }
    
    if (!result.success) {
      return res.status(401).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
});

// 设置用户密码
app.post('/api/auth/set-password', async (req, res) => {
  try {
    const { userId, studentId, password } = req.body;
    
    if ((!studentId && !userId) || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '学生ID/用户ID和密码不能为空' 
      });
    }
    
    const auth = require('./src/lib/auth');
    let result;
    
    if (userId) {
      // 使用用户ID设置密码
      result = await auth.setUserPassword(userId, password);
    } else {
      // 使用学生ID设置密码 - 查找对应的用户ID
      const userQuery = db.isPostgres
        ? 'SELECT u.id FROM users u JOIN students s ON u.student_id = s.id WHERE s.index_number = $1'
        : 'SELECT u.id FROM users u JOIN students s ON u.student_id = s.id WHERE s.index_number = ?';
      
      const userRows = await db.query(userQuery, [studentId]);
      
      if (userRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: '用户不存在'
        });
      }
      
      result = await auth.setUserPassword(userRows[0].id, password);
    }
    
    if (result.success) {
      return res.json({
        success: true,
        message: '密码设置成功',
        token: result.token,
        user: result.user
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message || '设置密码失败'
      });
    }
  } catch (error) {
    console.error('设置密码时出错:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后再试' 
    });
  }
});

// 验证学生ID
app.post('/api/auth/verify-student', async (req, res) => {
  try {
    const { studentId } = req.body;
    
    if (!studentId) {
      return res.status(400).json({ 
        success: false, 
        message: '学生ID不能为空' 
      });
    }
    
    const auth = require('./src/lib/auth');
    const result = await auth.verifyStudentId(studentId);
    
    // 检查学生是否已有账户
    const userQuery = db.isPostgres
      ? 'SELECT * FROM users WHERE student_id = $1'
      : 'SELECT * FROM users WHERE student_id = ?';
    
    const userRows = await db.query(userQuery, [studentId]);
    
    if (userRows.length > 0) {
      // 用户已存在
      const user = userRows[0];
      
      if (!user.password) {
        // 用户存在但没有密码
        return res.json({
          success: true,
          hasAccount: true,
          needsPassword: true,
          message: '账户已存在但需要设置密码，请前往登录页面'
        });
      } else {
        // 用户已存在且有密码
        return res.json({
          success: true,
          hasAccount: true,
          needsPassword: false,
          message: '账户已存在，请直接登录'
        });
      }
    }
    
    if (result.success) {
      // 学生存在但没有账户，创建一个没有密码的账户
      await auth.createUserAccount(studentId);
      
      return res.json({
        success: true,
        hasAccount: false,
        needsPassword: true,
        message: '验证成功，账户已创建。请前往登录页面设置密码'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message || '学生ID验证失败'
      });
    }
  } catch (error) {
    console.error('验证学生ID时出错:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误，请稍后再试' 
    });
  }
});

// 不再需要注册端点，改用verify-student和set-password的组合
// 保留以兼容旧前端逻辑
app.post('/api/auth/register', async (req, res) => {
  try {
    const { studentId, password } = req.body;
    
    if (!studentId || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID and password are required' 
      });
    }
    
    // 先验证学生ID
    const verifyResult = await verifyStudentId(studentId);
    
    if (!verifyResult.success) {
      return res.status(400).json(verifyResult);
    }
    
    // 如果已有账户但需要设置密码
    if (verifyResult.hasAccount && verifyResult.needsPasswordSetup) {
      // 获取用户信息
      const userQuery = db.isPostgres
        ? `SELECT u.id FROM users u 
           JOIN students s ON u.student_id = s.id 
           WHERE s.index_number = $1`
        : `SELECT u.id FROM users u 
           JOIN students s ON u.student_id = s.id 
           WHERE s.index_number = ?`;
      
      const users = await db.query(userQuery, [studentId.toLowerCase()]);
      
      if (users.length > 0) {
        // 设置密码
        const setPasswordResult = await setUserPassword(users[0].id, password);
        return res.json(setPasswordResult);
      }
    }
    
    // 如果没有账户，创建账户并设置密码
    if (!verifyResult.hasAccount) {
      // 先创建账户
      const createResult = await createUserAccount(studentId);
      
      if (!createResult.success) {
        return res.status(400).json(createResult);
      }
      
      // 然后设置密码
      const setPasswordResult = await setUserPassword(createResult.user.id, password);
      return res.json(setPasswordResult);
    }
    
    // 不应该到达这里，但以防万一
    return res.status(400).json({ 
      success: false, 
      message: 'Account already exists and has a password set' 
    });
    
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error registering user' 
    });
  }
});

// 用户登出
app.post('/api/auth/logout', authenticate, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];
    
    const success = await revokeToken(token);
    
    res.json({ success });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Logout failed' 
    });
  }
});

// User profile route
app.get('/api/users/profile', authenticate, async (req, res) => {
  try {
    // Get user details
    const userQuery = db.isPostgres
      ? `SELECT u.id, u.username, u.role, s.name, s.index_number, s.email, s.course
         FROM users u
         JOIN students s ON u.student_id = s.id
         WHERE u.id = $1`
      : `SELECT u.id, u.username, u.role, s.name, s.index_number, s.email, s.course
         FROM users u
         JOIN students s ON u.student_id = s.id
         WHERE u.id = ?`;
    
    const users = await db.query(userQuery, [req.user.id]);
    
    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User data not found' 
      });
    }
    
    res.json({ 
      success: true, 
      user: users[0] 
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to load user profile' 
    });
  }
});

// Protected routes - only accessible to authenticated users

// Get all students (admin only)
app.get('/api/students', authenticate, authorize(['admin', 'teacher']), async (req, res) => {
  try {
    const studentsQuery = `SELECT id, name, course, index_number, email, 
            total_sessions, attended_sessions, attendance_rate
     FROM students`;
    
    const rows = await db.query(studentsQuery);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Import students from Excel (admin only)
app.post('/api/import-students', authenticate, authorize(['admin']), upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read Excel file
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return res.status(400).json({ error: 'Excel file is empty' });
    }

    // Process and insert data
    const connection = await db.getConnection();
    let inserted = 0;
    let errors = 0;

    try {
      await connection.beginTransaction();

      for (const row of jsonData) {
        const name = row['Name'] || '';
        const course = row['Course'] || '';
        const indexNumber = (row['index number'] || '').toString().trim();
        
        if (!name || !indexNumber) {
          errors++;
          continue;
        }

        try {
          // Check if student already exists
          const existingQuery = db.isPostgres
            ? 'SELECT id FROM students WHERE index_number = $1'
            : 'SELECT id FROM students WHERE index_number = ?';
          
          const existing = await connection.query(existingQuery, [indexNumber]);
          
          if (existing.length === 0) {
            // Insert new student
            const insertQuery = db.isPostgres
              ? 'INSERT INTO students (name, course, index_number) VALUES ($1, $2, $3)'
              : 'INSERT INTO students (name, course, index_number) VALUES (?, ?, ?)';
            
            await connection.query(insertQuery, [name, course, indexNumber]);
            inserted++;
          } else {
            // Update existing student
            const updateQuery = db.isPostgres
              ? 'UPDATE students SET name = $1, course = $2 WHERE index_number = $3'
              : 'UPDATE students SET name = ?, course = ? WHERE index_number = ?';
            
            await connection.query(updateQuery, [name, course, indexNumber]);
            inserted++;
          }
        } catch (error) {
          console.error('Error inserting/updating student:', error);
          errors++;
        }
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    res.json({
      success: true,
      message: `Processed ${jsonData.length} records: ${inserted} inserted/updated, ${errors} errors`
    });
  } catch (error) {
    console.error('Error importing students:', error);
    res.status(500).json({ error: 'Failed to import students' });
  }
});

// Record attendance - now requires authentication
app.post('/api/attendance', authenticate, async (req, res) => {
  try {
    const { locationLat, locationLng } = req.body;
    
    // Use index_number from authenticated user
    const indexNumber = req.user.index_number;
    
    if (!indexNumber) {
      return res.status(400).json({ error: 'Student index number is required' });
    }
    
    // Find student by index number
    const [students] = await pool.query(
      'SELECT id FROM students WHERE index_number = ?',
      [indexNumber]
    );
    
    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Record attendance
    await pool.query(
      'INSERT INTO attendance (student_id, location_lat, location_lng) VALUES (?, ?, ?)',
      [students[0].id, locationLat, locationLng]
    );

    // Update student attendance stats
    await pool.query(`
      UPDATE students SET 
        attended_sessions = attended_sessions + 1,
        attendance_rate = (attended_sessions + 1) / (CASE WHEN total_sessions = 0 THEN 1 ELSE total_sessions END) * 100,
        last_attendance = NOW()
      WHERE id = ?
    `, [students[0].id]);
    
    res.json({ success: true, message: 'Attendance recorded successfully' });
  } catch (error) {
    console.error('Error recording attendance:', error);
    res.status(500).json({ error: 'Failed to record attendance' });
  }
});

// Export attendance to Excel (admin only)
app.get('/api/export-attendance', authenticate, authorize(['admin', 'teacher']), async (req, res) => {
  try {
    // Get attendance data with student info
    const [rows] = await pool.query(`
      SELECT s.name, s.course, s.index_number, a.check_in_time, a.location_lat, a.location_lng
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      ORDER BY a.check_in_time DESC
    `);
    
    // Create Excel file
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
    
    // Save to temp file
    const fileName = `attendance-${Date.now()}.xlsx`;
    const filePath = path.join('uploads', fileName);
    XLSX.writeFile(workbook, filePath);
    
    // Send file to client
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Error sending file:', err);
      }
      // Delete temp file after sending
      fs.unlinkSync(filePath);
    });
  } catch (error) {
    console.error('Error exporting attendance:', error);
    res.status(500).json({ error: 'Failed to export attendance' });
  }
});

// Get student detail (for student or admin)
app.get('/api/students/:id', authenticate, async (req, res) => {
  try {
    const paramId = req.params.id;
    let studentId = paramId;
    
    // 检查ID类型并转换 - 用户ID可能与学生ID不同
    // 如果是用户ID，先查询对应的学生ID
    if (req.user.role === 'student' && req.user.id.toString() === paramId) {
      // 如果是当前登录用户查询自己的信息，直接使用token中的用户ID
      const [userStudentMapping] = await pool.query(
        'SELECT student_id FROM users WHERE id = ?',
        [paramId]
      );
      
      if (userStudentMapping.length > 0) {
        studentId = userStudentMapping[0].student_id;
      }
    } else if (req.user.role !== 'admin' && req.user.id !== parseInt(paramId)) {
      // 如果不是管理员，且不是查询自己的信息，则拒绝访问
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to access this student data' 
      });
    }
    
    // Get student details
    const [students] = await pool.query(
      `SELECT s.*, u.username, u.role, u.id as user_id
       FROM students s
       JOIN users u ON s.id = u.student_id
       WHERE s.id = ?`,
      [studentId]
    );
    
    if (students.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student data not found' 
      });
    }
    
    res.json({ 
      success: true, 
      student: students[0] 
    });
  } catch (error) {
    console.error('Error fetching student data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to load student data' 
    });
  }
});

// Get student attendance records
app.get('/api/students/:id/attendance', authenticate, async (req, res) => {
  try {
    const paramId = req.params.id;
    let studentId = paramId;
    
    // 检查ID类型并转换 - 用户ID可能与学生ID不同
    // 如果是用户ID，先查询对应的学生ID
    if (req.user.role === 'student' && req.user.id.toString() === paramId) {
      // 如果是当前登录用户查询自己的信息
      const [userStudentMapping] = await pool.query(
        'SELECT student_id FROM users WHERE id = ?',
        [paramId]
      );
      
      if (userStudentMapping.length > 0) {
        studentId = userStudentMapping[0].student_id;
      }
    } else if (req.user.role !== 'admin' && req.user.id !== parseInt(paramId)) {
      // 如果不是管理员，且不是查询自己的信息，则拒绝访问
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to access this student attendance records' 
      });
    }
    
    // Get attendance records
    const [attendance] = await pool.query(
      `SELECT * FROM attendance 
       WHERE student_id = ? 
       ORDER BY check_in_time DESC 
       LIMIT 10`,
      [studentId]
    );
    
    res.json({ 
      success: true, 
      attendance 
    });
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to load attendance records' 
    });
  }
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Initialize database and start server
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${config.NODE_ENV}`);
    console.log(`Database: ${config.DB_CONFIG.database}`);
    console.log('Note: Default password policy has been updated - all users now use their student ID as password');
  });
}); 