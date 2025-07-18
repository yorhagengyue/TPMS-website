import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiAlertCircle, FiCheck, FiArrowRight, FiInfo } from 'react-icons/fi';
import EmailVerification from '../EmailVerification';

const RegisterPage = ({ onLogin }) => {
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Enter Student ID, 2: Email Verification
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  // Verify student ID and advance to email verification
  const verifyStudentId = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    if (!studentId) {
      setError('Please enter your student ID');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/verify-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId }),
      });

      const data = await response.json();

      if (!data.success) {
        // If student ID doesn't exist, redirect to join us page
        if (data.message === 'Student ID does not exist') {
          setMessage('Redirecting to registration form...');
          setTimeout(() => {
            window.history.pushState(null, '', '/joinus');
            window.dispatchEvent(new Event('popstate'));
          }, 1500);
        } else {
          // For other errors, show the error message
        setError(data.message || 'Student ID verification failed');
        }
        setIsLoading(false);
        return;
      }

      // Student ID verification successful, proceed to email verification
      setStep(2);
      setIsLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setError('An unexpected error occurred, please try again');
      setIsLoading(false);
    }
  };

  // Handle complete registration
  const handleCompleteRegistration = async () => {
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          email,
          verificationCode
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message || 'Registration failed');
        setIsLoading(false);
        return;
      }

      // Registration successful
      setMessage('Account created successfully! Redirecting to login page...');
      
      // Redirect to login page after a delay
      setTimeout(() => {
        window.history.pushState(null, '', '/login');
        window.dispatchEvent(new Event('popstate'));
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);
      setError('An unexpected error occurred, please try again');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle email verification completion
  const handleEmailVerified = (verifiedEmail, code) => {
    setEmail(verifiedEmail);
    setVerificationCode(code);
    setIsEmailVerified(true);
    
    // Automatically complete registration when email is verified
    handleCompleteRegistration();
  };

  // Switch to login page
  const goToLogin = (e) => {
    e.preventDefault();
    window.history.pushState(null, '', '/login');
    window.dispatchEvent(new Event('popstate'));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (step === 1) {
      verifyStudentId(e);
    } else if (step === 2 && isEmailVerified) {
      handleCompleteRegistration();
    }
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
          <h2 className="text-3xl font-bold text-gray-800">Create Account</h2>
          <p className="text-gray-600 mt-2">
            {step === 1 ? 'Verify your student ID to get started' : 'Verify your email address'}
          </p>
        </div>

        {/* TPMS Member Guidance */}
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700 flex items-start"
        >
          <FiInfo className="mr-3 mt-0.5 flex-shrink-0 text-blue-500" />
          <div>
            <span className="font-medium block mb-1">Existing TPMS Members:</span>
            <span className="text-sm">
              If you are already a TPMS member, you don't need to register again. Simply go to 
              the <a href="#" onClick={goToLogin} className="text-blue-600 hover:text-blue-800 font-medium">login page</a>, 
              type your student ID and log in to set your password.
            </span>
          </div>
        </motion.div>

        {/* Error message */}
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

        {/* Success message */}
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

        <form onSubmit={handleSubmit}>
          {/* Step 1: Student ID Verification */}
          {step === 1 && (
            <div>
          <div className="mb-6">
            <label htmlFor="studentId" className="block text-gray-700 text-sm font-medium mb-2">
              Student ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiUser className="text-gray-400" />
              </div>
              <input
                id="studentId"
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="pl-10 block w-full border border-gray-300 rounded-md py-3 px-4 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter your student ID"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Example: 2401360i (Your student ID will be your username)
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
                  Verifying...
                </>
              ) : (
                <>
                  <FiArrowRight className="mr-2" /> Verify Student ID
                </>
              )}
            </button>
          </div>
            </div>
          )}
          
          {/* Step 2: Email Verification */}
          {step === 2 && (
            <EmailVerification
              email={email}
              onEmailChange={setEmail}
              onVerified={handleEmailVerified}
              title="Email Verification"
              description="Please enter your email address to verify your account"
            />
          )}
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Already have an account? <a href="#" onClick={goToLogin} className="text-primary-600 hover:text-primary-700">Login</a>
          </p>
          <p className="text-xs text-gray-500 mt-2">
            If you need help, please contact your administrator or teacher
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage; 