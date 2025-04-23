-- PostgreSQL数据库初始化脚本

-- 创建students表
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
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

-- 创建attendance表
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL,
  check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  session_id INT,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- 创建users表
-- 注意: PostgreSQL不支持MySQL的ENUM方式，使用CHECK约束
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  student_id INT NOT NULL,
  email VARCHAR(255),
  role VARCHAR(10) NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student', 'teacher')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 创建revoked_tokens表
CREATE TABLE IF NOT EXISTS revoked_tokens (
  id SERIAL PRIMARY KEY,
  token_id VARCHAR(255) NOT NULL,
  expiry TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_token_id ON revoked_tokens (token_id);
CREATE INDEX IF NOT EXISTS idx_expiry ON revoked_tokens (expiry); 