/**
 * Authentication Utilities
 * 
 * This module provides JWT authentication functions for the TPMS application
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
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
    const connection = await mysql.createConnection(config.DB_CONFIG);
    const [revoked] = await connection.query(
      'SELECT id FROM revoked_tokens WHERE token_id = ?',
      [decoded.jti]
    );
    await connection.end();
    
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
    connection = await mysql.createConnection(config.DB_CONFIG);
    
    // Find student by index_number
    const [students] = await connection.query(
      'SELECT * FROM students WHERE index_number = ?',
      [studentId.toLowerCase()]
    );
    
    if (students.length === 0) {
      return { success: false, message: 'Student ID not found' };
    }
    
    const student = students[0];
    
    // Check if student already has a user account
    const [users] = await connection.query(
      'SELECT id FROM users WHERE student_id = ?',
      [student.id]
    );
    
    if (users.length > 0) {
      return { success: false, message: 'Student already has an account' };
    }
    
    // Return student info
    return {
      success: true,
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
      await connection.end();
    }
  }
};

/**
 * Create a new user account
 * @param {String} studentId Student ID (index_number)
 * @param {String} password Password
 * @returns {Object} Registration result with token and user info
 */
const registerUser = async (studentId, password) => {
  let connection;
  
  try {
    connection = await mysql.createConnection(config.DB_CONFIG);
    
    // Find student by index_number
    const [students] = await connection.query(
      'SELECT * FROM students WHERE index_number = ?',
      [studentId.toLowerCase()]
    );
    
    if (students.length === 0) {
      return { success: false, message: 'Student ID not found' };
    }
    
    const student = students[0];
    
    // Check if student already has a user account
    const [existingUsers] = await connection.query(
      'SELECT id FROM users WHERE student_id = ?',
      [student.id]
    );
    
    if (existingUsers.length > 0) {
      return { success: false, message: 'Student already has an account' };
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user - use username = index_number, and add student_id as reference to students table
    const [result] = await connection.query(
      'INSERT INTO users (username, password_hash, student_id, role) VALUES (?, ?, ?, ?)',
      [studentId.toLowerCase(), passwordHash, student.id, 'student']
    );
    
    if (!result.insertId) {
      return { success: false, message: 'Failed to create user account' };
    }
    
    // Get new user details
    const [users] = await connection.query(
      `SELECT u.*, s.name, s.course, s.email, s.index_number 
       FROM users u 
       JOIN students s ON u.student_id = s.id 
       WHERE u.id = ?`,
      [result.insertId]
    );
    
    if (users.length === 0) {
      return { success: false, message: 'User created but failed to retrieve details' };
    }
    
    const user = users[0];
    
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
      await connection.end();
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
    connection = await mysql.createConnection(config.DB_CONFIG);
    
    // Find user by username
    const [users] = await connection.query(
      `SELECT u.*, s.name, s.course, s.email, s.index_number 
       FROM users u 
       JOIN students s ON u.student_id = s.id 
       WHERE u.username = ?`,
      [username.toLowerCase()]
    );
    
    if (users.length === 0) {
      return { success: false, message: 'User not found' };
    }
    
    const user = users[0];
    
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
      await connection.end();
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
    
    connection = await mysql.createConnection(config.DB_CONFIG);
    
    // Add token to blacklist
    await connection.query(
      'INSERT INTO revoked_tokens (token_id, expiry) VALUES (?, FROM_UNIXTIME(?))',
      [decoded.jti, decoded.exp]
    );
    
    return true;
  } catch (error) {
    return false;
  } finally {
    if (connection) {
      await connection.end();
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
  revokeToken,
  hasRole,
  verifyStudentId,
  registerUser
}; 