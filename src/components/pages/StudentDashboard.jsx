import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiUser, FiBarChart2, FiClock, FiCheckCircle, FiAlertCircle, FiChevronLeft, FiChevronRight, FiSettings } from 'react-icons/fi';
import ExportAttendance from '../admin/ExportAttendance';

export const StudentDashboard = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError('');

        // Get student details
        const studentResponse = await fetch(`/api/students/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!studentResponse.ok) {
          throw new Error('Failed to fetch student data');
        }

        const studentResult = await studentResponse.json();
        setStudentData(studentResult.student);

        // Get attendance records
        const attendanceResponse = await fetch(`/api/students/${user.id}/attendance`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!attendanceResponse.ok) {
          throw new Error('Failed to fetch attendance data');
        }

        const attendanceResult = await attendanceResponse.json();
        setAttendanceData(attendanceResult.attendance);

        // Calculate attendance statistics
        const stats = {
          totalSessions: studentResult.student.total_sessions || 0,
          attendedSessions: studentResult.student.attended_sessions || 0,
          attendanceRate: studentResult.student.attendance_rate || 0,
          // last_attendance might not exist in PostgreSQL database
          lastAttendance: studentResult.student.last_attendance || null
        };
        setAttendanceStats(stats);

        // Find month with most recent attendance
        if (attendanceResult.attendance && attendanceResult.attendance.length > 0) {
          // Sort attendance records by date (newest first)
          const sortedAttendance = [...attendanceResult.attendance].sort((a, b) => 
            new Date(b.check_in_time) - new Date(a.check_in_time)
          );
          
          // Get the most recent attendance date
          const mostRecentDate = new Date(sortedAttendance[0].check_in_time);
          
          // Set the calendar to that month
          setCurrentCalendarDate(new Date(mostRecentDate.getFullYear(), mostRecentDate.getMonth(), 1));
        } else {
          // If no attendance records, default to current month
          const now = new Date();
          setCurrentCalendarDate(new Date(now.getFullYear(), now.getMonth(), 1));
        }

      } catch (error) {
        console.error('Error fetching student data:', error);
        setError('Failed to load student data. Please try again later.');
        
        // Set calendar to current month even on error
        const now = new Date();
        setCurrentCalendarDate(new Date(now.getFullYear(), now.getMonth(), 1));
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [user]);

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentCalendarDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() - 1);
      
      // Don't go before January 2024
      if (newDate.getFullYear() < 2024 || (newDate.getFullYear() === 2024 && newDate.getMonth() < 0)) {
        return new Date(2024, 0, 1); // January 2024
      }
      
      return newDate;
    });
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentCalendarDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + 1);
      
      // Don't go beyond current month
      const now = new Date();
      if (newDate > new Date(now.getFullYear(), now.getMonth(), 1)) {
        return new Date(now.getFullYear(), now.getMonth(), 1);
      }
      
      return newDate;
    });
  };

  // Check if we can go to previous month
  const canGoToPreviousMonth = () => {
    if (!currentCalendarDate) return false;
    
    // Check if current calendar date is after January 2024
    return currentCalendarDate > new Date(2024, 0, 1);
  };

  // Check if we can go to next month
  const canGoToNextMonth = () => {
    if (!currentCalendarDate) return false;
    
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Check if current calendar date is before current month
    return currentCalendarDate < currentMonthStart;
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Render error message
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md text-red-700">
          <div className="flex items-center">
            <FiAlertCircle className="mr-3" size={20} />
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // If no data has been retrieved yet
  if (!studentData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-md text-yellow-700">
          <div className="flex items-center">
            <FiAlertCircle className="mr-3" size={20} />
            <p>Please log in to view your student data.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold mb-8 text-gray-800">Student Dashboard</h2>

        {/* Admin tools area - only shown when user is an administrator */}
        {user && user.role === 'admin' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md mb-6">
              <div className="flex items-center">
                <FiSettings className="text-blue-500 mr-3" size={20} />
                <p className="font-medium text-blue-600">Admin Tools</p>
              </div>
            </div>
            
            {/* 导出签到数据工具 */}
            <ExportAttendance />
          </motion.div>
        )}

        {/* Student Information Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center">
            <div className="bg-primary-100 p-4 rounded-full">
              <FiUser className="text-primary-600" size={24} />
            </div>
            <div className="ml-6">
              <h3 className="text-xl font-semibold text-gray-800">{studentData.name}</h3>
              <div className="text-gray-600 mt-1">Student ID: {studentData.index_number}</div>
              {studentData.course && (
                <div className="text-gray-600">Course: {studentData.course}</div>
              )}
              {studentData.email && (
                <div className="text-gray-600">Email: {studentData.email}</div>
              )}
            </div>
          </div>
        </div>

        {/* Attendance Statistics Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-medium text-gray-800">Total Sessions</h4>
              <div className="bg-blue-100 p-2 rounded-full">
                <FiCalendar className="text-blue-600" size={20} />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-800">{attendanceStats.totalSessions}</div>
            <div className="text-sm text-gray-600 mt-2">Total Sessions</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-medium text-gray-800">Attended Sessions</h4>
              <div className="bg-green-100 p-2 rounded-full">
                <FiCheckCircle className="text-green-600" size={20} />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-800">{attendanceStats.attendedSessions}</div>
            <div className="text-sm text-gray-600 mt-2">Attended Sessions</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-medium text-gray-800">Attendance Rate</h4>
              <div className="bg-purple-100 p-2 rounded-full">
                <FiBarChart2 className="text-purple-600" size={20} />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-800">{attendanceStats.attendanceRate}%</div>
            <div className="text-sm text-gray-600 mt-2">Overall Attendance Rate</div>
          </motion.div>
        </div>

        {/* Recent Attendance Record */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-semibold mb-6 text-gray-800">Recent Attendance Record</h3>
          
          {attendanceData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceData.slice(0, 5).map((attendance, index) => (
                    <tr key={attendance.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(attendance.check_in_time).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(attendance.check_in_time).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {attendance.location_lat && attendance.location_lng
                          ? (() => {
                              try {
                                const lat = Number(attendance.location_lat);
                                const lng = Number(attendance.location_lng);
                                return isNaN(lat) || isNaN(lng) 
                                  ? `${attendance.location_lat}, ${attendance.location_lng}` 
                                  : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                              } catch (error) {
                                return `${attendance.location_lat}, ${attendance.location_lng}`;
                              }
                            })()
                          : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FiClock className="mx-auto mb-4" size={24} />
              <p>No attendance record</p>
            </div>
          )}
        </div>

        {/* Attendance Calendar */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-6 text-gray-800">Attendance Calendar</h3>
          
          {/* Calendar navigation */}
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={goToPreviousMonth}
              disabled={!canGoToPreviousMonth()}
              className={`p-2 rounded-full ${canGoToPreviousMonth() ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              aria-label="Previous month"
            >
              <FiChevronLeft size={20} />
            </button>
            
            {currentCalendarDate && (
              <h4 className="text-lg font-medium">
                {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentCalendarDate)}
              </h4>
            )}
            
            <button 
              onClick={goToNextMonth}
              disabled={!canGoToNextMonth()}
              className={`p-2 rounded-full ${canGoToNextMonth() ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              aria-label="Next month"
            >
              <FiChevronRight size={20} />
            </button>
          </div>
          
          {/* Calendar view */}
          {currentCalendarDate && (
            <div className="calendar-month">
              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {(() => {
                  // Get year and month from current calendar date
                  const year = currentCalendarDate.getFullYear();
                  const month = currentCalendarDate.getMonth();
                  
                  // Get first day of month and total days in month
                  const firstDayOfMonth = new Date(year, month, 1);
                  const lastDayOfMonth = new Date(year, month + 1, 0);
                  const daysInMonth = lastDayOfMonth.getDate();
                  
                  // Get day of week for first day (0 = Sunday, 1 = Monday, etc.)
                  const firstDayWeekday = firstDayOfMonth.getDay();
                  
                  // Create an array for rendering
                  const calendarDays = [];
                  
                  // Empty cells for days before the first day of month
                  for (let i = 0; i < firstDayWeekday; i++) {
                    calendarDays.push(
                      <div key={`empty-start-${i}`} className="h-12"></div>
                    );
                  }
                  
                  // Days of the month
                  for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, month, day);
                    
                    // Check if this date is in the attendance records
                    const attendance = attendanceData.find(record => {
                      const recordDate = new Date(record.check_in_time);
                      // 使用本地日期比较，避免时区问题
                      return recordDate.getDate() === day &&
                             recordDate.getMonth() === month &&
                             recordDate.getFullYear() === year;
                    });
                    
                    const isAttended = !!attendance;
                    
                    // Check if the date is today
                    const today = new Date();
                    const isToday = 
                      today.getDate() === day && 
                      today.getMonth() === month && 
                      today.getFullYear() === year;
                    
                    calendarDays.push(
                      <div
                        key={`day-${day}`}
                        className={`h-12 rounded-md flex flex-col items-center justify-center ${
                          isToday ? 'ring-2 ring-blue-500 ' : ''
                        }${
                          isAttended 
                            ? 'bg-green-100 text-green-800 font-medium' 
                            : 'bg-gray-100 text-gray-600'
                        }`}
                        title={isAttended ? `Attended on ${date.toLocaleDateString()}` : date.toLocaleDateString()}
                      >
                        <span>{day}</span>
                        {isAttended && (
                          <span className="text-xs mt-1">
                            {new Date(attendance.check_in_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        )}
                      </div>
                    );
                  }
                  
                  return calendarDays;
                })()}
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-center mt-6">
            <div className="flex items-center mr-4">
              <div className="w-4 h-4 bg-green-100 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Attended</span>
            </div>
            <div className="flex items-center mr-4">
              <div className="w-4 h-4 bg-gray-100 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Not Attended</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-white rounded-md ring-2 ring-blue-500 mr-2"></div>
              <span className="text-sm text-gray-600">Today</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}; 