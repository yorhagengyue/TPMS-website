/**
 * Authentication Utilities
 * 
 * This module provides JWT authentication functions for the TPMS application
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../../database');
const config = require('../../config');

// JWT Secret - should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'tpms-secret-key-change-in-production';
const JWT_EXPIRES_IN = '1d'; // Token expires in 1 day

/**
 * Generate a JWT token for a user
 * @param {Object} user User object from database
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    index_number: user.index_number,
    jti: Date.now().toString(), // Unique token ID for potential revocation
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verify a JWT token
 * @param {String} token JWT token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
const verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if token has been revoked
    const connection = await db.getConnection();
    
    // Use query parameters according to the database type
    const sql = db.isPostgres 
      ? 'SELECT id FROM revoked_tokens WHERE token_id = $1'
      : 'SELECT id FROM revoked_tokens WHERE token_id = ?';
    
    const revoked = await connection.query(sql, [decoded.jti]);
    
    connection.release();
    
    if (revoked.length > 0) {
      return null; // Token has been revoked
    }
    
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Verify if a student ID exists in the database
 * @param {String} studentId Student ID (index_number)
 * @returns {Object} Verification result with student info if found
 */
const verifyStudentId = async (studentId) => {
  let connection;
  
  try {
    connection = await db.getConnection();
    
    // Find student by index_number
    const studentSql = db.isPostgres
      ? 'SELECT * FROM students WHERE LOWER(index_number) = $1'
      : 'SELECT * FROM students WHERE LOWER(index_number) = ?';
    
    const students = await connection.query(studentSql, [studentId.toLowerCase()]);
    
    if (students.length === 0) {
      // Try with less strict matching
      const fuzzyStudentSql = db.isPostgres
        ? 'SELECT * FROM students WHERE LOWER(TRIM(index_number)) = $1'
        : 'SELECT * FROM students WHERE LOWER(TRIM(index_number)) = ?';
      
      const fuzzyStudents = await connection.query(fuzzyStudentSql, [studentId.toLowerCase()]);
      
      if (fuzzyStudents.length === 0) {
        return { success: false, message: 'Student ID not found' };
      }
      
      // Use the fuzzy match result
      const student = fuzzyStudents[0];
      
      // Check if student already has a user account
      const userSql = db.isPostgres
        ? 'SELECT id, password_hash FROM users WHERE student_id = $1'
        : 'SELECT id, password_hash FROM users WHERE student_id = ?';
      
      const users = await connection.query(userSql, [student.id]);
      
      if (users.length > 0) {
        // If account exists, check if password is set
        const hasPassword = users[0].password_hash && users[0].password_hash.length > 0;
        
        return { 
          success: true, 
          hasAccount: true, 
          needsPasswordSetup: !hasPassword,
          student: {
            id: student.id,
            name: student.name,
            index_number: student.index_number,
            email: student.email,
            course: student.course
          }
        };
      }
      
      // Return student info
      return {
        success: true,
        hasAccount: false,
        student: {
          id: student.id,
          name: student.name,
          index_number: student.index_number,
          email: student.email,
          course: student.course
        }
      };
    }
    
    const student = students[0];
    
    // Check if student already has a user account
    const checkUserSql = db.isPostgres
      ? 'SELECT id FROM users WHERE student_id = $1'
      : 'SELECT id FROM users WHERE student_id = ?';
    
    const existingUsers = await connection.query(checkUserSql, [student.id]);
    
    if (existingUsers.length > 0) {
      // If account exists, check if password is set
      const hasPassword = existingUsers[0].password_hash && existingUsers[0].password_hash.length > 0;
      
      return { 
        success: true, 
        hasAccount: true, 
        needsPasswordSetup: !hasPassword,
        student: {
          id: student.id,
          name: student.name,
          index_number: student.index_number,
          email: student.email,
          course: student.course
        }
      };
    }
    
    // Return student info
    return {
      success: true,
      hasAccount: false,
      student: {
        id: student.id,
        name: student.name,
        index_number: student.index_number,
        email: student.email,
        course: student.course
      }
    };
  } catch (error) {
    return { success: false, message: error.message };
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/**
 * Create a new user account without password
 * @param {String} studentId Student ID (index_number)
 * @returns {Object} Creation result
 */
const createUserAccount = async (studentId) => {
  let connection;
  
  try {
    connection = await db.getConnection();
    
    // Find student by index_number
    const studentSql = db.isPostgres
      ? 'SELECT * FROM students WHERE LOWER(index_number) = $1'
      : 'SELECT * FROM students WHERE LOWER(index_number) = ?';
    
    const students = await connection.query(studentSql, [studentId.toLowerCase()]);
    
    if (students.length === 0) {
      // Try with less strict matching
      const fuzzyStudentSql = db.isPostgres
        ? 'SELECT * FROM students WHERE LOWER(TRIM(index_number)) = $1'
        : 'SELECT * FROM students WHERE LOWER(TRIM(index_number)) = ?';
      
      const fuzzyStudents = await connection.query(fuzzyStudentSql, [studentId.toLowerCase()]);
      
      if (fuzzyStudents.length === 0) {
        return { success: false, message: 'Student ID not found' };
      }
      
      // Use the fuzzy match result
      const student = fuzzyStudents[0];
      
      // Check if student already has a user account
      const checkUserSql = db.isPostgres
        ? 'SELECT id FROM users WHERE student_id = $1'
        : 'SELECT id FROM users WHERE student_id = ?';
      
      const existingUsers = await connection.query(checkUserSql, [student.id]);
      
      if (existingUsers.length > 0) {
        return { success: false, message: 'Student already has an account' };
      }
      
      // Create user account with empty password (will be set during first login)
      let newUserId;
      
      if (db.isPostgres) {
        // PostgreSQL insert returns the inserted id
        const insertSql = 'INSERT INTO users (username, password_hash, student_id, role) VALUES ($1, $2, $3, $4) RETURNING id';
        const result = await connection.query(insertSql, [studentId.toLowerCase(), '', student.id, 'student']);
        newUserId = result[0].id;
      } else {
        // MySQL insert
        const insertSql = 'INSERT INTO users (username, password_hash, student_id, role) VALUES (?, ?, ?, ?)';
        const result = await connection.query(insertSql, [studentId.toLowerCase(), '', student.id, 'student']);
        newUserId = result.insertId;
      }
      
      // Get new user details
      const getUserSql = db.isPostgres
        ? `SELECT u.*, s.name, s.course, s.email, s.index_number 
           FROM users u 
           JOIN students s ON u.student_id = s.id 
           WHERE u.id = $1`
        : `SELECT u.*, s.name, s.course, s.email, s.index_number 
           FROM users u 
           JOIN students s ON u.student_id = s.id 
           WHERE u.id = ?`;
      
      const users = await connection.query(getUserSql, [newUserId]);
      
      if (users.length === 0) {
        return { success: false, message: 'User created but failed to retrieve details' };
      }
      
      const user = users[0];
      
      // Return user info without token (since password not set yet)
      const userInfo = {
        id: user.id,
        username: user.username,
        name: user.name,
        index_number: user.index_number,
        email: user.email,
        role: user.role,
        course: user.course,
        needsPasswordSetup: true
      };
      
      return {
        success: true,
        user: userInfo
      };
    }
    
    const student = students[0];
    
    // Check if student already has a user account
    const checkUserSql = db.isPostgres
      ? 'SELECT id FROM users WHERE student_id = $1'
      : 'SELECT id FROM users WHERE student_id = ?';
    
    const existingUsers = await connection.query(checkUserSql, [student.id]);
    
    if (existingUsers.length > 0) {
      return { success: false, message: 'Student already has an account' };
    }
    
    // Create user account with empty password (will be set during first login)
    let newUserId;
    
    if (db.isPostgres) {
      // PostgreSQL insert returns the inserted id
      const insertSql = 'INSERT INTO users (username, password_hash, student_id, role) VALUES ($1, $2, $3, $4) RETURNING id';
      const result = await connection.query(insertSql, [studentId.toLowerCase(), '', student.id, 'student']);
      newUserId = result[0].id;
    } else {
      // MySQL insert
      const insertSql = 'INSERT INTO users (username, password_hash, student_id, role) VALUES (?, ?, ?, ?)';
      const result = await connection.query(insertSql, [studentId.toLowerCase(), '', student.id, 'student']);
      newUserId = result.insertId;
    }
    
    if (!newUserId) {
      return { success: false, message: 'Failed to create user account' };
    }
    
    // Get new user details
    const getUserSql = db.isPostgres
      ? `SELECT u.*, s.name, s.course, s.email, s.index_number 
         FROM users u 
         JOIN students s ON u.student_id = s.id 
         WHERE u.id = $1`
      : `SELECT u.*, s.name, s.course, s.email, s.index_number 
         FROM users u 
         JOIN students s ON u.student_id = s.id 
         WHERE u.id = ?`;
    
    const users = await connection.query(getUserSql, [newUserId]);
    
    if (users.length === 0) {
      return { success: false, message: 'User created but failed to retrieve details' };
    }
    
    const user = users[0];
    
    // Return user info without token (since password not set yet)
    const userInfo = {
      id: user.id,
      username: user.username,
      name: user.name,
      index_number: user.index_number,
      email: user.email,
      role: user.role,
      course: user.course,
      needsPasswordSetup: true
    };
    
    return {
      success: true,
      user: userInfo
    };
  } catch (error) {
    return { success: false, message: error.message };
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/**
 * Set or update user password
 * @param {Number} userId User ID
 * @param {String} password New password
 * @returns {Object} Result with token and user info
 */
const setUserPassword = async (userId, password) => {
  let connection;
  
  try {
    connection = await db.getConnection();
    
    // Validate user exists
    const getUserSql = db.isPostgres
      ? `SELECT u.*, s.name, s.course, s.email, s.index_number 
         FROM users u 
         JOIN students s ON u.student_id = s.id 
         WHERE u.id = $1`
      : `SELECT u.*, s.name, s.course, s.email, s.index_number 
         FROM users u 
         JOIN students s ON u.student_id = s.id 
         WHERE u.id = ?`;
    
    const users = await connection.query(getUserSql, [userId]);
    
    if (users.length === 0) {
      return { success: false, message: 'User not found' };
    }
    
    const user = users[0];
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Update password
    const updateSql = db.isPostgres
      ? 'UPDATE users SET password_hash = $1 WHERE id = $2'
      : 'UPDATE users SET password_hash = ? WHERE id = ?';
    
    await connection.query(updateSql, [passwordHash, userId]);
    
    // Generate token
    const token = generateToken(user);
    
    // Return user info
    const userInfo = {
      id: user.id,
      username: user.username,
      name: user.name,
      index_number: user.index_number,
      email: user.email,
      role: user.role,
      course: user.course,
      needsPasswordSetup: false
    };
    
    return {
      success: true,
      token,
      user: userInfo
    };
  } catch (error) {
    return { success: false, message: error.message };
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/**
 * Authenticate a user with username and password
 * @param {String} username Username (student index number)
 * @param {String} password Password
 * @returns {Object} Authentication result with token and user info
 */
const authenticateUser = async (username, password) => {
  let connection;
  
  try {
    connection = await db.getConnection();
    
    // Find user by username
    const getUserSql = db.isPostgres
      ? `SELECT u.*, s.name, s.course, s.email, s.index_number 
         FROM users u 
         JOIN students s ON u.student_id = s.id 
         WHERE LOWER(u.username) = $1`
      : `SELECT u.*, s.name, s.course, s.email, s.index_number 
         FROM users u 
         JOIN students s ON u.student_id = s.id 
         WHERE LOWER(u.username) = ?`;
    
    const users = await connection.query(getUserSql, [username.toLowerCase()]);
    
    if (users.length === 0) {
      // Check if student exists but no account yet
      const studentSql = db.isPostgres
        ? 'SELECT * FROM students WHERE LOWER(index_number) = $1'
        : 'SELECT * FROM students WHERE LOWER(index_number) = ?';
      
      const students = await connection.query(studentSql, [username.toLowerCase()]);
      
      if (students.length === 0) {
        // Try with fuzzy matching
        const fuzzyStudentSql = db.isPostgres
          ? 'SELECT * FROM students WHERE LOWER(TRIM(index_number)) = $1'
          : 'SELECT * FROM students WHERE LOWER(TRIM(index_number)) = ?';
        
        const fuzzyStudents = await connection.query(fuzzyStudentSql, [username.toLowerCase()]);
        
        if (fuzzyStudents.length > 0) {
          // Student found with fuzzy match, create account
          const createResult = await createUserAccount(username);
          if (createResult.success) {
            return { 
              success: true, 
              needsPasswordSetup: true,
              user: createResult.user,
              message: 'Account created. Please set your password.'
            };
          } else {
            return { success: false, message: createResult.message };
          }
        } else {
          return { success: false, message: 'User not found' };
        }
      }
      
      if (students.length > 0) {
        // Student exists but no account - create account and require password setup
        const createResult = await createUserAccount(username);
        if (createResult.success) {
          return { 
            success: true, 
            needsPasswordSetup: true,
            user: createResult.user,
            message: 'Account created. Please set your password.'
          };
        } else {
          return { success: false, message: createResult.message };
        }
      } else {
        return { success: false, message: 'User not found' };
      }
    }
    
    const user = users[0];
    
    // Check if password is set
    if (!user.password_hash || user.password_hash === '') {
      return { 
        success: true, 
        needsPasswordSetup: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          index_number: user.index_number,
          email: user.email,
          role: user.role,
          course: user.course
        },
        message: 'Please set your password to continue.'
      };
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isValid) {
      return { success: false, message: 'Invalid password' };
    }
    
    // Generate token
    const token = generateToken(user);
    
    // Return user info (without password)
    const userInfo = {
      id: user.id,
      username: user.username,
      name: user.name,
      index_number: user.index_number,
      email: user.email,
      role: user.role,
      course: user.course
    };
    
    return {
      success: true,
      token,
      user: userInfo
    };
  } catch (error) {
    return { success: false, message: error.message };
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/**
 * Revoke a JWT token
 * @param {String} token JWT token to revoke
 * @returns {Boolean} Success indicator
 */
const revokeToken = async (token) => {
  let connection;
  
  try {
    const decoded = jwt.decode(token);
    
    if (!decoded || !decoded.jti || !decoded.exp) {
      return false;
    }
    
    connection = await db.getConnection();
    
    // Add token to blacklist
    const insertSql = db.isPostgres
      ? 'INSERT INTO revoked_tokens (token_id, expiry) VALUES ($1, to_timestamp($2))'
      : 'INSERT INTO revoked_tokens (token_id, expiry) VALUES (?, FROM_UNIXTIME(?))';
    
    await connection.query(insertSql, [decoded.jti, decoded.exp]);
    
    return true;
  } catch (error) {
    return false;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/**
 * Check if user has required role
 * @param {Object} user User object from token
 * @param {String|Array} requiredRoles Required role(s)
 * @returns {Boolean} True if user has required role
 */
const hasRole = (user, requiredRoles) => {
  if (!user || !user.role) {
    return false;
  }
  
  if (Array.isArray(requiredRoles)) {
    return requiredRoles.includes(user.role);
  }
  
  return user.role === requiredRoles;
};

module.exports = {
  generateToken,
  verifyToken,
  authenticateUser,
  verifyStudentId,
  createUserAccount,
  setUserPassword,
  revokeToken,
  hasRole
}; 