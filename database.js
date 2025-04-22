/**
 * Database Connection Module
 * 
 * This module provides a unified interface for database connections,
 * supporting both MySQL and PostgreSQL databases.
 */

const config = require('./config');
const { Pool } = require('pg');
const mysql = require('mysql2/promise');

// Database type detection
const isPostgres = !!config.DB_CONFIG.connectionString;

// Initialize connection pool based on database type
let pool;
let mysqlPool;

if (isPostgres) {
  console.log('Using PostgreSQL connection');
  pool = new Pool({
    ...config.DB_CONFIG,
    max: 10
  });
} else {
  console.log('Using MySQL connection');
  mysqlPool = mysql.createPool({
    ...config.DB_CONFIG,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}

/**
 * Execute a database query with parameters
 * 
 * @param {string} sql - SQL query with placeholders (? for MySQL, $1,$2,... for PostgreSQL)
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Query results
 */
async function query(sql, params = []) {
  if (isPostgres) {
    // PostgreSQL query
    const { rows } = await pool.query(sql, params);
    return rows;
  } else {
    // MySQL query
    const [rows] = await mysqlPool.query(sql, params);
    return rows;
  }
}

/**
 * Get a connection from the pool for transaction support
 * 
 * @returns {Promise<Object>} Database connection
 */
async function getConnection() {
  if (isPostgres) {
    // For PostgreSQL, return a client for transaction operations
    const client = await pool.connect();
    return {
      client,
      query: async (sql, params = []) => {
        const { rows } = await client.query(sql, params);
        return rows;
      },
      beginTransaction: async () => {
        await client.query('BEGIN');
      },
      commit: async () => {
        await client.query('COMMIT');
      },
      rollback: async () => {
        await client.query('ROLLBACK');
      },
      release: () => {
        client.release();
      }
    };
  } else {
    // For MySQL, return the connection with appropriate methods
    const connection = await mysqlPool.getConnection();
    return {
      connection,
      query: async (sql, params = []) => {
        const [rows] = await connection.query(sql, params);
        return rows;
      },
      beginTransaction: async () => {
        await connection.beginTransaction();
      },
      commit: async () => {
        await connection.commit();
      },
      rollback: async () => {
        await connection.rollback();
      },
      release: () => {
        connection.release();
      }
    };
  }
}

/**
 * Convert MySQL-style placeholders (?) to PostgreSQL-style ($1, $2, etc.)
 * 
 * @param {string} sql - MySQL style SQL query
 * @returns {string} PostgreSQL style SQL query
 */
function convertPlaceholders(sql) {
  if (!isPostgres) return sql;
  
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

/**
 * Close database pools on application shutdown
 */
async function closeConnections() {
  if (isPostgres && pool) {
    await pool.end();
  } else if (mysqlPool) {
    await mysqlPool.end();
  }
}

module.exports = {
  query,
  getConnection,
  convertPlaceholders,
  closeConnections,
  isPostgres
}; 