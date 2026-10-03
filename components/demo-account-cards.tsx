'use client'

// Demo account cards have been removed.
// All authentication is now handled via Supabase Auth.
// This file is kept to avoid import errors in any remaining references.

import type { DemoAccount } from '@/lib/demo-accounts'

interface DemoAccountCardsProps {
  onSelectAccount?: (account: DemoAccount) => void
  showDirectLogin?: boolean
}

export function DemoAccountCards(_props: DemoAccountCardsProps) {
  return null
}

export function DemoAccountsSummaryTable() {
  return null
}
