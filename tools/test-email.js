/**
 * Email Testing Tool
 * 
 * This script tests the email sending functionality
 * Usage: node tools/test-email.js <recipient_email>
 */

const emailService = require('../src/lib/emailService');

async function testEmailSending(recipientEmail) {
  if (!recipientEmail) {
    console.error('Error: Recipient email is required');
    console.log('Usage: node tools/test-email.js <recipient_email>');
    process.exit(1);
  }

  console.log(`Testing email sending to: ${recipientEmail}`);
  
  try {
    // Test verification code sending
    console.log('Sending verification code email...');
    const result = await emailService.sendVerificationCode(recipientEmail);
    
    if (result.success) {
      console.log('✅ Verification code email sent successfully');
      console.log(`Message ID: ${result.messageId}`);
    } else {
      console.error('❌ Failed to send verification code email');
      console.error(`Error: ${result.error}`);
    }
  } catch (error) {
    console.error('❌ Error testing email service:', error.message);
  }
}

// Get recipient email from command line arguments
const recipientEmail = process.argv[2];
testEmailSending(recipientEmail); 