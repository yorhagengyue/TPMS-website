/**
 * Account Checking Tool
 * 
 * This script checks a specific student account status in the database
 */

const db = require('../database');

async function checkStudentAccount(studentId) {
  let connection;
  
  try {
    connection = await db.getConnection();
    
    console.log(`Checking student account for ID: ${studentId}`);
    
    // First find student record
    const studentSql = db.isPostgres
      ? 'SELECT * FROM students WHERE LOWER(index_number) = $1'
      : 'SELECT * FROM students WHERE LOWER(index_number) = ?';
    
    const students = await connection.query(studentSql, [studentId.toLowerCase()]);
    
    if (students.length === 0) {
      console.log('❌ STUDENT NOT FOUND IN DATABASE');
      return;
    }
    
    const student = students[0];
    console.log('✅ STUDENT FOUND:');
    console.log({
      id: student.id,
      name: student.name,
      index_number: student.index_number,
      course: student.course,
      email: student.email
    });
    
    // Check user account
    const userSql = db.isPostgres
      ? 'SELECT * FROM users WHERE student_id = $1'
      : 'SELECT * FROM users WHERE student_id = ?';
    
    const users = await connection.query(userSql, [student.id]);
    
    if (users.length === 0) {
      console.log('❌ NO USER ACCOUNT EXISTS');
      return;
    }
    
    const user = users[0];
    console.log('✅ USER ACCOUNT FOUND:');
    console.log({
      id: user.id,
      username: user.username,
      role: user.role,
      has_password: !!user.password_hash && user.password_hash.length > 0,
      password_hash_length: user.password_hash ? user.password_hash.length : 0
    });
    
    // Password status
    if (!user.password_hash || user.password_hash.length === 0) {
      console.log('❌ PASSWORD NOT SET - User needs to set a password');
    } else {
      console.log('✅ PASSWORD IS SET - User can login with password');
    }
  } catch (error) {
    console.error('ERROR checking account:', error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Check the specified student ID
const studentIdToCheck = process.argv[2] || '2403880d';
checkStudentAccount(studentIdToCheck).then(() => {
  console.log('Check completed');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
}); 