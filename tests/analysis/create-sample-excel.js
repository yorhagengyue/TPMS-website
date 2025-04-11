/**
 * Generate Sample Excel Files for TPMS
 * 
 * This script creates sample Excel files for testing the migration:
 * 1. A student list file
 * 2. An attendance record file
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('Created uploads directory');
}

// Sample student data
const students = [
  { 'Name': 'John Smith', 'Course': 'Computer Science', 'index number': '2401001A' },
  { 'Name': 'Mary Johnson', 'Course': 'Business', 'index number': '2401002B' },
  { 'Name': 'David Lee', 'Course': 'Engineering', 'index number': '2401003C' },
  { 'Name': 'Sarah Wong', 'Course': 'Design', 'index number': '2401004D' },
  { 'Name': 'Michael Tan', 'Course': 'IT', 'index number': '2401005E' },
  { 'Name': 'Sophia Chen', 'Course': 'Business', 'index number': '2401006F' },
  { 'Name': 'Daniel Kim', 'Course': 'Computer Science', 'index number': '2401007G' },
  { 'Name': 'Emily Zhang', 'Course': 'Engineering', 'index number': '2401008H' },
  { 'Name': 'William Lim', 'Course': 'IT', 'index number': '2401009I' },
  { 'Name': 'Olivia Ng', 'Course': 'Design', 'index number': '2401010J' }
];

// Create sample student list Excel file
function createStudentListFile() {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Convert JSON data to worksheet
  const worksheet = XLSX.utils.json_to_sheet(students);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
  
  // Write workbook to file
  const filePath = path.join(uploadsDir, 'students.xlsx');
  XLSX.writeFile(workbook, filePath);
  
  console.log(`Created sample student list file: ${filePath}`);
}

// Sample attendance data
function createAttendanceFile() {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Create attendance entries
  const attendanceEntries = [];
  
  // Current date
  const currentDate = new Date();
  
  // Generate attendance records for each student for the past 5 days
  for (let day = 0; day < 5; day++) {
    const recordDate = new Date();
    recordDate.setDate(currentDate.getDate() - day);
    
    for (const student of students) {
      if (Math.random() > 0.3) { // 70% chance of attendance
        attendanceEntries.push({
          'Admin No.': student['index number'],
          'Name': student['Name'],
          'Date': recordDate.toLocaleDateString(),
          'Check-in Time': new Date(
            recordDate.getFullYear(), 
            recordDate.getMonth(), 
            recordDate.getDate(), 
            9 + Math.floor(Math.random() * 4), // 9am to 12pm
            Math.floor(Math.random() * 60)
          ).toLocaleString(),
          'Latitude': (1.3456 + (Math.random() * 0.01 - 0.005)).toFixed(6),
          'Longitude': (103.9321 + (Math.random() * 0.01 - 0.005)).toFixed(6)
        });
      }
    }
  }
  
  // Convert JSON data to worksheet
  const worksheet = XLSX.utils.json_to_sheet(attendanceEntries);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
  
  // Write workbook to file
  const filePath = path.join(uploadsDir, 'attendance.xlsx');
  XLSX.writeFile(workbook, filePath);
  
  console.log(`Created sample attendance file: ${filePath}`);
}

// Run the functions
createStudentListFile();
createAttendanceFile();

console.log('Sample Excel files created successfully'); 