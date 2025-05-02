/**
 * Email Service
 * 
 * This module handles email sending functionality including verification codes
 */

let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (error) {
  console.warn('Nodemailer module not found. Email functionality will be mocked.');
  // Create a mock version
  nodemailer = {
    createTransport: () => ({
      sendMail: async (options) => ({
        messageId: `mock-${Date.now()}`,
        response: 'Mock email sent (nodemailer not installed)'
      })
    })
  };
}

const config = require('../../config');

// Default email configuration
const EMAIL_CONFIG = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },
  from: process.env.EMAIL_FROM || 'TPMS System <noreply@tpms.com>'
};

// Create mail transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: EMAIL_CONFIG.host,
    port: EMAIL_CONFIG.port,
    secure: EMAIL_CONFIG.secure,
    auth: {
      user: EMAIL_CONFIG.auth.user,
      pass: EMAIL_CONFIG.auth.pass,
    },
  });
};

/**
 * Generate a random verification code
 * @param {Number} length Length of the code (default: 6)
 * @returns {String} Random verification code
 */
const generateVerificationCode = (length = 6) => {
  const digits = '0123456789';
  let code = '';
  
  for (let i = 0; i < length; i++) {
    code += digits[Math.floor(Math.random() * 10)];
  }
  
  return code;
};

/**
 * Store verification code in memory cache with expiration
 * In a production environment, this should be stored in Redis or a database
 */
const verificationCodes = new Map();

/**
 * Save verification code for an email
 * @param {String} email Email address
 * @param {String} code Verification code
 * @param {Number} expiresIn Expiration time in seconds (default: 10 minutes)
 */
const saveVerificationCode = (email, code, expiresIn = 600) => {
  const expiresAt = Date.now() + (expiresIn * 1000);
  
  verificationCodes.set(email, {
    code,
    expiresAt
  });
  
  // Set timeout to clean up expired code
  setTimeout(() => {
    const stored = verificationCodes.get(email);
    if (stored && stored.code === code) {
      verificationCodes.delete(email);
    }
  }, expiresIn * 1000);
};

/**
 * Verify code for an email
 * @param {String} email Email address
 * @param {String} code Verification code
 * @returns {Boolean} True if code is valid
 */
const verifyCode = (email, code) => {
  const stored = verificationCodes.get(email);
  
  if (!stored) {
    return false;
  }
  
  if (Date.now() > stored.expiresAt) {
    verificationCodes.delete(email);
    return false;
  }
  
  const isValid = stored.code === code;
  
  if (isValid) {
    // Remove code after successful verification
    verificationCodes.delete(email);
  }
  
  return isValid;
};

/**
 * Send verification code email
 * @param {String} email Recipient email address
 * @param {Object} options Additional options
 * @returns {Promise<Object>} Send result
 */
const sendVerificationCode = async (email, options = {}) => {
  try {
    // Generate verification code
    const code = generateVerificationCode();
    
    // Store code with expiration
    saveVerificationCode(email, code);
    
    // Email content
    const subject = options.subject || 'TPMS Verification Code';
    const text = options.text || 
      `Your verification code is: ${code}\n\nThis code will expire in 10 minutes.`;
    const html = options.html || 
      `<p>Your verification code is: <strong>${code}</strong></p>
       <p>This code will expire in 10 minutes.</p>
       <p>If you did not request this code, please ignore this email.</p>`;
    
    // Create transporter
    const transporter = createTransporter();
    
    // Send email
    const info = await transporter.sendMail({
      from: EMAIL_CONFIG.from,
      to: email,
      subject,
      text,
      html,
    });
    
    console.log(`Verification code sent to ${email}: ${code}`);
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send password reset email
 * @param {String} email Recipient email address
 * @param {Object} options Additional options
 * @returns {Promise<Object>} Send result
 */
const sendPasswordResetCode = async (email, options = {}) => {
  return sendVerificationCode(email, {
    subject: 'TPMS Password Reset Code',
    text: `Your password reset code is: ${options.code || generateVerificationCode()}\n\nThis code will expire in 10 minutes.`,
    html: `<p>Your password reset code is: <strong>${options.code || generateVerificationCode()}</strong></p>
           <p>This code will expire in 10 minutes.</p>
           <p>If you did not request this code, please contact administrator immediately.</p>`,
    ...options
  });
};

module.exports = {
  sendVerificationCode,
  sendPasswordResetCode,
  verifyCode,
  generateVerificationCode
}; 