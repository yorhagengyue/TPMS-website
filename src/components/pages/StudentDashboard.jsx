import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiUser, FiBarChart2, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

export const StudentDashboard = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState(null);

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
          lastAttendance: studentResult.student.last_attendance
        };
        setAttendanceStats(stats);

      } catch (error) {
        console.error('Error fetching student data:', error);
        setError('Failed to load student data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [user]);

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

        {/* Attendance Date Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-6 text-gray-800">Attendance Date Record</h3>
          
          <div className="grid grid-cols-7 gap-2">
            {/* Generate the last 41 days from today */}
            {Array.from({ length: 41 }).map((_, index) => {
              // Calculate dates starting from today and going backward
              const date = new Date();
              date.setDate(date.getDate() - (40 - index)); // This makes the rightmost date today, and counts backwards
              
              // Format date as DD (day of month)
              const dayOfMonth = date.getDate();
              
              // Check if this date is in the attendance records
              const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
              const isAttended = attendanceData.some(record => {
                const recordDate = new Date(record.check_in_time).toISOString().split('T')[0];
                return recordDate === dateStr;
              });
              
              return (
                <div
                  key={index}
                  className={`h-10 rounded-md flex items-center justify-center ${
                    isAttended ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
                  }`}
                  title={date.toLocaleDateString()}
                >
                  {dayOfMonth}
                </div>
              );
            })}
          </div>
          
          <div className="flex items-center justify-center mt-4">
            <div className="flex items-center mr-4">
              <div className="w-4 h-4 bg-green-100 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Attended</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-100 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Not Attended</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}; 