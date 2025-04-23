const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const config = require('./config'); // Use the new configuration system
const db = require('./database'); // Import unified database connection module
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
          phone_number VARCHAR(50),
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
          phone_number VARCHAR(50),
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

// Health check endpoint
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
    
    // Clean and normalize the username (student ID)
    const normalizedUsername = username.toLowerCase().replace(/\s+/g, '');
    
    console.log(`DEBUG: Login attempt with username: '${username}', normalized: '${normalizedUsername}'`);
    
    // First check if the student exists (by student ID)
    const studentQuery = db.isPostgres
      ? 'SELECT id FROM students WHERE LOWER(index_number) = $1'
      : 'SELECT id FROM students WHERE LOWER(index_number) = ?';
      
    const students = await db.query(studentQuery, [normalizedUsername]);
    
    console.log(`DEBUG: Login student query result: ${JSON.stringify(students)}`);
    
    if (students.length === 0) {
      // Try with less strict matching
      const fuzzyStudentQuery = db.isPostgres
        ? "SELECT id FROM students WHERE LOWER(TRIM(index_number)) = $1"
        : "SELECT id FROM students WHERE LOWER(TRIM(index_number)) = ?";
        
      const fuzzyStudents = await db.query(fuzzyStudentQuery, [normalizedUsername]);
      
      console.log(`DEBUG: Login fuzzy query result: ${JSON.stringify(fuzzyStudents)}`);
      
      if (fuzzyStudents.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Student ID not found'
        });
      }
      
      // Continue with the fuzzy match result
    }
    
    // Then call authenticateUser to attempt login
    const result = await authenticateUser(normalizedUsername, password);
    
    // Return different responses depending on whether password setup is needed
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

// Set user password
app.post('/api/auth/set-password', async (req, res) => {
  try {
    const { userId, studentId, password } = req.body;
    
    if ((!studentId && !userId) || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID/User ID and password cannot be empty' 
      });
    }
    
    const auth = require('./src/lib/auth');
    let result;
    
    if (userId) {
      // Set password using user ID
      result = await auth.setUserPassword(userId, password);
    } else {
      // Set password using student ID - need to find the numeric ID from student table first, then find the corresponding user ID
      const studentQuery = db.isPostgres
        ? 'SELECT id FROM students WHERE index_number = $1'
        : 'SELECT id FROM students WHERE index_number = ?';
      
      const studentRows = await db.query(studentQuery, [studentId.toLowerCase()]);
      
      if (studentRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Student does not exist'
        });
      }
      
      const studentDbId = studentRows[0].id;
      
      // Query user table using student numeric ID
      const userQuery = db.isPostgres
        ? 'SELECT id FROM users WHERE student_id = $1'
        : 'SELECT id FROM users WHERE student_id = ?';
      
      const userRows = await db.query(userQuery, [studentDbId]);
      
      if (userRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'User does not exist'
        });
      }
      
      result = await auth.setUserPassword(userRows[0].id, password);
    }
    
    if (result.success) {
      return res.json({
        success: true,
        message: 'Password set successfully',
        token: result.token,
        user: result.user
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message || 'Password setting failed'
      });
    }
  } catch (error) {
    console.error('Error setting password:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error, please try again later' 
    });
  }
});

// Verify student ID
app.post('/api/auth/verify-student', async (req, res) => {
  try {
    const { studentId } = req.body;
    
    if (!studentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID cannot be empty' 
      });
    }
    
    // Clean and normalize the student ID
    const normalizedStudentId = studentId.toLowerCase().replace(/\s+/g, '');
    
    console.log(`DEBUG: Verifying student ID: '${studentId}', normalized: '${normalizedStudentId}'`);
    
    // First find student record to get the numeric ID - use normalized ID
    const studentQuery = db.isPostgres
      ? 'SELECT id FROM students WHERE LOWER(index_number) = $1'
      : 'SELECT id FROM students WHERE LOWER(index_number) = ?';
      
    const studentRows = await db.query(studentQuery, [normalizedStudentId]);
    
    console.log(`DEBUG: Query result: ${JSON.stringify(studentRows)}`);
    
    if (studentRows.length === 0) {
      // Try one more time with less strict comparison (for databases that might have trailing spaces)
      const fuzzyStudentQuery = db.isPostgres
        ? "SELECT id FROM students WHERE LOWER(TRIM(index_number)) = $1"
        : "SELECT id FROM students WHERE LOWER(TRIM(index_number)) = ?";
        
      const fuzzyStudentRows = await db.query(fuzzyStudentQuery, [normalizedStudentId]);
      
      console.log(`DEBUG: Fuzzy query result: ${JSON.stringify(fuzzyStudentRows)}`);
      
      if (fuzzyStudentRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Student ID does not exist'
        });
      }
      
      // We found a match with the fuzzy query
      const studentDbId = fuzzyStudentRows[0].id;
      // Proceed with the rest of the function using this ID...
    } else {
      // A direct match was found
      const studentDbId = studentRows[0].id;
      
      const auth = require('./src/lib/auth');
      const result = await auth.verifyStudentId(normalizedStudentId);
      
      // Check if student already has an account - query using numeric ID
      const userQuery = db.isPostgres
        ? 'SELECT * FROM users WHERE student_id = $1'
        : 'SELECT * FROM users WHERE student_id = ?';
      
      const userRows = await db.query(userQuery, [studentDbId]);
      
      if (userRows.length > 0) {
        // User already exists
        const user = userRows[0];
        
        if (!user.password_hash || user.password_hash === '') {
          // User exists but has no password
          return res.json({
            success: true,
            hasAccount: true,
            needsPasswordSetup: true,
            message: 'Account exists but requires password setup. Please go to the login page.'
          });
        } else {
          // User already exists and has a password
          return res.json({
            success: true,
            hasAccount: true,
            needsPasswordSetup: false,
            message: 'Account already exists. Please log in directly.'
          });
        }
      }
      
      if (result.success) {
        // Student exists but has no account, create an account without a password
        await auth.createUserAccount(normalizedStudentId);
        
        return res.json({
          success: true,
          hasAccount: false,
          needsPasswordSetup: true,
          message: 'Verification successful, account has been created. Please go to the login page to set your password'
        });
      } else {
        return res.status(400).json({
          success: false,
          message: result.message || 'Student ID verification failed'
        });
      }
    }
  } catch (error) {
    console.error('Error verifying student ID:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error, please try again later' 
    });
  }
});

// No longer need registration endpoint, use combination of verify-student and set-password instead
// Keep for backward compatibility with old frontend logic
app.post('/api/auth/register', async (req, res) => {
  try {
    const { studentId, password } = req.body;
    
    if (!studentId || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID and password are required' 
      });
    }
    
    // First verify student ID
    const verifyResult = await verifyStudentId(studentId);
    
    if (!verifyResult.success) {
      return res.status(400).json(verifyResult);
    }
    
    // Check if account already exists
    if (verifyResult.hasAccount) {
      // Get user info - find student by ID (index_number), then find user
      const studentQuery = db.isPostgres
        ? 'SELECT id FROM students WHERE index_number = $1'
        : 'SELECT id FROM students WHERE index_number = ?';
      
      const students = await db.query(studentQuery, [studentId.toLowerCase()]);
      
      if (students.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Student not found'
        });
      }
      
      const userQuery = db.isPostgres
        ? 'SELECT id FROM users WHERE student_id = $1'
        : 'SELECT id FROM users WHERE student_id = ?';
      
      const users = await db.query(userQuery, [students[0].id]);
      
      if (users.length > 0) {
        // Set password
        const setPasswordResult = await setUserPassword(users[0].id, password);
        return res.json(setPasswordResult);
      }
    }
    
    // If no account exists, create an account and set password
    if (!verifyResult.hasAccount) {
      // First create the account
      const createResult = await createUserAccount(studentId);
      
      if (!createResult.success) {
        return res.status(400).json(createResult);
      }
      
      // Then set the password
      const setPasswordResult = await setUserPassword(createResult.user.id, password);
      return res.json(setPasswordResult);
    }
    
    // Should not reach here, but just in case
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

// User logout
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
    const studentsQuery = `SELECT id, name, course, index_number, email, phone_number, 
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
        const indexNumber = (row['index number'] || row['Admission Numbers'] || row['Admission Number'] || '').toString().trim();
        const email = row['Email'] || '';
        const phoneNumber = row['Phone Number'] || '';
        const totalSessions = parseInt(row['Total Number Training Sessions'] || 0);
        const attendanceRate = parseFloat(row['Percentage for Attendance'] || 0);
        const attendedSessions = Math.round((attendanceRate / 100) * totalSessions) || 0;
        
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
              ? 'INSERT INTO students (name, course, index_number, email, phone_number, total_sessions, attended_sessions, attendance_rate) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)'
              : 'INSERT INTO students (name, course, index_number, email, phone_number, total_sessions, attended_sessions, attendance_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
            
            await connection.query(insertQuery, [name, course, indexNumber, email, phoneNumber, totalSessions, attendedSessions, attendanceRate]);
            inserted++;
          } else {
            // Update existing student
            const updateQuery = db.isPostgres
              ? 'UPDATE students SET name = $1, course = $2, email = $3, phone_number = $4, total_sessions = $5, attended_sessions = $6, attendance_rate = $7 WHERE index_number = $8'
              : 'UPDATE students SET name = ?, course = ?, email = ?, phone_number = ?, total_sessions = ?, attended_sessions = ?, attendance_rate = ? WHERE index_number = ?';
            
            await connection.query(updateQuery, [name, course, email, phoneNumber, totalSessions, attendedSessions, attendanceRate, indexNumber]);
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
    
    // 检查当前时间是否在允许签到的时间范围内 (仅周五18:00-21:00)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0是周日，5是周五
    const hour = now.getHours();
    const isValidTime = dayOfWeek === 5 && hour >= 18 && hour < 21;
    
    if (!isValidTime) {
      const errorMsg = 'Check-in failed: CCA activities are only held on Fridays from 6:00 PM to 9:00 PM. Please check in during activity hours.';
      console.log(`Attendance rejected for ${indexNumber}: Not within allowed time window`);
      return res.status(403).json({ 
        success: false, 
        error: errorMsg,
        message: errorMsg
      });
    }
    
    // 检查位置是否在允许范围内（距离TP校园1公里内）
    const tpLocation = { 
      lat: 1.3445291,
      lng: 103.9326429
    };
    
    // 计算用户位置与TP校园的距离
    function calculateDistance(lat1, lon1, lat2, lon2) {
      const R = 6371; // 地球半径，单位km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c; // 距离，单位km
    }
    
    const distance = calculateDistance(
      parseFloat(locationLat), 
      parseFloat(locationLng), 
      tpLocation.lat, 
      tpLocation.lng
    );
    
    // 如果距离超过1公里，拒绝签到
    if (distance > 1.0) {
      const errorMsg = `Check-in failed: Your location is ${distance.toFixed(2)} km away from campus. You must be within 1 km to check in.`;
      console.log(`Attendance rejected for ${indexNumber}: Too far from campus (${distance.toFixed(2)} km)`);
      return res.status(403).json({
        success: false,
        error: errorMsg,
        message: errorMsg
      });
    }
    
    // Find student by index number
    const studentQuery = db.isPostgres
      ? 'SELECT id FROM students WHERE index_number = $1'
      : 'SELECT id FROM students WHERE index_number = ?';
    
    const students = await db.query(studentQuery, [indexNumber]);
    
    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Record attendance
    const insertQuery = db.isPostgres
      ? 'INSERT INTO attendance (student_id, location_lat, location_lng) VALUES ($1, $2, $3)'
      : 'INSERT INTO attendance (student_id, location_lat, location_lng) VALUES (?, ?, ?)';
    
    await db.query(insertQuery, [students[0].id, locationLat, locationLng]);

    // Update student attendance stats
    const updateQuery = db.isPostgres
      ? `UPDATE students SET 
          attended_sessions = attended_sessions + 1,
          attendance_rate = (attended_sessions + 1) / (CASE WHEN total_sessions = 0 THEN 1 ELSE total_sessions END) * 100,
          last_attendance = NOW()
         WHERE id = $1`
      : `UPDATE students SET 
          attended_sessions = attended_sessions + 1,
          attendance_rate = (attended_sessions + 1) / (CASE WHEN total_sessions = 0 THEN 1 ELSE total_sessions END) * 100,
          last_attendance = NOW()
         WHERE id = ?`;
    
    await db.query(updateQuery, [students[0].id]);
    
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
    const attendanceQuery = db.isPostgres
      ? `SELECT s.name, s.course, s.index_number, a.check_in_time, a.location_lat, a.location_lng
         FROM attendance a
         JOIN students s ON a.student_id = s.id
         ORDER BY a.check_in_time DESC`
      : `SELECT s.name, s.course, s.index_number, a.check_in_time, a.location_lat, a.location_lng
         FROM attendance a
         JOIN students s ON a.student_id = s.id
         ORDER BY a.check_in_time DESC`;
    
    const rows = await db.query(attendanceQuery);
    
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
    
    // Check ID type and convert - user ID may be different from student ID
    // If it's a user ID, first query the corresponding student ID
    if (req.user.role === 'student' && req.user.id.toString() === paramId) {
      // If it's the current logged-in user querying their own information, use the user ID from token
      const userQuery = db.isPostgres
        ? 'SELECT student_id FROM users WHERE id = $1'
        : 'SELECT student_id FROM users WHERE id = ?';
      
      const userRows = await db.query(userQuery, [paramId]);
      
      if (userRows.length > 0) {
        studentId = userRows[0].student_id;
      }
    } else if (req.user.role !== 'admin' && req.user.id !== parseInt(paramId)) {
      // If not admin and not querying own information, deny access
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to access this student data' 
      });
    }
    
    // Get student details
    const studentQuery = db.isPostgres
      ? `SELECT s.*, u.username, u.role, u.id as user_id
         FROM students s
         JOIN users u ON s.id = u.student_id
         WHERE s.id = $1`
      : `SELECT s.*, u.username, u.role, u.id as user_id
         FROM students s
         JOIN users u ON s.id = u.student_id
         WHERE s.id = ?`;
    
    const students = await db.query(studentQuery, [studentId]);
    
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
    
    // Check ID type and convert - user ID may be different from student ID
    // If it's a user ID, first query the corresponding student ID
    if (req.user.role === 'student' && req.user.id.toString() === paramId) {
      // If it's the current logged-in user querying their own information, use the user ID from token
      const userQuery = db.isPostgres
        ? 'SELECT student_id FROM users WHERE id = $1'
        : 'SELECT student_id FROM users WHERE id = ?';
      
      const userRows = await db.query(userQuery, [paramId]);
      
      if (userRows.length > 0) {
        studentId = userRows[0].student_id;
      }
    } else if (req.user.role !== 'admin' && req.user.id !== parseInt(paramId)) {
      // If not admin and not querying own information, deny access
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to access this student attendance records' 
      });
    }
    
    // Get attendance records
    const attendanceQuery = db.isPostgres
      ? `SELECT * FROM attendance 
         WHERE student_id = $1 
         ORDER BY check_in_time DESC 
         LIMIT 10`
      : `SELECT * FROM attendance 
         WHERE student_id = ? 
         ORDER BY check_in_time DESC 
         LIMIT 10`;
    
    const attendance = await db.query(attendanceQuery, [studentId]);
    
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

// Temporary diagnostic endpoint - REMOVE AFTER DEBUGGING
app.get('/api/debug/check-account/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    console.log(`[DEBUG API] Checking account for: ${studentId}`);
    
    // Normalize the student ID
    const normalizedId = studentId.toLowerCase().replace(/\s+/g, '');
    
    // Find student record
    const studentQuery = db.isPostgres
      ? 'SELECT * FROM students WHERE LOWER(index_number) = $1'
      : 'SELECT * FROM students WHERE LOWER(index_number) = ?';
    
    const students = await db.query(studentQuery, [normalizedId]);
    
    if (students.length === 0) {
      // Try fuzzy search
      const fuzzyQuery = db.isPostgres
        ? 'SELECT * FROM students WHERE LOWER(TRIM(index_number)) = $1'
        : 'SELECT * FROM students WHERE LOWER(TRIM(index_number)) = ?';
      
      const fuzzyStudents = await db.query(fuzzyQuery, [normalizedId]);
      
      if (fuzzyStudents.length === 0) {
        return res.json({
          status: 'error',
          message: 'Student not found in database',
          search_term: normalizedId
        });
      }
      
      // Use fuzzy match result
      const student = fuzzyStudents[0];
      const userQuery = db.isPostgres
        ? 'SELECT * FROM users WHERE student_id = $1'
        : 'SELECT * FROM users WHERE student_id = ?';
      
      const users = await db.query(userQuery, [student.id]);
      
      return res.json({
        status: 'success',
        message: 'Student found with fuzzy search',
        student: {
          id: student.id,
          index_number: student.index_number,
          name: student.name,
          email: student.email,
          course: student.course
        },
        account: users.length > 0 ? {
          exists: true,
          id: users[0].id,
          username: users[0].username,
          has_password: !!(users[0].password_hash && users[0].password_hash.length > 0),
          password_length: users[0].password_hash?.length || 0
        } : {
          exists: false
        }
      });
    }
    
    // Student found directly
    const student = students[0];
    const userQuery = db.isPostgres
      ? 'SELECT * FROM users WHERE student_id = $1'
      : 'SELECT * FROM users WHERE student_id = ?';
    
    const users = await db.query(userQuery, [student.id]);
    
    return res.json({
      status: 'success',
      message: 'Student found',
      student: {
        id: student.id,
        index_number: student.index_number,
        name: student.name,
        email: student.email,
        course: student.course
      },
      account: users.length > 0 ? {
        exists: true,
        id: users[0].id,
        username: users[0].username,
        has_password: !!(users[0].password_hash && users[0].password_hash.length > 0),
        password_length: users[0].password_hash?.length || 0
      } : {
        exists: false
      }
    });
  } catch (error) {
    console.error('Debug API error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      error: error.message
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