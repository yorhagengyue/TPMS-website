/**
 * Environment Configuration Loader
 * 
 * This module loads the appropriate environment configuration
 * based on the NODE_ENV variable
 */

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Determine which .env file to use
function loadEnv() {
  const NODE_ENV = process.env.NODE_ENV || 'development';
  
  // Default config path
  let envPath = path.resolve(process.cwd(), '.env');
  
  // Environment specific config path
  if (NODE_ENV !== 'production') {
    const envSpecificPath = path.resolve(process.cwd(), `.env.${NODE_ENV}`);
    if (fs.existsSync(envSpecificPath)) {
      envPath = envSpecificPath;
      console.log(`Loading environment config from: ${envPath}`);
    } else {
      console.log(`Environment config file ${envSpecificPath} not found, using default .env`);
    }
  }
  
  // Load configuration
  const envConfig = dotenv.config({ path: envPath });
  
  if (envConfig.error) {
    console.warn(`Warning: ${envPath} file not found, using process.env and defaults`);
  }
  
  // Extract database environment variables
  const {
    DATABASE_URL,
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
  } = process.env;
  
  // Configure database connection - prioritize DATABASE_URL if present
  const DB_CONFIG = DATABASE_URL
    ? { connectionString: DATABASE_URL }
    : {
        host: DB_HOST || 'localhost',
        port: Number(DB_PORT || 3306),
        user: DB_USER || 'root',
        password: DB_PASSWORD || '',
        database: DB_NAME || (NODE_ENV === 'test' ? 'tpms_test_db' : 'tpms_db')
      };
  
  return {
    NODE_ENV,
    PORT: process.env.PORT || 5000,
    DB_CONFIG
  };
}

const config = loadEnv();
console.log(`Environment: ${config.NODE_ENV}`);
console.log(`Database connection type: ${config.DB_CONFIG.connectionString ? 'PostgreSQL (URL)' : 'MySQL (Direct)'}`);
if (!config.DB_CONFIG.connectionString) {
  console.log(`Database: ${config.DB_CONFIG.database}`);
}

module.exports = config; 