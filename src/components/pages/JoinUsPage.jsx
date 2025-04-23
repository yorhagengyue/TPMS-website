import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiExternalLink, FiArrowLeft, FiInfo } from 'react-icons/fi';

const JoinUsPage = () => {
  const [countdown, setCountdown] = useState(3);
  const formUrl = "https://forms.office.com/Pages/ResponsePage.aspx?id=8JupJXKOKkeuUK373w328VRbV-jJ2ehOsYG3z3mqLgZUQTVTV0hSUUw0M0VUQTlIVElTSVIwQk1PSi4u&origin=QRCode";

  useEffect(() => {
    // Auto redirect after 3 seconds
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      window.location.href = formUrl;
    }
  }, [countdown, formUrl]);

  // Navigate back to register page
  const goToRegister = () => {
    window.history.pushState(null, '', '/register');
    window.dispatchEvent(new Event('popstate'));
  };

  // Navigate to login page
  const goToLogin = () => {
    window.history.pushState(null, '', '/login');
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
          <h2 className="text-3xl font-bold text-gray-800">Join TP Mindsport Club</h2>
          <p className="text-gray-600 mt-2">
            Your student ID is not registered in our system yet
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700 flex items-start"
        >
          <FiInfo className="mr-3 mt-0.5 flex-shrink-0 text-blue-500" />
          <div>
            <span className="font-medium block mb-1">Registration Required:</span>
            <span className="text-sm">
              You need to register with the club first. You will be redirected to our registration form in {countdown} {countdown === 1 ? 'second' : 'seconds'}.
            </span>
          </div>
        </motion.div>

        <div className="flex flex-col space-y-4">
          <a
            href={formUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <FiExternalLink className="mr-2" /> Open Registration Form
          </a>
          
          <button
            onClick={goToRegister}
            className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <FiArrowLeft className="mr-2" /> Back to Verification
          </button>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already registered? Once your information is processed, you can 
            <a href="#" onClick={goToLogin} className="text-primary-600 hover:text-primary-700 ml-1">
              login here
            </a>
          </p>
          <p className="text-xs text-gray-500 mt-2">
            If you need help, please contact your administrator or teacher
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default JoinUsPage; 