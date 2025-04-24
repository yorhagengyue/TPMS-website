import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiEdit, FiCheck, FiLoader, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import PageTransition from '../ui/PageTransition';

export const ProfilePage = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [chessUsername, setChessUsername] = useState('');
  const [bindStatus, setBindStatus] = useState(null); // null, 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');

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

  const handleBindChessAccount = async (e) => {
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
    
    try {
      const response = await fetch('/api/user/link-chess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ chessUsername: trimmedUsername })
      });

      const data = await response.json();

      if (response.ok) {
        setBindStatus('success');
        setErrorMessage('');
        
        // Update the user data to reflect the binding
        setUserData(prev => ({
          ...prev,
          chess_username: data.chess_username,
          chess_rating: data.chess_rating
        }));
      } else {
        setBindStatus('error');
        setErrorMessage(data.message || 'Failed to bind Chess.com account');
      }
    } catch (error) {
      console.error('Error binding Chess.com account:', error);
      setBindStatus('error');
      setErrorMessage('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
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
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium mb-2">Current Blitz Rating</h3>
                    <div className="text-3xl font-bold text-blue-700">{userData.chess_rating}</div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-600 mb-4">
                Bind your Chess.com account to display your current rating and participate in tournaments.
              </p>
            )}

            <form onSubmit={handleBindChessAccount} className="mt-4">
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
                    Binding...
                  </>
                ) : userData?.chess_username ? (
                  <>
                    <FiEdit className="mr-2" />
                    Update Binding
                  </>
                ) : (
                  <>
                    <FiCheck className="mr-2" />
                    Bind Account
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default ProfilePage; 