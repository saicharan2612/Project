import nodemailer from 'nodemailer'

export interface SmtpConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
  from: {
    name: string
    address: string
  }
}

export function getSmtpConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = Number(process.env.SMTP_PORT) || 465
  const secure = process.env.SMTP_SECURE === 'false' ? false : true
  const user = process.env.SMTP_USER || 'dullasaicharan2612@gmail.com'
  const pass = (process.env.SMTP_PASS || 'qlfmtwtvggumlvfc').replace(/\s+/g, '')
  const fromName = process.env.SMTP_FROM_NAME || 'CareLink Health System'
  const fromEmail = process.env.SMTP_FROM_EMAIL || 'dullasaicharan2612@gmail.com'

  return {
    host,
    port,
    secure,
    auth: {
      user,
      pass
    },
    from: {
      name: fromName,
      address: fromEmail
    }
  }
}

export function createTransporter() {
  const config = getSmtpConfig()
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.auth.user,
      pass: config.auth.pass
    },
    tls: {
      rejectUnauthorized: false
    }
  })
}

export interface SendEmailOptions {
  to: string
  subject: string
  text?: string
  html?: string
}

export async function sendEmail(options: SendEmailOptions) {
  const config = getSmtpConfig()
  const transporter = createTransporter()

  const mailOptions = {
    from: `"${config.from.name}" <${config.from.address}>`,
    to: options.to,
    subject: options.subject,
    text: options.text || options.subject,
    html: options.html || `<p>${options.text || options.subject}</p>`
  }

  const info = await transporter.sendMail(mailOptions)
  return { success: true, messageId: info.messageId, response: info.response }
}

export async function verifySmtpConnection() {
  const transporter = createTransporter()
  return transporter.verify()
}

// ----------------------------------------------------
// PRE-BUILT HTML EMAIL TEMPLATES FOR CARELINK SYSTEM
// ----------------------------------------------------

function emailHeader(title: string, subtitle?: string): string {
  return `
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 24px; text-align: center; border-radius: 16px 16px 0 0;">
      <div style="display: inline-block; background: #0d9488; color: #ffffff; padding: 8px 16px; border-radius: 9999px; font-weight: 800; font-size: 13px; letter-spacing: 0.5px; margin-bottom: 12px; text-transform: uppercase;">
        CareLink Hospital System
      </div>
      <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 700;">
        ${title}
      </h1>
      ${subtitle ? `<p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 13px; font-family: sans-serif;">${subtitle}</p>` : ''}
    </div>
  `
}

function emailFooter(): string {
  return `
    <div style="padding: 24px; text-align: center; font-size: 11px; color: #64748b; font-family: sans-serif; border-top: 1px solid #e2e8f0; background: #f8fafc; border-radius: 0 0 16px 16px;">
      <p style="margin: 0 0 6px 0; font-weight: 600; color: #334155;">CareLink Health & Clinical Information System</p>
      <p style="margin: 0 0 6px 0;">Automated Dispatch Notification · Confidential & HIPAA/GDPR Compliant</p>
      <p style="margin: 0; color: #94a3b8;">Sent via secure SMTP server: dullasaicharan2612@gmail.com</p>
    </div>
  `
}

export function generateVerificationOtpEmail(name: string, otpCode: string, verifyLink?: string): string {
  return `
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      ${emailHeader('Verify Your Email Address', 'CareLink Account Activation')}
      <div style="padding: 32px 24px;">
        <p style="font-size: 15px; color: #1e293b; margin: 0 0 16px 0;">Hello <strong>${name || 'CareLink User'}</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
          Welcome to <strong>CareLink Hospital System</strong>! To complete your registration and activate your personal patient portal, please verify your email address.
        </p>

        ${verifyLink ? `
          <div style="text-align: center; margin: 28px 0 20px 0;">
            <a href="${verifyLink}" style="display: inline-block; background: #0d9488; color: #ffffff; padding: 14px 32px; font-weight: 700; font-size: 15px; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);">
              ✓ Click Here to Verify Email
            </a>
          </div>
          <p style="text-align: center; font-size: 12px; color: #64748b; margin: 0 0 24px 0;">
            Or copy and paste this verification link into your browser:<br/>
            <a href="${verifyLink}" style="color: #0f766e; word-break: break-all; font-size: 11px;">${verifyLink}</a>
          </p>
        ` : ''}

        <div style="text-align: center; margin: 24px 0; padding-top: 16px; border-top: 1px dashed #cbd5e1;">
          <p style="font-size: 12px; color: #475569; margin: 0 0 10px 0; font-weight: 600;">Or enter this 6-digit confirmation code on the verification screen:</p>
          <div style="display: inline-block; background: #f0fdfa; border: 2px dashed #0d9488; border-radius: 12px; padding: 14px 32px;">
            <span style="font-size: 30px; font-weight: 800; letter-spacing: 6px; color: #0f766e; font-family: 'Courier New', monospace;">
              ${otpCode}
            </span>
          </div>
          <p style="font-size: 11px; color: #64748b; margin-top: 8px;">This verification link and code expire in <strong>15 minutes</strong>.</p>
        </div>

        <div style="background: #f8fafc; border-left: 4px solid #0d9488; padding: 12px 16px; border-radius: 6px; margin: 24px 0 0 0;">
          <p style="margin: 0; font-size: 12px; color: #475569;">
            <strong>Security Notice:</strong> If you did not create a CareLink account, please ignore this email.
          </p>
        </div>
      </div>
      ${emailFooter()}
    </div>
  `
}

export function generatePasswordResetEmail(name: string, resetCode: string, resetLink?: string): string {
  return `
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      ${emailHeader('Password Reset Request', 'Secure Account Recovery')}
      <div style="padding: 32px 24px;">
        <p style="font-size: 15px; color: #1e293b; margin: 0 0 16px 0;">Hello <strong>${name || 'CareLink User'}</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">
          We received a request to reset your CareLink portal password. Use the secure authorization code below:
        </p>
        
        <div style="text-align: center; margin: 24px 0;">
          <div style="display: inline-block; background: #fef2f2; border: 2px dashed #dc2626; border-radius: 12px; padding: 16px 36px;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #b91c1c; font-family: 'Courier New', monospace;">
              ${resetCode}
            </span>
          </div>
          <p style="font-size: 12px; color: #64748b; margin-top: 8px;">Valid for <strong>20 minutes</strong>.</p>
        </div>

        ${resetLink ? `
          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetLink}" style="display: inline-block; background: #0d9488; color: #ffffff; padding: 12px 28px; font-weight: 700; font-size: 14px; text-decoration: none; border-radius: 10px;">
              Reset Password Now &rarr;
            </a>
          </div>
        ` : ''}

        <p style="font-size: 12px; color: #94a3b8; margin: 24px 0 0 0; text-align: center;">
          If you did not request a password reset, no action is needed; your current password remains secure.
        </p>
      </div>
      ${emailFooter()}
    </div>
  `
}

export function generateAppointmentEmail(params: {
  patientName: string
  doctorName: string
  date: string
  time: string
  status: string
  notes?: string
  department?: string
}): string {
  const isRescheduled = params.status.toLowerCase().includes('reschedule')
  const statusColor = isRescheduled ? '#d97706' : '#059669'
  const title = isRescheduled ? 'Appointment Rescheduled' : 'Appointment Confirmed'

  return `
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      ${emailHeader(title, 'Clinical Schedule Notification')}
      <div style="padding: 32px 24px;">
        <p style="font-size: 15px; color: #1e293b; margin: 0 0 16px 0;">Dear <strong>${params.patientName}</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
          Your consultation request with <strong>${params.doctorName}</strong> has been updated in our hospital scheduling system:
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <table style="width: 100%; font-size: 13px; color: #334155; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 140px;">Status:</td>
              <td style="padding: 6px 0; font-weight: 700; color: ${statusColor};">${params.status.toUpperCase()}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Consultant:</td>
              <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${params.doctorName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Department:</td>
              <td style="padding: 6px 0; font-weight: 600;">${params.department || 'Outpatient Department (OPD)'}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Date:</td>
              <td style="padding: 6px 0; font-weight: 700; color: #0d9488;">${params.date}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Time Slot:</td>
              <td style="padding: 6px 0; font-weight: 700; color: #0d9488;">${params.time}</td>
            </tr>
            ${params.notes ? `
              <tr>
                <td style="padding: 6px 0; color: #64748b; vertical-align: top;">Physician Note:</td>
                <td style="padding: 6px 0; font-style: italic; color: #475569;">"${params.notes}"</td>
              </tr>
            ` : ''}
          </table>
        </div>

        <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0;">
          Please arrive 10 minutes prior to your scheduled consultation. For inquiries or adjustments, access your CareLink patient portal.
        </p>
      </div>
      ${emailFooter()}
    </div>
  `
}

export function generatePrescriptionReadyEmail(params: {
  patientName: string
  nurseName?: string
  medicines: Array<{ name: string; dosage: string; frequency: string; durationDays: number; instructions?: string }>
}): string {
  return `
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      ${emailHeader('Medicines Ready for Collection', 'Pharmacy & Dispensary Notification')}
      <div style="padding: 32px 24px;">
        <p style="font-size: 15px; color: #1e293b; margin: 0 0 16px 0;">Dear <strong>${params.patientName}</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
          Your prescribed medications have been prepared and verified by our pharmacy and medicine staff. Your order is now <strong>ready for collection</strong> at the Central Hospital Dispensary.
        </p>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
          <h4 style="margin: 0 0 12px 0; font-size: 13px; color: #0f172a; font-weight: 700; text-transform: uppercase;">
            Prescribed Items & Timetable
          </h4>
          <table style="width: 100%; font-size: 12px; color: #334155; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid #cbd5e1; text-align: left; color: #64748b;">
                <th style="padding: 6px 4px;">Medicine</th>
                <th style="padding: 6px 4px;">Dosage</th>
                <th style="padding: 6px 4px;">Frequency</th>
                <th style="padding: 6px 4px;">Duration</th>
              </tr>
            </thead>
            <tbody>
              ${params.medicines.map(m => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 8px 4px; font-weight: 700; color: #0f766e;">${m.name}</td>
                  <td style="padding: 8px 4px;">${m.dosage}</td>
                  <td style="padding: 8px 4px;">${m.frequency}</td>
                  <td style="padding: 8px 4px;">${m.durationDays} days</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 12px; color: #065f46; font-weight: 600;">
            ✓ Bill Settled & Cleared with Patient Financial Services.
          </p>
        </div>

        <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0;">
          Please bring your Patient ID or MRN when collecting from Counter 3.
        </p>
      </div>
      ${emailFooter()}
    </div>
  `
}
