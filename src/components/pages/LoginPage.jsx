import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiLock, FiLogIn, FiAlertCircle, FiCheck, FiKey, FiInfo } from 'react-icons/fi';

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // State for password setup handling
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  const [tempUserData, setTempUserData] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    if (!username) {
      setError('Please enter your student ID');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      // Handle password setup requirement
      if (data.success && data.needsPasswordSetup) {
        setNeedsPasswordSetup(true);
        setTempUserData(data.user);
        setMessage(data.message || 'Please set your password to continue.');
        setIsLoading(false);
        return;
      }

      if (!data.success) {
        setError(data.message || 'Login failed');
        setIsLoading(false);
        return;
      }

      // Normal successful login
      // Save token and user data to local storage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Call the onLogin callback
      if (onLogin) {
        onLogin(data.user);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred, please try again');
      setIsLoading(false);
    }
  };

  // Handle password setup
  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    if (!password || !confirmPassword) {
      setError('Please enter password and confirmation');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: tempUserData.id, 
          password 
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message || 'Failed to set password');
        setIsLoading(false);
        return;
      }

      // Password set successfully, save login state
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Set success message
      setMessage('Password set successfully!');
      
      // Short delay before calling login callback
      setTimeout(() => {
        if (onLogin) {
          onLogin(data.user);
        }
      }, 1500);

      setIsLoading(false);
    } catch (error) {
      console.error('Set password error:', error);
      setError('An unexpected error occurred, please try again');
      setIsLoading(false);
    }
  };

  // Switch to registration page
  const goToRegister = () => {
    window.history.pushState(null, '', '/register');
    window.dispatchEvent(new Event('popstate'));
  };

  return (
    <div className="container mx-auto px-4 py-24 flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 mt-10"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            {needsPasswordSetup ? 'Set Your Password' : 'Welcome Back'}
          </h2>
          <p className="text-gray-600 mt-2">
            {needsPasswordSetup 
              ? 'Please set a password for your account' 
              : 'Login to access your account'}
          </p>
        </div>

        {/* TPMS Member Login Guidance */}
        {!needsPasswordSetup && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700 flex items-start"
          >
            <FiInfo className="mr-3 mt-0.5 flex-shrink-0 text-blue-500" />
            <div>
              <span className="font-medium block mb-1">TPMS Members:</span>
              <span className="text-sm">
                If you are already a TPMS member, simply type your student ID and log in to set your password. 
                First-time users will be automatically prompted to create a password.
              </span>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-start"
          >
            <FiAlertCircle className="mr-3 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {message && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 flex items-start"
          >
            <FiCheck className="mr-3 mt-0.5 flex-shrink-0" />
            <span>{message}</span>
          </motion.div>
        )}

        {needsPasswordSetup ? (
          // Password setup form
          <form onSubmit={handleSetPassword}>
            <div className="mb-6">
              <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiKey className="text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 block w-full border border-gray-300 rounded-md py-3 px-4 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter new password"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 6 characters long
              </p>
            </div>

            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-medium mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 block w-full border border-gray-300 rounded-md py-3 px-4 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Re-enter password"
                />
              </div>
            </div>

            <div className="mb-6">
              <button
                type="submit"
                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                  isLoading ? 'opacity-75 cursor-not-allowed' : ''
                }`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Setting password...
                  </>
                ) : (
                  <>
                    <FiKey className="mr-2" /> Set Password
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          // Login form
          <form onSubmit={handleLogin}>
            <div className="mb-6">
              <label htmlFor="username" className="block text-gray-700 text-sm font-medium mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="text-gray-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 block w-full border border-gray-300 rounded-md py-3 px-4 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter your student ID"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Your student ID is your username (e.g., 2401360i)
              </p>
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 block w-full border border-gray-300 rounded-md py-3 px-4 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter your password"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Leave blank if you're logging in for the first time
              </p>
            </div>

            <div className="mb-6">
              <button
                type="submit"
                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                  isLoading ? 'opacity-75 cursor-not-allowed' : ''
                }`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Logging in...
                  </>
                ) : (
                  <>
                    <FiLogIn className="mr-2" /> Login
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <div className="text-center mt-4">
          {!needsPasswordSetup && (
            <p className="text-sm text-gray-600">
              Don't have an account? <a href="#" onClick={goToRegister} className="text-primary-600 hover:text-primary-700">Register new account</a>
            </p>
          )}
          <p className="text-sm text-gray-600 mt-2">
            Having trouble logging in? Please contact your administrator or teacher for assistance.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage; 