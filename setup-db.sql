-- Database setup script for TPMS (Temasek Polytechnic Mindsport Club)

-- Create database (if not already created)
CREATE DATABASE IF NOT EXISTS tpms_db;

-- Use the database
USE tpms_db;

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  course VARCHAR(255),
  index_number VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255),
  total_sessions INT DEFAULT 0,
  attended_sessions INT DEFAULT 0,
  attendance_rate DECIMAL(5,2) DEFAULT 0.00,
  last_attendance TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  session_id INT,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Create user authentication table with JWT support
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  student_id INT NOT NULL,
  email VARCHAR(255),
  role ENUM('admin', 'student', 'teacher') NOT NULL DEFAULT 'student',
  chess_username VARCHAR(50),
  chess_rating INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Create department table (for mind sports)
CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create player ranking table
CREATE TABLE IF NOT EXISTS player_rankings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  department_id INT NOT NULL,
  rating INT NOT NULL DEFAULT 1200,
  level VARCHAR(50),
  matches_played INT DEFAULT 0,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  draws INT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  UNIQUE KEY unique_player_dept (student_id, department_id)
);

-- Create match history table
CREATE TABLE IF NOT EXISTS match_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  department_id INT NOT NULL,
  player1_id INT NOT NULL,
  player2_id INT NOT NULL,
  result ENUM('player1_win', 'player2_win', 'draw') NOT NULL,
  player1_rating_change INT,
  player2_rating_change INT,
  match_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (player1_id) REFERENCES students(id),
  FOREIGN KEY (player2_id) REFERENCES students(id)
);

-- Insert default departments
INSERT INTO departments (name, description) VALUES 
('Chess', 'International Chess department for learning and competing in classic chess'),
('Go', 'Go (Weiqi) department focusing on this ancient strategic board game'),
('Chinese Chess', 'Chinese Chess (Xiangqi) department for traditional Chinese chess');

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATETIME NOT NULL,
  location VARCHAR(255),
  department_id INT,
  type ENUM('Tournament', 'Workshop', 'Regular Meeting', 'Special Event'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- Create CCA session table (to validate attendance time windows)
CREATE TABLE IF NOT EXISTS cca_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  department_id INT,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  location VARCHAR(255),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- Create analysis results table (for pandas analysis)
CREATE TABLE IF NOT EXISTS analysis_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_students INT NOT NULL,
  total_sessions INT NOT NULL,
  average_attendance_rate DECIMAL(5,2) NOT NULL
);

-- Create attendance analysis table
CREATE TABLE IF NOT EXISTS attendance_analysis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_students INT NOT NULL,
  total_sessions INT NOT NULL,
  average_attendance_rate DECIMAL(5,2) NOT NULL
);

-- Create attendance sessions table
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  analysis_id INT NOT NULL,
  session_date VARCHAR(50) NOT NULL,
  FOREIGN KEY (analysis_id) REFERENCES attendance_analysis(id) ON DELETE CASCADE
);

-- Create tokens blacklist table for JWT security
CREATE TABLE IF NOT EXISTS revoked_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token_id VARCHAR(255) NOT NULL,
  expiry TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (token_id),
  INDEX (expiry)
);

-- Insert admin user (password: admin123)
INSERT INTO students (name, course, index_number, email) 
VALUES ('Administrator', 'System', 'admin001', 'admin@tp.edu.sg');

INSERT INTO users (username, password_hash, student_id, email, role) 
VALUES ('admin', '$2b$10$4QO62sGI2Ysi/NrZx/RoRe/Z83Glo0Cz8AZ1Sjj1Gqm4OQjUm9dju', 1, 'admin@tp.edu.sg', 'admin'); 