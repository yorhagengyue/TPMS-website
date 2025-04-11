# Database Environment Separation Guide

This document outlines how the test and production database environments are separated in the TPMS application.

## Overview

The application supports two distinct database environments:
- **Production Environment**: Uses the `tpms_db` database for real club data
- **Test Environment**: Uses the `tpms_test_db` database for testing and development

This separation ensures that testing activities never affect the production data, while allowing developers to work with realistic data structures.

## Environment Configuration Files

Two configuration files manage the environment settings:

- `.env` - Production environment configuration
  ```
  PORT=5000
  DB_HOST=localhost
  DB_USER=root
  DB_PASSWORD=******
  DB_NAME=tpms_db
  NODE_ENV=production
  ```

- `.env.test` - Test environment configuration
  ```
  PORT=5000
  DB_HOST=localhost
  DB_USER=root
  DB_PASSWORD=******
  DB_NAME=tpms_test_db
  NODE_ENV=test
  ```

## Configuration System

The `config.js` file dynamically loads the appropriate configuration based on the `NODE_ENV` environment variable:

- When `NODE_ENV=production`: Loads settings from `.env`
- When `NODE_ENV=test`: Loads settings from `.env.test`

This configuration is then used throughout the application to ensure the correct database is accessed.

## Test Database Setup

The test database is initialized with the `setup-test-db.js` script, which:
1. Creates the test database if it doesn't exist
2. Sets up the same table structure as the production database
3. Populates the database with sample data for testing

## Available Scripts

### Production Environment Commands

| Command | Description |
|---------|-------------|
| `npm run start:prod` | Start the server using production database |
| `npm run server:prod` | Start the server in development mode using production database |
| `npm run migrate:prod` | Import Excel data to production database |
| `npm run check:prod` | Check production database status |

### Test Environment Commands

| Command | Description |
|---------|-------------|
| `npm run start:test` | Start the server using test database |
| `npm run server:test` | Start the server in development mode using test database |
| `npm run setup:test` | Initialize test database with sample data |
| `npm run migrate:test` | Import Excel data to test database |
| `npm run check:test` | Check test database status |
| `npm run dev:test` | Start both server and client in test mode |

## Usage Examples

### Setting Up Test Environment

```bash
# Initialize test database with sample data
npm run setup:test

# Start server with test database
npm run start:test
```

### Working with Production Environment

```bash
# Start server with production database
npm run start:prod

# Import Excel data to production database
npm run migrate:prod
```

### Checking Database Status

```bash
# Check test database contents
npm run check:test

# Check production database contents
npm run check:prod
```

## Implementation Details

The environment separation is implemented through:

1. **Dynamic Configuration Loading**: The `config.js` module determines which `.env` file to load
2. **Environment-specific Database Connections**: All database connections use the configuration
3. **Separate Scripts**: Scripts target specific environments using the `cross-env` package
4. **Identical Database Schema**: Both environments use the same database schema

## Benefits

- **Data Safety**: Production data is never at risk during testing
- **Realistic Testing**: Test environment mimics production structure
- **Developer Flexibility**: Developers can freely experiment in the test environment
- **Clean Starting Point**: Test database can be reset to a known state 