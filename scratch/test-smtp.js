const nodemailer = require('nodemailer');

async function testSmtp() {
  console.log('Testing SMTP connection with Gmail...');
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

  try {
    const verified = await transporter.verify();
    console.log('✅ SMTP Connection verified successfully:', verified);
    
    console.log('Sending test email to dullasaicharan2612@gmail.com...');
    const info = await transporter.sendMail({
      from: '"CareLink Health System" <dullasaicharan2612@gmail.com>',
      to: 'dullasaicharan2612@gmail.com',
      subject: 'CareLink — SMTP Configuration Successful',
      text: 'Congratulations! Your CareLink SMTP email service has been successfully configured and verified.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f0fdfa; border: 2px solid #0d9488; border-radius: 12px; max-width: 600px;">
          <h2 style="color: #0f766e; margin-top: 0;">CareLink SMTP Service Configured</h2>
          <p style="color: #334155; line-height: 1.6;">
            Your CareLink hospital management system is now connected to Gmail SMTP service (<strong>dullasaicharan2612@gmail.com</strong>).
          </p>
          <ul style="color: #475569; font-size: 14px;">
            <li><strong>SMTP Host:</strong> smtp.gmail.com</li>
            <li><strong>Port:</strong> 465 (SSL/TLS)</li>
            <li><strong>Sender:</strong> CareLink Health System</li>
            <li><strong>Status:</strong> Active & Verified</li>
          </ul>
          <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">Sent automatically by CareLink System Engine.</p>
        </div>
      `
    });

    console.log('✅ Test email sent successfully! MessageId:', info.messageId);
  } catch (error) {
    console.error('❌ SMTP verification or sending failed:', error);
  }
}

testSmtp();
