/**
 * TPMS Database and Application Setup Script
 * 
 * This script:
 * 1. Sets up the MySQL database using the setup-db.sql script
 * 2. Migrates data from Excel files into the database
 * 3. Installs necessary npm packages
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const mysql = require('mysql2/promise');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function setupDatabase() {
  console.log('\n========== Setting up TPMS Database ==========\n');
  
  try {
    // Get database credentials
    const dbHost = await promptQuestion('Enter MySQL host [localhost]: ') || 'localhost';
    const dbUser = await promptQuestion('Enter MySQL username [root]: ') || 'root';
    const dbPassword = await promptQuestion('Enter MySQL password: ');
    const dbName = await promptQuestion('Enter database name [tpms_db]: ') || 'tpms_db';
    
    // Update .env file
    const envContent = `PORT=5000
DB_HOST=${dbHost}
DB_USER=${dbUser}
DB_PASSWORD=${dbPassword}
DB_NAME=${dbName}`;
    
    fs.writeFileSync('.env', envContent);
    console.log('Updated .env file with database credentials');
    
    // Create database connection to run SQL script
    let connection;
    try {
      // Connect to MySQL (without database)
      connection = await mysql.createConnection({
        host: dbHost,
        user: dbUser,
        password: dbPassword,
        multipleStatements: true
      });
      
      console.log('Connected to MySQL server');
      
      // Read SQL script
      const sqlScript = fs.readFileSync('setup-db.sql', 'utf8');
      
      // Execute SQL script
      console.log('Creating database and tables...');
      await connection.query(sqlScript);
      console.log('Database and tables created successfully');
      
    } catch (error) {
      console.error('Error setting up database:', error.message);
      process.exit(1);
    } finally {
      if (connection) {
        await connection.end();
      }
    }
    
    // Ask to migrate Excel data
    const migrateData = await promptQuestion('Would you like to migrate Excel data now? (y/n): ');
    if (migrateData.toLowerCase() === 'y') {
      console.log('Running migration script...');
      execSync('node migrate-excel.js', { stdio: 'inherit' });
    }
    
    // Ask to install npm dependencies
    const installDeps = await promptQuestion('Would you like to install npm dependencies? (y/n): ');
    if (installDeps.toLowerCase() === 'y') {
      console.log('Installing dependencies...');
      execSync('npm install', { stdio: 'inherit' });
    }
    
    console.log('\n========== Setup Complete ==========\n');
    console.log('You can now start the server with:');
    console.log('npm run server');
    console.log('\nAnd run the client with:');
    console.log('npm run client');
    console.log('\nOr run both together with:');
    console.log('npm run dev');
    
  } catch (error) {
    console.error('Setup failed:', error);
  } finally {
    rl.close();
  }
}

function promptQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Run setup
setupDatabase(); 