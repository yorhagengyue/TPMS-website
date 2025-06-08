import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiEdit, FiCheck, FiLoader, FiCheckCircle, FiAlertCircle, FiCalendar, FiTrendingUp } from 'react-icons/fi';
import PageTransition from '../ui/PageTransition';
import * as XLSX from 'xlsx';

export const ProfilePage = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [chessUsername, setChessUsername] = useState('');
  const [bindStatus, setBindStatus] = useState(null); // null, 'success', 'error', 'pending_verification'
  const [errorMessage, setErrorMessage] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationStep, setVerificationStep] = useState(1); // 1 = request verification, 2 = verify
  const [attendanceData, setAttendanceData] = useState(null);
  const [attendanceRate, setAttendanceRate] = useState(0);
  const [attendanceHistory, setAttendanceHistory] = useState([]);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        const response = await fetch(`/api/users/profile`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const data = await response.json();
        setUserData(data.user);
        
        // If user has already bound their Chess.com account, display it
        if (data.user.chess_username) {
          setChessUsername(data.user.chess_username);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [user]);

  // Load and process attendance data
  useEffect(() => {
    const loadAttendanceData = async () => {
      if (!user) return;
      
      try {
        // First try to get attendance data from API
        try {
          const apiResponse = await fetch(`/api/students/${user.student_id || user.id}/attendance`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (apiResponse.ok) {
            const apiData = await apiResponse.json();
            if (apiData.success && apiData.attendance && apiData.attendance.length > 0) {
              // Use API data if available
              const attendanceCount = apiData.attendance.length;
              const rate = 100; // Assume all API records are attendance (present)
              
              setAttendanceRate(rate);
              setAttendanceData({
                total: attendanceCount,
                attended: attendanceCount
              });
              
              const history = apiData.attendance.map(record => ({
                date: new Date(record.check_in_time).toLocaleDateString(),
                attended: true
              }));
              
              setAttendanceHistory(history.reverse());
              return; // Exit early if API data is successfully loaded
            }
          }
        } catch (apiError) {
          console.log('API attendance data not available, falling back to Excel:', apiError.message);
        }
        
                 // Fallback to Excel file if API fails
         const response = await fetch('/cca attendance system.xlsx');
        if (!response.ok) {
          throw new Error(`Failed to fetch Excel file: ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('No worksheets found in Excel file');
        }
        
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        if (!data || data.length === 0) {
          console.warn('No attendance data found in Excel file');
          setAttendanceRate(0);
          setAttendanceData({ total: 0, attended: 0 });
          setAttendanceHistory([]);
          return;
        }
        
        // Find user's attendance records with improved matching logic
        const userStudentId = String(user.student_id || user.id);
        const userRecords = data.filter(record => {
          // Try multiple possible field names for student ID
          const recordId = String(record['Admission Numbers'] || record['Admin No.'] || record['Admission Number'] || '');
          return recordId === userStudentId;
        });
        
        if (userRecords.length === 0) {
          console.warn(`No attendance records found for student ID: ${userStudentId}`);
          // Check available student IDs for debugging
          const availableIds = data.slice(0, 5).map(record => 
            record['Admission Numbers'] || record['Admin No.'] || record['Admission Number'] || 'N/A'
          );
          console.log('Sample student IDs in Excel:', availableIds);
          setAttendanceRate(0);
          setAttendanceData({ total: 0, attended: 0 });
          setAttendanceHistory([]);
          return;
        }
        
        // Get all date columns (columns that contain '/' and look like dates)
        const dateColumns = Object.keys(data[0]).filter(col => {
          return col.includes('/') && /\d+\/\d+\/\d+/.test(col);
        });
        
        if (dateColumns.length === 0) {
          console.warn('No date columns found in Excel data');
          setAttendanceRate(0);
          setAttendanceData({ total: 0, attended: 0 });
          setAttendanceHistory([]);
          return;
        }
        
        // Calculate attendance for each date
        const history = [];
        let totalSessions = 0;
        let attendedSessions = 0;
        
        dateColumns.forEach(dateCol => {
          totalSessions++;
          
          // Check if user attended - handle multiple possible values
          const attended = userRecords.some(record => {
            const value = record[dateCol];
            // Consider 1, true, "1", "true", "Present", "Y", "Yes" as attendance
            return value === 1 || value === true || value === "1" || 
                   value === "true" || value === "Present" || 
                   value === "Y" || value === "Yes" ||
                   String(value).toLowerCase() === "present";
          });
          
          if (attended) {
            attendedSessions++;
          }
          
          history.push({
            date: dateCol,
            attended: attended
          });
        });
        
        // Calculate attendance rate
        const rate = totalSessions > 0 ? (attendedSessions / totalSessions * 100).toFixed(1) : 0;
        
        setAttendanceRate(rate);
        setAttendanceHistory(history.reverse()); // Show most recent first
        setAttendanceData({
          total: totalSessions,
          attended: attendedSessions
        });
        
        console.log(`Loaded attendance data: ${attendedSessions}/${totalSessions} sessions (${rate}%)`);
        
      } catch (error) {
        console.error('Error loading attendance data:', error);
        // Set default values on error
        setAttendanceRate(0);
        setAttendanceData({ total: 0, attended: 0 });
        setAttendanceHistory([]);
      }
    };
    
    loadAttendanceData();
  }, [user]);

  // Step 1: Request verification code
  const handleRequestVerification = async (e) => {
    e.preventDefault();
    
    // Trim the username to avoid spaces
    const trimmedUsername = chessUsername.trim();
    
    if (!trimmedUsername) {
      setBindStatus('error');
      setErrorMessage('Please enter a Chess.com username');
      return;
    }

    setLoading(true);
    setBindStatus(null);
    setErrorMessage('');
    
    try {
      const response = await fetch('/api/user/request-chess-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ chessUsername: trimmedUsername })
      });

      const data = await response.json();

      if (response.ok) {
        setBindStatus('pending_verification');
        setVerificationCode(data.verificationCode);
        setVerificationStep(2);
        setErrorMessage('');
      } else {
        setBindStatus('error');
        setErrorMessage(data.message || 'Failed to validate Chess.com account');
      }
    } catch (error) {
      console.error('Error requesting Chess.com verification:', error);
      setBindStatus('error');
      setErrorMessage('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Step 2: Verify and link account
  const handleVerifyChessAccount = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setBindStatus(null);
    setErrorMessage('');
    
    try {
      const response = await fetch('/api/user/verify-chess-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ chessUsername: chessUsername.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        setBindStatus('success');
        setErrorMessage('');
        setVerificationStep(1);
        setVerificationCode('');
        
        // Update the user data to reflect the binding
        setUserData(prev => ({
          ...prev,
          chess_username: data.chess_username,
          chess_rating: data.chess_rating,
          chess_rapid_rating: data.chess_rapid_rating,
          chess_bullet_rating: data.chess_bullet_rating,
          chess_daily_rating: data.chess_daily_rating,
          chess_tactics_rating: data.chess_tactics_rating,
          chess_puzzle_rush_rating: data.chess_puzzle_rush_rating
        }));
      } else {
        setBindStatus('error');
        setErrorMessage(data.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Error verifying Chess.com account:', error);
      setBindStatus('error');
      setErrorMessage('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Legacy handler (redirects to new flow)
  const handleBindChessAccount = async (e) => {
    e.preventDefault();
    handleRequestVerification(e);
  };

  if (!user) {
    return (
      <PageTransition>
        <div className="container mx-auto px-4 py-24">
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-md text-yellow-700">
            <div className="flex items-center">
              <FiAlertCircle className="mr-3" size={20} />
              <p>Please log in to view your profile.</p>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-6 text-gray-800">My Profile</h1>
          <div className="w-16 h-1 bg-blue-500 mb-10"></div>

          {/* User Info Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center mb-6">
              <div className="bg-blue-100 p-4 rounded-full">
                <FiUser className="text-blue-600" size={24} />
              </div>
              <div className="ml-6">
                <h2 className="text-2xl font-semibold text-gray-800">{userData?.name || user.name}</h2>
                <p className="text-gray-600">Student ID: {userData?.student_id || user.id}</p>
                <p className="text-gray-600">Email: {userData?.email || user.email}</p>
              </div>
            </div>
          </div>

          {/* Attendance Statistics Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center">
              <FiCalendar className="mr-2" />
              Attendance Statistics
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-blue-600">Attendance Rate</span>
                  <FiTrendingUp className="text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-blue-700">{attendanceRate || 0}%</div>
                {attendanceData?.total === 0 && (
                  <div className="text-xs text-gray-500 mt-1">No data available</div>
                )}
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-green-600">Sessions Attended</span>
                  <FiCheckCircle className="text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-700">{attendanceData?.attended || 0}</div>
                {attendanceData?.total === 0 && (
                  <div className="text-xs text-gray-500 mt-1">No sessions recorded</div>
                )}
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-purple-600">Total Sessions</span>
                  <FiCalendar className="text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-purple-700">{attendanceData?.total || 0}</div>
                {attendanceData?.total === 0 && (
                  <div className="text-xs text-gray-500 mt-1">No sessions available</div>
                )}
              </div>
            </div>

            {/* Attendance History */}
            {attendanceHistory.length > 0 ? (
              <div>
                <h3 className="text-lg font-medium mb-4">Recent Attendance History</h3>
                <div className="max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {attendanceHistory.slice(0, 20).map((session, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded text-sm text-center ${
                          session.attended
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        <div className="font-medium">{session.date}</div>
                        <div className="text-xs">
                          {session.attended ? 'Present' : 'Absent'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FiCalendar className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Attendance History</h3>
                <p className="text-gray-500">
                  {attendanceData?.total === 0 
                    ? "No attendance records found for your student ID. Please contact the administrator if you believe this is an error."
                    : "Your attendance history will appear here once you start attending sessions."}
                </p>
              </div>
            )}
          </div>

          {/* Chess.com Account Binding */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">Chess.com Account Binding</h2>
            
            {userData?.chess_username ? (
              <div className="mb-6">
                <div className="flex items-center mb-4">
                  <div className="bg-green-100 p-2 rounded-full mr-3">
                    <FiCheckCircle className="text-green-600" size={18} />
                  </div>
                  <p className="text-gray-700">
                    Currently bound to: <span className="font-semibold">{userData.chess_username}</span>
                  </p>
                </div>
                
                {userData.chess_rating && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h3 className="text-lg font-medium mb-4">Chess.com Ratings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {userData.chess_rating > 0 && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="text-sm text-blue-600 mb-1">Blitz</div>
                          <div className="text-2xl font-bold text-blue-700">{userData.chess_rating}</div>
                        </div>
                      )}
                      {userData.chess_rapid_rating > 0 && (
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="text-sm text-green-600 mb-1">Rapid</div>
                          <div className="text-2xl font-bold text-green-700">{userData.chess_rapid_rating}</div>
                        </div>
                      )}
                      {userData.chess_bullet_rating > 0 && (
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <div className="text-sm text-purple-600 mb-1">Bullet</div>
                          <div className="text-2xl font-bold text-purple-700">{userData.chess_bullet_rating}</div>
                        </div>
                      )}
                      {userData.chess_daily_rating > 0 && (
                        <div className="bg-yellow-50 p-3 rounded-lg">
                          <div className="text-sm text-yellow-600 mb-1">Daily</div>
                          <div className="text-2xl font-bold text-yellow-700">{userData.chess_daily_rating}</div>
                        </div>
                      )}
                      {userData.chess_tactics_rating > 0 && (
                        <div className="bg-red-50 p-3 rounded-lg">
                          <div className="text-sm text-red-600 mb-1">Tactics</div>
                          <div className="text-2xl font-bold text-red-700">{userData.chess_tactics_rating}</div>
                        </div>
                      )}
                      {userData.chess_puzzle_rush_rating > 0 && (
                        <div className="bg-indigo-50 p-3 rounded-lg">
                          <div className="text-sm text-indigo-600 mb-1">Puzzle Rush</div>
                          <div className="text-2xl font-bold text-indigo-700">{userData.chess_puzzle_rush_rating}</div>
                        </div>
                      )}
                    </div>
                    <p className="mt-4 text-xs text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-600 mb-4">
                Bind your Chess.com account to display your current rating and participate in tournaments.
              </p>
            )}

            {verificationStep === 1 ? (
              <form onSubmit={handleRequestVerification} className="mt-4">
                <div className="mb-4">
                  <label htmlFor="chessUsername" className="block text-sm font-medium text-gray-700 mb-1">
                    Chess.com Username
                  </label>
                  <input
                    type="text"
                    id="chessUsername"
                    value={chessUsername}
                    onChange={(e) => setChessUsername(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your Chess.com username"
                    disabled={loading}
                  />
                </div>

                {bindStatus === 'error' && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
                    <div className="flex items-center">
                      <FiAlertCircle className="mr-2" />
                      <p>{errorMessage}</p>
                    </div>
                  </div>
                )}

                {bindStatus === 'success' && (
                  <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg">
                    <div className="flex items-center">
                      <FiCheckCircle className="mr-2" />
                      <p>Successfully bound your Chess.com account!</p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-2 rounded-lg font-medium flex items-center ${
                    loading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {loading ? (
                    <>
                      <FiLoader className="animate-spin mr-2" />
                      Processing...
                    </>
                  ) : userData?.chess_username ? (
                    <>
                      <FiEdit className="mr-2" />
                      Update Chess.com Binding
                    </>
                  ) : (
                    <>
                      <FiCheck className="mr-2" />
                      Start Verification
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="mt-4">
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-700 mb-2">Verification Required</h4>
                  <p className="text-blue-600 mb-4">
                    Please follow these steps to verify your Chess.com account:
                  </p>
                  <ol className="list-decimal pl-5 mb-4 text-blue-600 space-y-2">
                    <li>Log in to your Chess.com account</li>
                    <li>Go to Profile → Location</li>
                    <li>Enter the following verification code in the location field:</li>
                  </ol>
                  <div className="bg-white p-3 rounded border border-blue-300 font-mono text-center text-blue-800 text-lg mb-4">
                    {verificationCode}
                  </div>
                  <p className="text-blue-600 text-sm">
                    After saving your location on Chess.com, click the button below to complete verification.
                  </p>
                </div>

                {bindStatus === 'error' && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
                    <div className="flex items-center">
                      <FiAlertCircle className="mr-2" />
                      <p>{errorMessage}</p>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={() => setVerificationStep(1)}
                    className="px-4 py-2 rounded-lg font-medium border border-gray-300 text-gray-600 hover:bg-gray-100"
                    disabled={loading}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleVerifyChessAccount}
                    disabled={loading}
                    className={`flex-1 px-6 py-2 rounded-lg font-medium flex items-center justify-center ${
                      loading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {loading ? (
                      <>
                        <FiLoader className="animate-spin mr-2" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <FiCheck className="mr-2" />
                        I've Updated My Location - Verify Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default ProfilePage; 