// Script to update database schema - add chess columns
const db = require('./database');

async function updateDatabase() {
  try {
    console.log('Starting database update...');
    
    // Add chess_username column if it doesn't exist
    try {
      console.log('Adding chess_username column...');
      await db.query(`
        ALTER TABLE users ADD COLUMN chess_username VARCHAR(50) DEFAULT NULL
      `);
      console.log('Added chess_username column');
    } catch (err) {
      if (err.message.includes('Duplicate column') || err.message.includes('already exists')) {
        console.log('chess_username column already exists');
      } else {
        console.error('Error adding chess_username column:', err.message);
      }
    }
    
    // Add chess_rating column if it doesn't exist
    try {
      console.log('Adding chess_rating column...');
      await db.query(`
        ALTER TABLE users ADD COLUMN chess_rating INT DEFAULT NULL
      `);
      console.log('Added chess_rating column');
    } catch (err) {
      if (err.message.includes('Duplicate column') || err.message.includes('already exists')) {
        console.log('chess_rating column already exists');
      } else {
        console.error('Error adding chess_rating column:', err.message);
      }
    }
    
    console.log('Database update completed!');
  } catch (error) {
    console.error('Database update failed:', error);
  }
}

// Run the update
updateDatabase(); 