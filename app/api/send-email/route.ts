import { NextRequest, NextResponse } from 'next/server'
import {
  sendEmail,
  generateVerificationOtpEmail,
  generatePasswordResetEmail,
  generateAppointmentEmail,
  generatePrescriptionReadyEmail,
  verifySmtpConnection
} from '@/lib/mailer'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, to, subject, name, otpCode, resetCode, resetLink, appointmentData, prescriptionData, customHtml, customText } = body

    if (!to) {
      return NextResponse.json({ success: false, error: 'Recipient email ("to") is required.' }, { status: 400 })
    }

    let emailSubject = subject || 'CareLink Hospital System Notification'
    let emailHtml = ''
    let emailText = ''

    switch (type) {
      case 'verification': {
        const code = otpCode || Math.floor(100000 + Math.random() * 900000).toString()
        const origin = req.nextUrl?.origin || (req.headers.get('origin') || 'http://localhost:3000')
        const link = body.verifyLink || `${origin}/verify-email?email=${encodeURIComponent(to)}&code=${code}`
        emailSubject = subject || 'CareLink — Verify Your Email Address'
        emailHtml = generateVerificationOtpEmail(name || 'CareLink User', code, link)
        emailText = `Welcome to CareLink! Verify your email address by clicking here: ${link}\nOr enter verification code: ${code}`
        break
      }

      case 'password_reset': {
        const code = resetCode || Math.floor(100000 + Math.random() * 900000).toString()
        emailSubject = subject || 'CareLink — Password Reset Code'
        emailHtml = generatePasswordResetEmail(name || 'CareLink User', code, resetLink)
        emailText = `Your CareLink password reset code is: ${code}.`
        break
      }

      case 'appointment': {
        emailSubject = subject || `CareLink — Appointment Notification (${appointmentData?.status || 'Scheduled'})`
        emailHtml = generateAppointmentEmail({
          patientName: appointmentData?.patientName || name || 'Patient',
          doctorName: appointmentData?.doctorName || 'Attending Physician',
          date: appointmentData?.date || 'Scheduled Date',
          time: appointmentData?.time || 'Scheduled Time',
          status: appointmentData?.status || 'Approved',
          notes: appointmentData?.notes,
          department: appointmentData?.department
        })
        emailText = `CareLink Appointment Notification: Your appointment with ${appointmentData?.doctorName} on ${appointmentData?.date} at ${appointmentData?.time} is ${appointmentData?.status}.`
        break
      }

      case 'prescription': {
        emailSubject = subject || 'CareLink — Your Medications Are Ready for Collection'
        emailHtml = generatePrescriptionReadyEmail({
          patientName: prescriptionData?.patientName || name || 'Patient',
          nurseName: prescriptionData?.nurseName,
          medicines: prescriptionData?.medicines || []
        })
        emailText = `CareLink Pharmacy: Your prescribed medicines are prepared and ready for collection at the dispensary counter.`
        break
      }

      case 'custom':
      default: {
        emailSubject = subject || 'Notification from CareLink'
        emailHtml = customHtml || `<p>${customText || 'Notification from CareLink Hospital System'}</p>`
        emailText = customText || subject || 'CareLink Notification'
        break
      }
    }

    const result = await sendEmail({
      to,
      subject: emailSubject,
      html: emailHtml,
      text: emailText
    })

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: `Email dispatched successfully via SMTP to ${to}`
    })
  } catch (error: any) {
    console.error('[SMTP Send Error]:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send email via SMTP',
        code: error.code || 'SMTP_ERROR'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    await verifySmtpConnection()
    return NextResponse.json({
      success: true,
      status: 'SMTP server is connected and ready.',
      host: 'smtp.gmail.com',
      port: 465,
      authEmail: 'dullasaicharan2612@gmail.com'
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        status: 'SMTP connection verification failed.',
        error: error.message || error
      },
      { status: 500 }
    )
  }
}
