'use client'

import React, { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Loader2, MailCheck } from 'lucide-react'
import { AuthCard, AuthShell } from '@/components/carelink-header'
import { supabase, getStaffProfile, staffProfileToDemoAccount } from '@/lib/supabase'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'checking' | 'verified' | 'pending' | 'error'>('checking')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    async function checkSession() {
      // Supabase redirects back with tokens in the URL hash after email confirmation.
      // getSession() picks them up automatically.
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        setErrorMsg(error.message)
        setStatus('error')
        return
      }

      if (session?.user) {
        // User confirmed email — load profile and redirect
        const profile = await getStaffProfile(session.user.id)
        if (profile) {
          const account = staffProfileToDemoAccount(profile)
          if (typeof window !== 'undefined') {
            localStorage.setItem('carelink_user', JSON.stringify(account))
          }
          setStatus('verified')
          setTimeout(() => router.push(`/${account.roleSlug}`), 1500)
        } else {
          // Patient profile not seeded yet — redirect to patient dashboard
          // The admin will have created a profile via the admin panel
          setStatus('verified')
          setTimeout(() => router.push('/patient'), 1500)
        }
      } else {
        // No session yet — user hasn't clicked link
        setStatus('pending')
      }
    }

    checkSession()
  }, [])

  return (
    <AuthShell eyebrow="Account Security" title="Verify your email address.">
      <AuthCard>
        {status === 'checking' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="size-10 animate-spin text-[var(--care-primary)]" />
            <p className="text-sm font-semibold text-[var(--care-muted)]">Verifying your session…</p>
          </div>
        )}

        {status === 'pending' && (
          <div className="text-center py-4">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-teal-50 text-[var(--care-primary)]">
              <MailCheck className="size-7" />
            </div>
            <h2 className="text-xl font-bold text-[var(--care-ink)]">Check Your Email</h2>
            <p className="mt-2 text-sm text-[var(--care-muted)] leading-relaxed">
              We sent a verification link to your inbox. Click the link in the email to activate your account — then you can sign in.
            </p>
            <p className="mt-4 text-xs text-[var(--care-muted)]">
              Already verified?{' '}
              <Link href="/sign-in" className="font-semibold text-[var(--care-primary)] hover:underline">
                Sign in here
              </Link>
            </p>
            <div className="mt-6">
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--care-primary)] hover:underline"
              >
                <ArrowLeft className="size-3.5" /> Back to Sign In
              </Link>
            </div>
          </div>
        )}

        {status === 'verified' && (
          <div className="text-center py-4">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="size-8" />
            </div>
            <h3 className="text-xl font-bold text-[var(--care-ink)]">Email Successfully Verified!</h3>
            <p className="mt-2 text-sm text-[var(--care-muted)] leading-relaxed">
              Your account is now active. Redirecting you to your dashboard…
            </p>
            <div className="mt-4 flex justify-center">
              <Loader2 className="size-5 animate-spin text-[var(--care-primary)]" />
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-4">
            <h3 className="text-xl font-bold text-red-700">Verification Failed</h3>
            <p className="mt-2 text-sm text-[var(--care-muted)]">{errorMsg}</p>
            <Link
              href="/sign-up"
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[var(--care-primary)] font-semibold text-white shadow-md hover:bg-[var(--care-primary-dark)]"
            >
              Try Signing Up Again
            </Link>
          </div>
        )}
      </AuthCard>
    </AuthShell>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm font-semibold">Loading verification portal...</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
