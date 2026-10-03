const nodemailer = require('nodemailer');

async function testVerificationEmail() {
  console.log('Testing Verification Link & Code Email...');
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'dullasaicharan2612@gmail.com',
      pass: 'qlfmtwtvggumlvfc'
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const otpCode = '582914';
  const verifyLink = 'http://localhost:3000/verify-email?email=dullasaicharan2612%40gmail.com&code=' + otpCode;

  const html = `
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 24px; text-align: center; border-radius: 16px 16px 0 0;">
        <div style="display: inline-block; background: #0d9488; color: #ffffff; padding: 8px 16px; border-radius: 9999px; font-weight: 800; font-size: 13px; letter-spacing: 0.5px; margin-bottom: 12px; text-transform: uppercase;">
          CareLink Hospital System
        </div>
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">
          Verify Your Email Address
        </h1>
        <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 13px;">CareLink Account Activation</p>
      </div>

      <div style="padding: 32px 24px;">
        <p style="font-size: 15px; color: #1e293b; margin: 0 0 16px 0;">Hello <strong>Sai Charan</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
          Welcome to <strong>CareLink Hospital System</strong>! To complete your registration and activate your personal patient portal, please click the button below to verify your email.
        </p>

        <div style="text-align: center; margin: 28px 0 20px 0;">
          <a href="${verifyLink}" style="display: inline-block; background: #0d9488; color: #ffffff; padding: 14px 32px; font-weight: 700; font-size: 15px; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);">
            ✓ Click Here to Verify Email
          </a>
        </div>

        <p style="text-align: center; font-size: 12px; color: #64748b; margin: 0 0 24px 0;">
          Or copy and paste this verification link into your browser:<br/>
          <a href="${verifyLink}" style="color: #0f766e; word-break: break-all; font-size: 11px;">${verifyLink}</a>
        </p>

        <div style="text-align: center; margin: 24px 0; padding-top: 16px; border-top: 1px dashed #cbd5e1;">
          <p style="font-size: 12px; color: #475569; margin: 0 0 10px 0; font-weight: 600;">Or enter this 6-digit confirmation code on the verification screen:</p>
          <div style="display: inline-block; background: #f0fdfa; border: 2px dashed #0d9488; border-radius: 12px; padding: 14px 32px;">
            <span style="font-size: 30px; font-weight: 800; letter-spacing: 6px; color: #0f766e; font-family: 'Courier New', monospace;">
              ${otpCode}
            </span>
          </div>
          <p style="font-size: 11px; color: #64748b; margin-top: 8px;">This verification link and code expire in <strong>15 minutes</strong>.</p>
        </div>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: '"CareLink Health System" <dullasaicharan2612@gmail.com>',
      to: 'dullasaicharan2612@gmail.com',
      subject: 'CareLink — Verify Your Email Address & Activate Account',
      html: html
    });
    console.log('✅ Verification email sent successfully! MessageId:', info.messageId);
  } catch (err) {
    console.error('❌ Failed to send verification email:', err);
  }
}

testVerificationEmail();
