/**
 * Check Database Schema
 * 
 * This script checks the structure of the users table
 */

const mysql = require('mysql2/promise');
const config = require('../config');

async function checkSchema() {
  let connection;
  try {
    // Connect to the database
    connection = await mysql.createConnection(config.DB_CONFIG);
    console.log(`Connected to database: ${config.DB_CONFIG.database}`);
    
    // Get users table columns
    console.log('\n=== USERS TABLE STRUCTURE ===');
    const [columns] = await connection.execute('SHOW COLUMNS FROM users');
    
    console.log('Columns in users table:');
    columns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });
    
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the check if this script is executed directly
checkSchema().then(() => {
  console.log('Schema check completed');
}); 