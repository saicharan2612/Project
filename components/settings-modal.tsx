'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { DemoAccount } from '@/lib/demo-accounts'
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LogOut,
  Settings,
  Shield,
  X
} from 'lucide-react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: DemoAccount
}

export function SettingsModal({ isOpen, onClose, currentUser }: SettingsModalProps) {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  if (!isOpen) return null

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!newPassword) {
      setError('Please enter a new password.')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      // 1. Update password in Supabase Auth
      const { error: authErr } = await supabase.auth.updateUser({ password: newPassword })

      if (authErr) {
        console.warn('Supabase Auth password update notice:', authErr.message)
      }

      // 2. Update password in carelink_staff_profiles table if row exists
      if (currentUser.id) {
        await supabase
          .from('carelink_staff_profiles')
          .update({ password: newPassword })
          .eq('id', currentUser.id)
      }

      setSuccess('Your password has been changed successfully!')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem('carelink_user')
    }
    onClose()
    router.push('/sign-in')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--care-border)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[var(--care-primary)]/10 text-[var(--care-primary)]">
              <Settings className="size-5" />
            </div>
            <div>
              <h3 className="font-bold text-[var(--care-ink)] text-base">Account Settings</h3>
              <p className="text-xs text-[var(--care-muted)]">Manage security preferences & session</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full text-[var(--care-muted)] hover:bg-[var(--care-highlight)] hover:text-[var(--care-ink)] transition"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* User Badge */}
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[var(--care-bg)] p-3 border border-[var(--care-border)]">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--care-primary)] text-sm font-bold text-white shadow-inner">
            {currentUser.avatarInitials || currentUser.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden text-xs">
            <p className="font-bold text-[var(--care-ink)] truncate">{currentUser.name}</p>
            <p className="text-[var(--care-muted)] truncate">{currentUser.email || currentUser.roleLabel}</p>
          </div>
          <span className="rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-800">
            {currentUser.roleLabel}
          </span>
        </div>

        {/* Change Password Form */}
        <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--care-ink)]">
            <KeyRound className="size-4 text-[var(--care-primary)]" />
            <span>Change Account Password</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--care-muted)] mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3 py-2 text-xs text-[var(--care-ink)] outline-none focus:border-[var(--care-primary)] focus:ring-1 focus:ring-[var(--care-primary)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-[var(--care-muted)] hover:text-[var(--care-ink)]"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--care-muted)] mb-1">
              Confirm New Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-bg)] px-3 py-2 text-xs text-[var(--care-ink)] outline-none focus:border-[var(--care-primary)] focus:ring-1 focus:ring-[var(--care-primary)]"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 p-2.5 text-xs font-medium text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-2.5 text-xs font-medium text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[var(--care-primary)] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[var(--care-primary-dark)] disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Shield className="size-4" />}
            {loading ? 'Updating Password...' : 'Save New Password'}
          </button>
        </form>

        {/* Divider */}
        <div className="my-5 border-t border-[var(--care-border)]" />

        {/* Log Out Button */}
        <button
          type="button"
          onClick={handleSignOut}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-red-700 transition hover:bg-red-100"
        >
          <LogOut className="size-4" />
          <span>Log Out of CareLink</span>
        </button>
      </div>
    </div>
  )
}
