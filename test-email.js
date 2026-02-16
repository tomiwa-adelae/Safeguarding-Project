// ═══════════════════════════════════════════════════════════════
// Test Mailjet Email Service
// ═══════════════════════════════════════════════════════════════

require('dotenv').config();
const { sendWelcomeEmail, sendPasswordResetEmail } = require('./utils/email');

async function testEmails() {
  console.log('🧪 Testing Mailjet Email Service\n');

  console.log('📧 Test 1: Sending Welcome Email...');
  try {
    const result1 = await sendWelcomeEmail(
      process.env.ADMIN_EMAIL_ADDRESS,
      'Test User'
    );

    if (result1.success) {
      console.log('✅ Welcome email sent successfully!');
      console.log('   Message ID:', result1.id);
    } else {
      console.error('❌ Failed to send welcome email:', result1.error);
    }
  } catch (err) {
    console.error('❌ Error sending welcome email:', err.message);
  }

  console.log('\n📧 Test 2: Sending Password Reset Email...');
  try {
    const result2 = await sendPasswordResetEmail(
      process.env.ADMIN_EMAIL_ADDRESS,
      'Test User',
      'test-token-123456'
    );

    if (result2.success) {
      console.log('✅ Password reset email sent successfully!');
      console.log('   Message ID:', result2.id);
    } else {
      console.error('❌ Failed to send password reset email:', result2.error);
    }
  } catch (err) {
    console.error('❌ Error sending password reset email:', err.message);
  }

  console.log('\n✅ Email test complete!');
  console.log(`📬 Check your inbox at: ${process.env.ADMIN_EMAIL_ADDRESS}`);
}

testEmails();
