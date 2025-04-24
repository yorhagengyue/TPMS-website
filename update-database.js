// Script to update database schema - add chess columns
const { Pool } = require('pg');
const mysql = require('mysql2/promise');
const config = require('./config');
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
      if (err.message.includes('already exists')) {
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
      if (err.message.includes('already exists')) {
        console.log('chess_rating column already exists');
      } else {
        console.error('Error adding chess_rating column:', err.message);
      }
    }
    
    // Add chess_rapid_rating column if it doesn't exist
    try {
      console.log('Adding chess_rapid_rating column...');
      await db.query(`
        ALTER TABLE users ADD COLUMN chess_rapid_rating INT DEFAULT NULL
      `);
      console.log('Added chess_rapid_rating column');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('chess_rapid_rating column already exists');
      } else {
        console.error('Error adding chess_rapid_rating column:', err.message);
      }
    }
    
    // Add chess_bullet_rating column if it doesn't exist
    try {
      console.log('Adding chess_bullet_rating column...');
      await db.query(`
        ALTER TABLE users ADD COLUMN chess_bullet_rating INT DEFAULT NULL
      `);
      console.log('Added chess_bullet_rating column');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('chess_bullet_rating column already exists');
      } else {
        console.error('Error adding chess_bullet_rating column:', err.message);
      }
    }
    
    // Add chess_daily_rating column if it doesn't exist
    try {
      console.log('Adding chess_daily_rating column...');
      await db.query(`
        ALTER TABLE users ADD COLUMN chess_daily_rating INT DEFAULT NULL
      `);
      console.log('Added chess_daily_rating column');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('chess_daily_rating column already exists');
      } else {
        console.error('Error adding chess_daily_rating column:', err.message);
      }
    }
    
    // Add chess_tactics_rating column if it doesn't exist
    try {
      console.log('Adding chess_tactics_rating column...');
      await db.query(`
        ALTER TABLE users ADD COLUMN chess_tactics_rating INT DEFAULT NULL
      `);
      console.log('Added chess_tactics_rating column');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('chess_tactics_rating column already exists');
      } else {
        console.error('Error adding chess_tactics_rating column:', err.message);
      }
    }
    
    // Add chess_puzzle_rush_rating column if it doesn't exist
    try {
      console.log('Adding chess_puzzle_rush_rating column...');
      await db.query(`
        ALTER TABLE users ADD COLUMN chess_puzzle_rush_rating INT DEFAULT NULL
      `);
      console.log('Added chess_puzzle_rush_rating column');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('chess_puzzle_rush_rating column already exists');
      } else {
        console.error('Error adding chess_puzzle_rush_rating column:', err.message);
      }
    }
    
    console.log('Database update completed successfully.');
  } catch (err) {
    console.error('Error updating database:', err);
  }
}

// Call the function to update the database
updateDatabase(); 