const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const config = require('./config'); // 使用新的配置系统
const { authenticateUser, revokeToken, verifyStudentId, registerUser } = require('./src/lib/auth');
const { authenticate, authorize } = require('./src/lib/authMiddleware');

const app = express();
const PORT = config.PORT;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'build')));

// Create MySQL connection pool
const pool = mysql.createPool({
  ...config.DB_CONFIG,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

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
    const connection = await pool.getConnection();
    
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

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }
    
    const result = await authenticateUser(username, password);
    
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

// 验证学生ID
app.post('/api/auth/verify-student', async (req, res) => {
  try {
    const { studentId } = req.body;
    
    if (!studentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID is required' 
      });
    }
    
    const result = await verifyStudentId(studentId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Verify student error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error verifying student ID' 
    });
  }
});

// 注册新用户
app.post('/api/auth/register', async (req, res) => {
  try {
    const { studentId, password } = req.body;
    
    if (!studentId || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID and password are required' 
      });
    }
    
    const result = await registerUser(studentId, password);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error registering user' 
    });
  }
});

app.post('/api/auth/logout', authenticate, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];
    
    const success = await revokeToken(token);
    
    if (success) {
      res.json({ success: true, message: 'Logged out successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to logout' });
    }
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
});

// User profile route
app.get('/api/users/profile', authenticate, async (req, res) => {
  try {
    // Get user details
    const [users] = await pool.query(
      `SELECT u.id, u.username, u.role, s.name, s.index_number, s.email, s.course
       FROM users u
       JOIN students s ON u.student_id = s.id
       WHERE u.id = ?`,
      [req.user.id]
    );
    
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
    const [rows] = await pool.query(
      `SELECT id, name, course, index_number, email, 
              total_sessions, attended_sessions, attendance_rate
       FROM students`
    );
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
    const connection = await pool.getConnection();
    let inserted = 0;
    let errors = 0;

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
        const [existing] = await connection.query(
          'SELECT id FROM students WHERE index_number = ?', 
          [indexNumber]
        );
        
        if (existing.length === 0) {
          // Insert new student
          await connection.query(
            'INSERT INTO students (name, course, index_number) VALUES (?, ?, ?)',
            [name, course, indexNumber]
          );
          inserted++;
        } else {
          // Update existing student
          await connection.query(
            'UPDATE students SET name = ?, course = ? WHERE index_number = ?',
            [name, course, indexNumber]
          );
          inserted++;
        }
      } catch (error) {
        console.error('Error inserting/updating student:', error);
        errors++;
      }
    }

    connection.release();
    
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
    const studentId = req.params.id;
    
    // Check if user is authorized to access this student's data
    if (req.user.role !== 'admin' && req.user.id !== parseInt(studentId)) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to access this student data' 
      });
    }
    
    // Get student details
    const [students] = await pool.query(
      `SELECT s.*, u.username, u.role
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
    const studentId = req.params.id;
    
    // Check if user is authorized to access this student's data
    if (req.user.role !== 'admin' && req.user.id !== parseInt(studentId)) {
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
  });
}); 