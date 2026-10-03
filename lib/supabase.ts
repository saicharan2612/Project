import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Auth helpers ───────────────────────────────────────────────────────────

export async function signUpWithEmail(
  email: string,
  password: string,
  metadata: { name: string; role_slug: string; role_label: string }
) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/verify-email`
    }
  })
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function getCurrentSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser()
  return data.user
}

// ─── Staff profile helpers (carelink_staff_profiles table) ──────────────────

export interface StaffProfile {
  id: string              // matches auth.users.id
  role_slug: string
  role_label: string
  name: string
  title: string
  department: string
  specialization?: string
  email: string
  password?: string       // optional password field if table requires it
  badge: string
  badge_color: string
  avatar_initials: string
  summary: string
  permissions: string[]
  stats: { label: string; value: string; change?: string; tone?: string }[]
  recent_activities: { title: string; subtitle: string; time: string; status: string; statusColor: string }[]
  quick_actions: { label: string; description: string }[]
  created_at?: string
  mrn?: string
}

export async function getStaffProfile(userId: string, email?: string): Promise<StaffProfile | null> {
  const cleanId = userId ? userId.trim() : ''
  const cleanEmail = email ? email.trim().toLowerCase() : ''

  // 1. Try fetching by ID first if a valid userId is provided
  if (cleanId) {
    try {
      const { data: dataById } = await supabase
        .from('carelink_staff_profiles')
        .select('*')
        .eq('id', cleanId)
        .maybeSingle()

      if (dataById) return dataById as StaffProfile
    } catch (e) {
      // ignore invalid UUID format query errors
    }
  }

  // 2. Fallback: try fetching by email if provided
  if (cleanEmail) {
    try {
      const { data: dataByEmail } = await supabase
        .from('carelink_staff_profiles')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle()

      if (dataByEmail) return dataByEmail as StaffProfile
    } catch (e) {
      // ignore query errors
    }
  }

  return null
}

export async function upsertStaffProfile(profile: StaffProfile): Promise<StaffProfile | null> {
  const { data, error } = await supabase
    .from('carelink_staff_profiles')
    .upsert(profile, { onConflict: 'id' })
    .select()
    .single()
  if (error) console.error("Supabase profile upsert error:", error)
  if (!data) return null
  return data as StaffProfile
}

// ─── Convert StaffProfile → DemoAccount shape ────────────────────────────────

import type { DemoAccount } from './demo-accounts'

export function staffProfileToDemoAccount(profile: StaffProfile): DemoAccount {
  return {
    id: profile.id,
    roleSlug: profile.role_slug,
    roleLabel: profile.role_label,
    name: profile.name,
    title: profile.title,
    department: profile.department,
    specialization: profile.specialization,
    email: profile.email,
    password: profile.password || '',
    badge: profile.badge,
    badgeColor: profile.badge_color,
    avatarInitials: profile.avatar_initials,
    summary: profile.summary,
    permissions: profile.permissions ?? [],
    stats: profile.stats ?? [],
    recentActivities: profile.recent_activities ?? [],
    quickActions: profile.quick_actions ?? [],
    createdAt: profile.created_at,
    mrn: profile.mrn
  }
}

export function demoAccountToStaffProfile(account: DemoAccount, userId: string): StaffProfile {
  return {
    id: userId,
    role_slug: account.roleSlug,
    role_label: account.roleLabel,
    name: account.name,
    title: account.title,
    department: account.department,
    specialization: account.specialization,
    email: account.email,
    password: account.password || 'Password123!',
    badge: account.badge,
    badge_color: account.badgeColor,
    avatar_initials: account.avatarInitials,
    summary: account.summary,
    permissions: account.permissions,
    stats: account.stats,
    recent_activities: account.recentActivities,
    quick_actions: account.quickActions,
    mrn: account.mrn
  }
}
