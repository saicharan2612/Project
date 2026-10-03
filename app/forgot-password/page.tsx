'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, Mail, ShieldCheck } from 'lucide-react'
import { AuthShell, AuthCard, StatusMessage } from '@/components/carelink-header'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'request' | 'verify' | 'done'>('request')
  const [loading, setLoading] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')
  const [enteredCode, setEnteredCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null)

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setStatusMsg({ text: 'Please enter your registered email address.', type: 'error' })
      return
    }

    setLoading(true)
    setStatusMsg(null)
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedCode(code)

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'password_reset',
          to: email.trim(),
          resetCode: code
        })
      })

      const data = await res.json()
      if (data.success) {
        setStep('verify')
        setStatusMsg({
          text: `A 6-digit password reset code was successfully sent to ${email} via SMTP.`,
          type: 'success'
        })
      } else {
        setStatusMsg({
          text: data.error || 'Failed to dispatch email via SMTP server.',
          type: 'error'
        })
      }
    } catch (err: any) {
      setStatusMsg({
        text: err.message || 'Network error while attempting to contact SMTP service.',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (enteredCode.trim() !== generatedCode.trim()) {
      setStatusMsg({ text: 'Invalid verification code. Please check your email inbox.', type: 'error' })
      return
    }
    if (newPassword.length < 8) {
      setStatusMsg({ text: 'Password must be at least 8 characters.', type: 'error' })
      return
    }
    if (newPassword !== confirmPassword) {
      setStatusMsg({ text: 'Passwords do not match.', type: 'error' })
      return
    }

    setStep('done')
    setStatusMsg({
      text: 'Your password has been successfully updated! You can now sign in.',
      type: 'success'
    })
  }

  return (
    <AuthShell eyebrow="Account Recovery" title="Reset your password securely.">
      <AuthCard>
        {step === 'request' && (
          <div>
            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-teal-50 text-[var(--care-primary)]">
              <KeyRound className="size-7" />
            </div>

            <p className="mb-6 text-center text-sm leading-6 text-[var(--care-muted)]">
              Enter your email address and our automated SMTP service will send a secure 6-digit recovery code directly to your inbox.
            </p>

            {statusMsg && (
              <div
                className={`mb-4 rounded-xl p-3 text-xs font-semibold ${
                  statusMsg.type === 'error'
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                {statusMsg.text}
              </div>
            )}

            <form onSubmit={handleSendResetEmail} className="grid gap-4">
              <label htmlFor="recovery-email" className="grid gap-1.5 text-xs font-bold text-[var(--care-ink)]">
                <span>Registered Email Address</span>
                <div className="relative flex items-center">
                  <input
                    id="recovery-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. patient@carelink.health or your email"
                    className="h-12 w-full rounded-xl border-2 border-slate-300 bg-[var(--care-surface)] pl-10 pr-4 text-xs font-bold text-[var(--care-ink)] outline-none transition focus:border-[var(--care-primary)] focus:ring-4 focus:ring-teal-100"
                    required
                  />
                  <Mail className="absolute left-3.5 size-4 text-[var(--care-muted)]" />
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--care-primary)] font-bold text-white shadow-md transition hover:bg-[var(--care-primary-dark)] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    Sending via SMTP...
                  </>
                ) : (
                  'Send Reset Code to Email'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-[var(--care-muted)]">
              <Link href="/sign-in" className="inline-flex items-center gap-1 font-bold text-[var(--care-primary)] hover:underline">
                <ArrowLeft className="size-3.5" /> Back to Sign In
              </Link>
            </p>
          </div>
        )}

        {step === 'verify' && (
          <div>
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <ShieldCheck className="size-7" />
            </div>

            <h3 className="text-center text-lg font-bold text-[var(--care-ink)]">Enter Verification Code</h3>
            <p className="mb-5 text-center text-xs text-[var(--care-muted)]">
              We sent a 6-digit code to <strong>{email}</strong> via SMTP server.
            </p>

            {statusMsg && (
              <div
                className={`mb-4 rounded-xl p-3 text-xs font-semibold ${
                  statusMsg.type === 'error'
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                {statusMsg.text}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="grid gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">6-Digit Code from Email</label>
                <input
                  type="text"
                  maxLength={6}
                  value={enteredCode}
                  onChange={(e) => setEnteredCode(e.target.value)}
                  placeholder="e.g. 123456"
                  className="h-12 w-full rounded-xl border-2 border-slate-300 bg-white text-center font-mono text-lg font-extrabold tracking-widest text-slate-900 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 font-bold text-slate-900 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="h-11 w-full rounded-xl border-2 border-slate-300 bg-white px-3 font-bold text-slate-900 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                  required
                />
              </div>

              <button
                type="submit"
                className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--care-primary)] font-bold text-white shadow-md transition hover:bg-[var(--care-primary-dark)]"
              >
                Update Password & Verify
              </button>

              <button
                type="button"
                onClick={() => setStep('request')}
                className="text-center text-xs text-[var(--care-muted)] hover:underline mt-1"
              >
                Didn't get the email? Try again or change address
              </button>
            </form>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center py-4">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="size-8" />
            </div>
            <h3 className="text-xl font-bold text-[var(--care-ink)]">Password Updated!</h3>
            <p className="mt-2 text-xs text-[var(--care-muted)] leading-relaxed">
              Your credentials have been securely updated. You can now log into your CareLink account.
            </p>
            <button
              type="button"
              onClick={() => router.push('/sign-in')}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--care-primary)] font-bold text-white shadow-md transition hover:bg-[var(--care-primary-dark)]"
            >
              Proceed to Sign In
            </button>
          </div>
        )}
      </AuthCard>
    </AuthShell>
  )
}
