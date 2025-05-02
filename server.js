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
const emailService = require('./src/lib/emailService');

const app = express();

// Chess ranking endpoint (public endpoint, no authentication required)
app.get('/api/chess-rank', async (req, res) => {
  try {
    // Query for students with chess data, joining with users table
    const query = db.isPostgres
      ? `SELECT u.id, u.username, u.email, s.chess_username, s.chess_rapid_rating as chess_rapid, 
                s.chess_bullet_rating as chess_bullet, s.chess_rating as chess_blitz
         FROM students s
         JOIN users u ON s.id = u.student_id
         WHERE s.chess_username IS NOT NULL 
           AND (s.chess_rapid_rating > 0 OR s.chess_rating > 0 OR s.chess_bullet_rating > 0)
         ORDER BY s.chess_rapid_rating DESC, s.chess_rating DESC, s.chess_bullet_rating DESC`
      : `SELECT u.id, u.username, u.email, s.chess_username, s.chess_rapid_rating as chess_rapid, 
                s.chess_bullet_rating as chess_bullet, s.chess_rating as chess_blitz
         FROM students s
         JOIN users u ON s.id = u.student_id
         WHERE s.chess_username IS NOT NULL 
           AND (s.chess_rapid_rating > 0 OR s.chess_rating > 0 OR s.chess_bullet_rating > 0)
         ORDER BY s.chess_rapid_rating DESC, s.chess_rating DESC, s.chess_bullet_rating DESC`;
    
    // Using the db module to query
    const users = await db.query(query);
    
    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('Error fetching chess rankings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chess rankings'
    });
  }
});

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
      
      // Create chess verification codes table - Postgres version
      await connection.query(`
        CREATE TABLE IF NOT EXISTS chess_verification_codes (
          id SERIAL PRIMARY KEY,
          user_id INT NOT NULL,
          chess_username VARCHAR(50) NOT NULL,
          verification_code VARCHAR(20) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          verified BOOLEAN DEFAULT FALSE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      
      // Add Chess.com columns for PostgreSQL - this is what was missing
      try {
        console.log('Checking and adding Chess.com columns in PostgreSQL...');
        
        // Check if chess_username column exists
        const columnCheckResult = await connection.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = 'students' AND column_name = 'chess_username'
        `);
        
        if (columnCheckResult.length === 0) {
          console.log('Adding Chess.com columns to students table in PostgreSQL...');
          // Add Chess.com related columns
          await connection.query(`
            ALTER TABLE students ADD COLUMN IF NOT EXISTS chess_username VARCHAR(50) DEFAULT NULL;
            ALTER TABLE students ADD COLUMN IF NOT EXISTS chess_rating INT DEFAULT NULL;
            ALTER TABLE students ADD COLUMN IF NOT EXISTS chess_rapid_rating INT DEFAULT NULL;
            ALTER TABLE students ADD COLUMN IF NOT EXISTS chess_bullet_rating INT DEFAULT NULL;
            ALTER TABLE students ADD COLUMN IF NOT EXISTS chess_daily_rating INT DEFAULT NULL;
            ALTER TABLE students ADD COLUMN IF NOT EXISTS chess_tactics_rating INT DEFAULT NULL;
            ALTER TABLE students ADD COLUMN IF NOT EXISTS chess_puzzle_rush_rating INT DEFAULT NULL;
          `);
          console.log('Successfully added Chess.com columns in PostgreSQL');
        } else {
          console.log('Chess.com columns already exist in PostgreSQL students table');
        }
      } catch (error) {
        console.error('Error adding Chess.com columns to PostgreSQL:', error);
        // Continue initialization even if this fails
      }
      
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
    
    // Create chess verification codes table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS chess_verification_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        chess_username VARCHAR(50) NOT NULL,
        verification_code VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verified BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Add Chess.com columns for MySQL - check if they exist first
    try {
      console.log('Checking and adding Chess.com columns in MySQL...');
      
      // Check if chess_username column exists
      const columnCheckResult = await connection.query(`
        SHOW COLUMNS FROM students LIKE 'chess_username'
      `);
      
      if (columnCheckResult.length === 0) {
        console.log('Adding Chess.com columns to students table in MySQL...');
        // Add Chess.com related columns
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
        console.log('Successfully added Chess.com columns in MySQL');
      } else {
        console.log('Chess.com columns already exist in MySQL students table');
      }
    } catch (error) {
      console.error('Error adding Chess.com columns to MySQL:', error);
      // Continue initialization even if this fails
    }
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
    const { userId, studentId, password, email, verificationCode } = req.body;
    
    if ((!studentId && !userId) || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID/User ID and password cannot be empty' 
      });
    }
    
    // If email and verification code are provided, verify them
    if (email && verificationCode) {
      const isValidCode = emailService.verifyCode(email, verificationCode);
      
      if (!isValidCode) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired verification code'
      });
      }
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
    
    let studentDbId;
    
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
      studentDbId = fuzzyStudentRows[0].id;
    } else {
      // A direct match was found
      studentDbId = studentRows[0].id;
    }
    
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
    
    // Student exists but has no account, create an account without a password
    const auth = require('./src/lib/auth');
    const createResult = await auth.createUserAccount(normalizedStudentId);
      
    if (createResult.success) {
      return res.json({
        success: true,
        hasAccount: false,
        needsPasswordSetup: true,
        message: 'Verification successful, account has been created. Please go to the login page to set your password'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: createResult.message || 'Student ID verification failed'
      });
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
    const { studentId, password, email, verificationCode } = req.body;
    
    if (!studentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID is required' 
      });
    }
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }
    
    if (!verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'Email verification code is required'
      });
    }
    
    // Verify the email verification code
    const isValidCode = emailService.verifyCode(email, verificationCode);
    
    if (!isValidCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code'
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
      
      // Update student email if it has changed
      if (email) {
        const updateEmailQuery = db.isPostgres
          ? 'UPDATE students SET email = $1 WHERE id = $2'
          : 'UPDATE students SET email = ? WHERE id = ?';
          
        await db.query(updateEmailQuery, [email, students[0].id]);
      }
      
      const userQuery = db.isPostgres
        ? 'SELECT id FROM users WHERE student_id = $1'
        : 'SELECT id FROM users WHERE student_id = ?';
      
      const users = await db.query(userQuery, [students[0].id]);
      
      if (users.length > 0) {
        if (password) {
          // If password is provided, set it (for backward compatibility)
        const setPasswordResult = await setUserPassword(users[0].id, password);
        return res.json(setPasswordResult);
        } else {
          // Return success with needsPasswordSetup flag
          return res.json({
            success: true,
            message: 'Account exists, password setup required',
            needsPasswordSetup: true,
            user: { id: users[0].id }
          });
        }
      }
    }
    
    // If no account exists, create an account with empty password
    if (!verifyResult.hasAccount) {
      // First update student email
      const updateEmailQuery = db.isPostgres
        ? 'UPDATE students SET email = $1 WHERE id = $2'
        : 'UPDATE students SET email = ? WHERE id = ?';
        
      await db.query(updateEmailQuery, [email, verifyResult.student.id]);
      
      // Create the account (with empty password by default)
      const createResult = await createUserAccount(studentId);
      
      if (!createResult.success) {
        return res.status(400).json(createResult);
      }
      
      // Return success - user will set password later during first login
      return res.json({
        success: true,
        message: 'Account created successfully. You can now login to set your password.',
        user: createResult.user,
        needsPasswordSetup: true
      });
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
    
    // 检查位置是否在允许范围内（德马塞克理工学院校园边界内或附近）
    const tpLocation = { 
      lat: 1.34498,
      lng: 103.9317
    };
    
    // 校园边界框
    const tpBoundary = {
      minLat: 1.3425,
      maxLat: 1.3474,
      minLng: 103.9292,
      maxLng: 103.9342
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
    
    // 检查是否在校园边界内或附近
    function isWithinCampusArea(lat, lng) {
      // 首先检查是否直接在边界框内
      const withinBoundary = 
        lat >= tpBoundary.minLat && 
        lat <= tpBoundary.maxLat && 
        lng >= tpBoundary.minLng && 
        lng <= tpBoundary.maxLng;
      
      if (withinBoundary) return true;
      
      // 如果不在边界框内，检查与校园中心的距离
      const distance = calculateDistance(lat, lng, tpLocation.lat, tpLocation.lng);
      return distance <= 1.5; // 距离校园中心1.5公里以内
    }
    
    const userLat = parseFloat(locationLat);
    const userLng = parseFloat(locationLng);
    
    // 检查位置有效性
    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid location coordinates',
        message: 'Invalid location coordinates'
      });
    }
    
    const distance = calculateDistance(userLat, userLng, tpLocation.lat, tpLocation.lng);
    
    // 如果不在校园区域内，拒绝签到
    if (!isWithinCampusArea(userLat, userLng)) {
      const errorMsg = `Check-in failed: Your location (${distance.toFixed(2)} km from campus center) is outside the allowed area. You must be within campus boundaries or within 1.5 km of the campus center to check in.`;
      console.log(`Attendance rejected for ${indexNumber}: Not in campus area (${distance.toFixed(2)} km from center)`);
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
    
    // 获取当前日期并设置为最近的周五
    const now = new Date();
    let fridayDate = new Date(now);
    
    // 如果今天不是周五，调整到最近的周五
    const dayOfWeek = now.getDay();
    if (dayOfWeek !== 5) {
      // 如果今天是周六，使用昨天的日期；如果是其他日，使用上周五
      if (dayOfWeek === 6) {
        fridayDate.setDate(fridayDate.getDate() - 1);
      } else {
        // 计算到上周五的天数
        const daysToSubtract = (dayOfWeek + 2) % 7;
        fridayDate.setDate(fridayDate.getDate() - daysToSubtract);
      }
    }
    
    console.log(`Recording attendance for ${indexNumber} with date adjusted to Friday: ${fridayDate.toISOString()}`);
    
    // Record attendance with Friday date
    let insertQuery;
    if (db.isPostgres) {
      insertQuery = 'INSERT INTO attendance (student_id, location_lat, location_lng, check_in_time) VALUES ($1, $2, $3, $4)';
      await db.query(insertQuery, [students[0].id, locationLat, locationLng, fridayDate]);
    } else {
      insertQuery = 'INSERT INTO attendance (student_id, location_lat, location_lng, check_in_time) VALUES (?, ?, ?, ?)';
      await db.query(insertQuery, [students[0].id, locationLat, locationLng, fridayDate]);
    }

    // Update student attendance stats
    const updateQuery = db.isPostgres
      ? `UPDATE students SET 
        attended_sessions = attended_sessions + 1,
        total_sessions = CASE WHEN total_sessions = 0 THEN 1 ELSE total_sessions END,
        attendance_rate = CASE 
          WHEN total_sessions > 0 THEN (attended_sessions + 1) * 100.0 / GREATEST(total_sessions, 1)
          ELSE 100.0 -- 如果总课程数为0, 设置为第一次出勤，出勤率为100%
        END
         WHERE id = $1`
      : `UPDATE students SET 
          attended_sessions = attended_sessions + 1,
          total_sessions = CASE WHEN total_sessions = 0 THEN 1 ELSE total_sessions END,
          attendance_rate = CASE 
            WHEN total_sessions > 0 THEN (attended_sessions + 1) * 100.0 / GREATEST(total_sessions, 1)
            ELSE 100.0 -- 如果总课程数为0, 设置为第一次出勤，出勤率为100%
          END,
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

// Send verification code to email
app.post('/api/auth/send-verification-code', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email address is required' 
      });
    }
    
    // Validate email format using a simple regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    // Send verification code
    const result = await emailService.sendVerificationCode(email);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification code',
        error: result.error
      });
    }
    
    res.json({
      success: true,
      message: 'Verification code sent successfully'
    });
  } catch (error) {
    console.error('Error sending verification code:', error);
    res.status(500).json({
      success: false,
      message: 'Server error, please try again later'
    });
  }
});

// Verify email verification code
app.post('/api/auth/verify-email-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required'
      });
    }
    
    // Verify the code
    const isValid = emailService.verifyCode(email, code);
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
    }
    
    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Error verifying email code:', error);
    res.status(500).json({
      success: false,
      message: 'Server error, please try again later'
    });
  }
});

// Send password reset verification code
app.post('/api/auth/send-password-reset-code', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email address is required' 
      });
    }
    
    // First check if the email exists in the system
    const studentQuery = db.isPostgres
      ? 'SELECT id FROM students WHERE email = $1'
      : 'SELECT id FROM students WHERE email = ?';
      
    const students = await db.query(studentQuery, [email]);
    
    if (students.length === 0) {
      // For security reasons, we still return success but don't actually send the email
      return res.json({
        success: true,
        message: 'If your email is registered, you will receive a password reset code'
      });
    }
    
    // Send password reset code
    const result = await emailService.sendPasswordResetCode(email);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset code',
        error: result.error
      });
    }
    
    res.json({
      success: true,
      message: 'Password reset code sent successfully'
    });
  } catch (error) {
    console.error('Error sending password reset code:', error);
    res.status(500).json({
      success: false,
      message: 'Server error, please try again later'
    });
  }
});

// Chess.com账号绑定API
// Helper function to fetch Chess.com data
async function fetchChessData(username) {
  try {
    // Get user profile
    const profileResponse = await fetch(`https://api.chess.com/pub/player/${username}`);
    if (!profileResponse.ok) {
      throw new Error('Chess.com user not found');
    }
    
    const profile = await profileResponse.json();
    
    // Get user stats
    const statsResponse = await fetch(`https://api.chess.com/pub/player/${username}/stats`);
    const stats = statsResponse.ok ? await statsResponse.json() : {};
    
    return {
      success: true,
      username,
      location: profile.location || '',
      profile,
      chess_rating: stats.chess_blitz?.last?.rating || 0,
      chess_rapid_rating: stats.chess_rapid?.last?.rating || 0, 
      chess_bullet_rating: stats.chess_bullet?.last?.rating || 0,
      chess_daily_rating: stats.chess_daily?.last?.rating || 0,
      chess_tactics_rating: stats.tactics?.highest?.rating || 0,
      chess_puzzle_rush_rating: stats.puzzle_rush?.best?.score || 0
    };
  } catch (error) {
    console.error(`Error fetching Chess.com data for ${username}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Function to generate random verification code
function generateVerificationCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = 'TPMS-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Step 1: Request verification code
app.post('/api/user/request-chess-verification', authenticate, async (req, res) => {
  try {
    const { chessUsername } = req.body;
    
    if (!chessUsername || typeof chessUsername !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Chess.com username is required'
      });
    }
    
    const userId = req.user.id;
    
    // Validate that the Chess.com user exists
    const chessData = await fetchChessData(chessUsername);
    
    if (!chessData.success) {
      return res.status(400).json({
        success: false,
        message: chessData.error || 'Failed to find Chess.com account'
      });
    }
    
    // Generate verification code
    const verificationCode = generateVerificationCode();
    
    // Save to database
    try {
      // First clear any previous verification codes for this user
      const clearQuery = db.isPostgres
        ? 'DELETE FROM chess_verification_codes WHERE user_id = $1'
        : 'DELETE FROM chess_verification_codes WHERE user_id = ?';
      
      await db.query(clearQuery, [userId]);
      
      // Insert new verification code
      const insertQuery = db.isPostgres
        ? 'INSERT INTO chess_verification_codes (user_id, chess_username, verification_code) VALUES ($1, $2, $3)'
        : 'INSERT INTO chess_verification_codes (user_id, chess_username, verification_code) VALUES (?, ?, ?)';
      
      await db.query(insertQuery, [userId, chessUsername, verificationCode]);
      
      return res.json({
        success: true,
        message: 'Verification code generated',
        verificationCode,
        chessUsername
      });
    } catch (error) {
      console.error('Error saving verification code:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to save verification code'
      });
    }
  } catch (error) {
    console.error('Error requesting Chess.com verification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error, please try again later'
    });
  }
});

// Step 2: Verify and link Chess.com account
app.post('/api/user/verify-chess-account', authenticate, async (req, res) => {
  try {
    const { chessUsername } = req.body;
    const userId = req.user.id;
    
    // Get the pending verification from database
    const verifyQuery = db.isPostgres
      ? 'SELECT * FROM chess_verification_codes WHERE user_id = $1 AND chess_username = $2 AND verified = FALSE ORDER BY created_at DESC LIMIT 1'
      : 'SELECT * FROM chess_verification_codes WHERE user_id = ? AND chess_username = ? AND verified = FALSE ORDER BY created_at DESC LIMIT 1';
    
    const verifications = await db.query(verifyQuery, [userId, chessUsername]);
    
    if (verifications.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No pending verification found. Please request a new verification code.'
      });
    }
    
    const verification = verifications[0];
    const expectedCode = verification.verification_code;
    
    // Fetch current Chess.com profile
    const chessData = await fetchChessData(chessUsername);
    
    if (!chessData.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch Chess.com profile'
      });
    }
    
    // Check if verification code matches the location
    if (chessData.location !== expectedCode) {
      return res.status(400).json({
        success: false,
        message: 'Verification failed. Please ensure you have updated your Chess.com location with the provided code.'
      });
    }
    
    // Mark verification as successful
    const markVerifiedQuery = db.isPostgres
      ? 'UPDATE chess_verification_codes SET verified = TRUE WHERE id = $1'
      : 'UPDATE chess_verification_codes SET verified = TRUE WHERE id = ?';
    
    await db.query(markVerifiedQuery, [verification.id]);
    
    // Update user's Chess.com information
    try {
      // Get student_id from users table
      const userQuery = db.isPostgres
        ? 'SELECT student_id FROM users WHERE id = $1'
        : 'SELECT student_id FROM users WHERE id = ?';
      
      const users = await db.query(userQuery, [userId]);
      
      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      const studentId = users[0].student_id;
      
      // Update Chess.com data in students table
      const updateQuery = db.isPostgres
        ? `UPDATE students SET 
            chess_username = $1,
            chess_rating = $2,
            chess_rapid_rating = $3,
            chess_bullet_rating = $4,
            chess_daily_rating = $5,
            chess_tactics_rating = $6,
            chess_puzzle_rush_rating = $7
          WHERE id = $8`
        : `UPDATE students SET 
            chess_username = ?,
            chess_rating = ?,
            chess_rapid_rating = ?,
            chess_bullet_rating = ?,
            chess_daily_rating = ?,
            chess_tactics_rating = ?,
            chess_puzzle_rush_rating = ?
          WHERE id = ?`;
      
      await db.query(updateQuery, [
        chessUsername,
        chessData.chess_rating,
        chessData.chess_rapid_rating,
        chessData.chess_bullet_rating,
        chessData.chess_daily_rating,
        chessData.chess_tactics_rating,
        chessData.chess_puzzle_rush_rating,
        studentId
      ]);
      
      // Return success with all Chess.com data
      return res.json({
        success: true,
        message: 'Chess.com account verified and linked successfully',
        chess_username: chessUsername,
        chess_rating: chessData.chess_rating,
        chess_rapid_rating: chessData.chess_rapid_rating,
        chess_bullet_rating: chessData.chess_bullet_rating,
        chess_daily_rating: chessData.chess_daily_rating,
        chess_tactics_rating: chessData.chess_tactics_rating,
        chess_puzzle_rush_rating: chessData.chess_puzzle_rush_rating
      });
    } catch (error) {
      console.error('Error updating Chess.com data:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update Chess.com data'
      });
    }
  } catch (error) {
    console.error('Error verifying Chess.com account:', error);
    res.status(500).json({
      success: false,
      message: 'Server error, please try again later'
    });
  }
});

// Legacy endpoint (redirects to the new flow)
app.post('/api/user/link-chess', authenticate, async (req, res) => {
  return res.status(400).json({
    success: false,
    message: 'Please use the new verification flow',
    useNewFlow: true
  });
});

// 获取所有用户的Chess.com评分
app.get('/api/users/chess-ratings', async (req, res) => {
  try {
    // 获取所有有Chess.com绑定的用户
    const usersQuery = db.isPostgres
      ? `SELECT s.id, s.name, s.course, s.chess_username, 
          s.chess_rating, s.chess_rapid_rating, s.chess_bullet_rating, 
          s.chess_daily_rating, s.chess_tactics_rating, s.chess_puzzle_rush_rating
        FROM students s
        WHERE s.chess_username IS NOT NULL
        ORDER BY s.name`
      : `SELECT s.id, s.name, s.course, s.chess_username, 
          s.chess_rating, s.chess_rapid_rating, s.chess_bullet_rating, 
          s.chess_daily_rating, s.chess_tactics_rating, s.chess_puzzle_rush_rating
        FROM students s
        WHERE s.chess_username IS NOT NULL
        ORDER BY s.name`;
    
    const users = await db.query(usersQuery);
    
    return res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error fetching chess ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chess ratings'
    });
  }
});

// Serve static files from the React app
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
} else {
  // In development, serve the public folder
  app.use(express.static(path.join(__dirname, 'public')));
}

// The "catchall" handler: for any request that doesn't
// match an API route, send back the React app's index.html file.
app.get('*', (req, res) => {
  // Skip API routes
  if (req.url.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'API endpoint not found'
    });
  }
  
  // For both production and development, send the index.html file
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Initialize database and start server
initializeDatabase().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Database: ${db.dbName}`);
    console.log('Note: Default password policy has been updated - all users now use their student ID as password');
  });
});