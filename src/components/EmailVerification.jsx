import React, { useState, useEffect } from 'react';
import { FiMail, FiCheck, FiLoader, FiAlertCircle } from 'react-icons/fi';

/**
 * Email Verification Component
 * 
 * This component handles the email verification process with verification codes
 * It can be used for registration and password reset flows
 */
const EmailVerification = ({
  email,
  onEmailChange,
  onVerified,
  verificationCodeEndpoint = '/api/auth/send-verification-code',
  verifyCodeEndpoint = '/api/auth/verify-email-code',
  title = 'Email Verification',
  description = 'Please enter your email address to receive a verification code'
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Handle countdown timer for resending code
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Send verification code to email
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(verificationCodeEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        setError(data.message || 'Failed to send verification code');
        setIsLoading(false);
        return;
      }
      
      setIsCodeSent(true);
      setMessage('Verification code sent to your email');
      
      // Start countdown for resending code (2 minutes)
      setCountdown(120);
    } catch (error) {
      console.error('Error sending verification code:', error);
      setError('An unexpected error occurred, please try again');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Verify the code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (!verificationCode) {
      setError('Please enter the verification code');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(verifyCodeEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code: verificationCode }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        setError(data.message || 'Invalid verification code');
        setIsLoading(false);
        return;
      }
      
      setIsVerified(true);
      setMessage('Email verified successfully');
      
      // Call the onVerified callback with the verified email and code
      if (onVerified) {
        onVerified(email, verificationCode);
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      setError('An unexpected error occurred, please try again');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-start">
          <FiAlertCircle className="mr-2 mt-1 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success message */}
      {message && (
        <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 text-green-700 flex items-start">
          <FiCheck className="mr-2 mt-1 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Step 1: Enter Email and Request Code */}
      {!isVerified && (
        <div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                disabled={isCodeSent || isLoading}
                className="pl-10 block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="your@email.com"
              />
            </div>
          </div>

          {/* Request Code Button */}
          {!isCodeSent ? (
            <button
              onClick={handleSendCode}
              disabled={isLoading || !email}
              className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                isLoading || !email ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <FiLoader className="animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                'Send Verification Code'
              )}
            </button>
          ) : (
            <div className="space-y-4">
              {/* Verification Code Input */}
              <div>
                <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700">
                  Verification Code
                </label>
                <input
                  id="verificationCode"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter 6-digit code"
                />
              </div>

              {/* Verify Button */}
              <button
                onClick={handleVerifyCode}
                disabled={isLoading || !verificationCode}
                className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                  isLoading || !verificationCode ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <>
                    <FiLoader className="animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </button>

              {/* Resend Code */}
              <div className="text-center">
                <button
                  onClick={handleSendCode}
                  disabled={countdown > 0 || isLoading}
                  className={`text-sm text-primary-600 hover:text-primary-500 ${
                    countdown > 0 || isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {countdown > 0
                    ? `Resend code in ${countdown} seconds`
                    : 'Resend verification code'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Verified */}
      {isVerified && (
        <div className="text-center p-4 bg-green-50 rounded-md">
          <FiCheck className="mx-auto h-12 w-12 text-green-500" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Email Verified</h3>
          <p className="mt-1 text-sm text-gray-600">
            Your email has been successfully verified.
          </p>
        </div>
      )}
    </div>
  );
};

export default EmailVerification; 