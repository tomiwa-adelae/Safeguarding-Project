// ═══════════════════════════════════════════════════════════════
// Email Service (Mailjet)
// ═══════════════════════════════════════════════════════════════

const Mailjet = require('node-mailjet');

const mailjet = Mailjet.apiConnect(
  process.env.MAILJET_API_PUBLIC_KEY,
  process.env.MAILJET_API_PRIVATE_KEY
);

const FROM_EMAIL = process.env.SENDER_EMAIL_ADDRESS || 'info@lgs.sch.ng';
const FROM_NAME = process.env.SENDER_EMAIL_NAME || 'Safeguarding';
const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';

/**
 * Send password reset email with secure token link
 * @param {string} email - Recipient email address
 * @param {string} name - Recipient name
 * @param {string} token - Password reset token
 * @returns {Promise<Object>} - { success: boolean, id?: string, error?: string }
 */
async function sendPasswordResetEmail(email, name, token) {
  const resetUrl = `${SITE_URL}/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1b7a3d, #27a552); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background: #f8f9fb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #1b7a3d; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px; }
        .url-box { word-break: break-all; font-size: 0.9em; color: #666; background: #fff; padding: 12px; border: 1px solid #ddd; border-radius: 4px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔒 Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${name}</strong>,</p>
          <p>You requested to reset your password for your Project STAR Safeguarding Training account.</p>
          <p>Click the button below to reset your password:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <div class="url-box">${resetUrl}</div>
          <div class="warning">
            <strong>⚠️ Security Notice:</strong><br>
            This link expires in 1 hour for your security.<br>
            If you didn't request this reset, please ignore this email and your password will remain unchanged.
          </div>
        </div>
        <div class="footer">
          <p><strong>Project STAR Safeguarding Training</strong><br>
          Lagelu Grammar School, Oyo State, Nigeria<br>
          This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hi ${name},

You requested to reset your password for your Project STAR Safeguarding Training account.

Reset your password by visiting this link:
${resetUrl}

This link expires in 1 hour for your security.

If you didn't request this reset, please ignore this email and your password will remain unchanged.

---
Project STAR Safeguarding Training
Lagelu Grammar School, Oyo State, Nigeria
This is an automated message, please do not reply.
  `;

  try {
    const request = mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: FROM_EMAIL,
            Name: FROM_NAME
          },
          To: [
            {
              Email: email,
              Name: name
            }
          ],
          Subject: 'Reset Your Password - Project STAR Safeguarding',
          TextPart: text,
          HTMLPart: html
        }
      ]
    });

    const result = await request;
    console.log('[Email] Password reset sent to:', email, 'MessageID:', result.body.Messages[0].Status);
    return { success: true, id: result.body.Messages[0].To[0].MessageID };
  } catch (error) {
    console.error('[Email] Failed to send password reset:', error.statusCode, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send welcome email to new users
 * @param {string} email - Recipient email address
 * @param {string} name - Recipient name
 * @returns {Promise<Object>} - { success: boolean, id?: string }
 */
async function sendWelcomeEmail(email, name) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1b7a3d, #27a552); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background: #f8f9fb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #1b7a3d; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        ul { padding-left: 20px; }
        ul li { margin: 8px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎓 Welcome to Project STAR!</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${name}</strong>,</p>
          <p>Your account has been successfully created for the Project STAR Safeguarding Training course.</p>
          <p>You can now log in and begin your training journey covering:</p>
          <ul>
            <li><strong>Child Protection Fundamentals</strong> - Understanding safeguarding principles</li>
            <li><strong>Digital Safety</strong> - Protecting children in the digital age</li>
            <li><strong>Reporting Procedures</strong> - How to report concerns properly</li>
            <li><strong>Safeguarding Governance</strong> - Policies and responsibilities</li>
          </ul>
          <p style="text-align: center;">
            <a href="${SITE_URL}" class="button">Start Training →</a>
          </p>
          <p><strong>Important:</strong> Keep your password secure and do not share your account credentials with anyone. If you ever forget your password, you can reset it using the "Forgot Password" link on the login page.</p>
        </div>
        <div class="footer">
          <p><strong>Project STAR Safeguarding Training</strong><br>
          Lagelu Grammar School, Oyo State, Nigeria<br>
          Building tomorrow's leaders today</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hi ${name},

Your account has been successfully created for the Project STAR Safeguarding Training course.

You can now log in and begin your training journey covering:
- Child Protection Fundamentals
- Digital Safety
- Reporting Procedures
- Safeguarding Governance

Visit: ${SITE_URL}

Important: Keep your password secure and do not share your account credentials with anyone.

---
Project STAR Safeguarding Training
Lagelu Grammar School, Oyo State, Nigeria
Building tomorrow's leaders today
  `;

  try {
    const request = mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: FROM_EMAIL,
            Name: FROM_NAME
          },
          To: [
            {
              Email: email,
              Name: name
            }
          ],
          Subject: 'Welcome to Project STAR Safeguarding Training',
          TextPart: text,
          HTMLPart: html
        }
      ]
    });

    const result = await request;
    console.log('[Email] Welcome email sent to:', email, 'MessageID:', result.body.Messages[0].Status);
    return { success: true, id: result.body.Messages[0].To[0].MessageID };
  } catch (error) {
    console.error('[Email] Failed to send welcome email:', error.statusCode, error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { sendPasswordResetEmail, sendWelcomeEmail };
