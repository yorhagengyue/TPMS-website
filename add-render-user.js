/**
 * Add User to Render PostgreSQL Database
 * 
 * This script adds a new user (Richie Goh, 2501766F) to the remote PostgreSQL database on Render.
 */

const db = require('./database');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// User information
const userInfo = {
  id: '2501766F',  // Student ID
  name: 'Richie Goh',  // Student Name
  password: 'Password123',  // Initial password
  email: '2501766F@student.tp.edu.sg'  // Email address
};

// Create the user
async function createUser() {
  try {
    console.log('=== Add User to Render PostgreSQL Database ===');
    console.log(`Adding user: ${userInfo.id} (${userInfo.name})`);
    console.log(`Using database type: ${db.isPostgres ? 'PostgreSQL' : 'MySQL'}`);

    if (!db.isPostgres) {
      console.warn('WARNING: Not connected to PostgreSQL. This script is intended for the Render deployment.');
      console.warn('Set DATABASE_URL environment variable to connect to PostgreSQL on Render.');
      console.warn('Example: DATABASE_URL=postgresql://username:password@host:port/database');
      
      // Uncomment to force exit if not using PostgreSQL
      // return;
    }
    
    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(userInfo.password, saltRounds);
    console.log('Password hash generated');

    // 1. Check if student already exists
    console.log(`Checking if student with ID ${userInfo.id} exists...`);
    
    const findStudentQuery = db.isPostgres
      ? 'SELECT id FROM students WHERE index_number = $1'
      : 'SELECT id FROM students WHERE index_number = ?';
    
    const existingStudents = await db.query(findStudentQuery, [userInfo.id]);
    
    let studentId;
    
    if (existingStudents.length > 0) {
      // Student exists
      studentId = existingStudents[0].id;
      console.log(`Student already exists with ID: ${studentId}`);
      
      // Update student info
      const updateStudentQuery = db.isPostgres
        ? 'UPDATE students SET name = $1, email = $2 WHERE id = $3'
        : 'UPDATE students SET name = ?, email = ? WHERE id = ?';
      
      await db.query(updateStudentQuery, [userInfo.name, userInfo.email, studentId]);
      console.log('Updated student information');
    } else {
      // Create new student record
      console.log('Creating new student record...');
      
      const insertStudentQuery = db.isPostgres
        ? 'INSERT INTO students (name, index_number, email) VALUES ($1, $2, $3) RETURNING id'
        : 'INSERT INTO students (name, index_number, email) VALUES (?, ?, ?)';
      
      const result = await db.query(insertStudentQuery, [userInfo.name, userInfo.id, userInfo.email]);
      
      if (db.isPostgres) {
        studentId = result[0].id;
      } else {
        studentId = result.insertId;
      }
      
      console.log(`Created new student with ID: ${studentId}`);
    }
    
    // 2. Check if user account exists
    console.log('Checking if user account exists...');
    
    const findUserQuery = db.isPostgres
      ? 'SELECT id FROM users WHERE username = $1'
      : 'SELECT id FROM users WHERE username = ?';
    
    const existingUsers = await db.query(findUserQuery, [userInfo.id]);
    
    if (existingUsers.length > 0) {
      // Update existing user
      const userId = existingUsers[0].id;
      
      const updateUserQuery = db.isPostgres
        ? 'UPDATE users SET password_hash = $1, email = $2 WHERE id = $3'
        : 'UPDATE users SET password_hash = ?, email = ? WHERE id = ?';
      
      await db.query(updateUserQuery, [passwordHash, userInfo.email, userId]);
      console.log(`Updated existing user account with ID: ${userId}`);
    } else {
      // Create new user account
      console.log('Creating new user account...');
      
      const insertUserQuery = db.isPostgres
        ? 'INSERT INTO users (username, password_hash, student_id, email, role) VALUES ($1, $2, $3, $4, $5) RETURNING id'
        : 'INSERT INTO users (username, password_hash, student_id, email, role) VALUES (?, ?, ?, ?, ?)';
      
      const result = await db.query(insertUserQuery, [userInfo.id, passwordHash, studentId, userInfo.email, 'student']);
      
      const userId = db.isPostgres ? result[0].id : result.insertId;
      console.log(`Created new user account with ID: ${userId}`);
    }
    
    console.log('\n✅ Success! User account created/updated:');
    console.log(`Username: ${userInfo.id}`);
    console.log(`Password: ${userInfo.password}`);
    console.log('The user can now log in with these credentials.');
    
  } catch (error) {
    console.error('\n❌ Error creating user:', error.message);
    
    if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
      console.error('Duplicate key error - user or student ID already exists');
    } else if (error.code === 'ER_NO_SUCH_TABLE' || error.code === '42P01') {
      console.error('Table does not exist - database schema may not be set up correctly');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Could not connect to database server. Check connection settings.');
    }
  } finally {
    // Close database connection
    await db.closeConnections();
    console.log('Database connection closed');
  }
}

// Run the script
createUser().catch(console.error); 