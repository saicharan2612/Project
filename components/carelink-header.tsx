import Link from 'next/link'
import { Activity, ArrowRight } from 'lucide-react'

export function CareLinkHeader() {
  return (
    <header className="border-b border-[var(--care-border)] bg-[var(--care-surface)]/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="CareLink home">
          <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--care-primary)] text-white">
            <Activity aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-[var(--care-ink)]">CareLink</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm" aria-label="Main navigation">
          <Link href="/sign-in" className="hidden rounded-lg px-3 py-2 font-medium text-[var(--care-muted)] transition hover:bg-[var(--care-highlight)] hover:text-[var(--care-ink)] sm:inline-flex">Sign in</Link>
          <Link href="/sign-up" className="inline-flex items-center gap-2 rounded-lg bg-[var(--care-primary)] px-4 py-2.5 font-medium text-white transition hover:bg-[var(--care-primary-dark)]">Create account <ArrowRight aria-hidden="true" size={16} /></Link>
        </nav>
      </div>
    </header>
  )
}

export function CareLinkFooter() {
  return <footer className="border-t border-[var(--care-border)] bg-[var(--care-surface)]"><div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-7 text-sm text-[var(--care-muted)] sm:flex-row sm:items-center sm:justify-between lg:px-8"><p>© 2026 CareLink. Connected care, thoughtfully designed.</p><p>Authentication foundation · Hospital operations coming soon</p></div></footer>
}

export function AuthShell({ children, title, eyebrow }: { children: React.ReactNode; title: string; eyebrow: string }) {
  return <main className="min-h-screen bg-[var(--care-bg)]"><div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 lg:px-8"><div className="mb-10"><Link href="/" className="inline-flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-[var(--care-primary)] text-white"><Activity aria-hidden="true" /></span><span className="font-semibold tracking-tight text-[var(--care-ink)]">CareLink</span></Link></div><div className="grid flex-1 items-center gap-12 pb-12 lg:grid-cols-[.8fr_1fr] lg:gap-24"><div className="max-w-md"><p className="mb-4 text-sm font-semibold uppercase tracking-[.18em] text-[var(--care-primary)]">{eyebrow}</p><h1 className="text-4xl font-semibold tracking-tight text-[var(--care-ink)] sm:text-5xl">{title}</h1><p className="mt-5 text-base leading-7 text-[var(--care-muted)]">Secure access to your CareLink account. Your role is determined by your account after authentication.</p></div><div className="w-full max-w-lg justify-self-center">{children}</div></div></div></main>
}

export function StatusMessage({ children, tone = 'info' }: { children: React.ReactNode; tone?: 'info' | 'error' }) {
  return <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm leading-6 ${tone === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-[var(--care-border)] bg-[var(--care-highlight)] text-[var(--care-ink)]'}`}>{children}</div>
}

export function PasswordField({ id, label, value, onChange, show, onToggle, placeholder = 'Enter your password' }: { id: string; label: string; value: string; onChange: (value: string) => void; show: boolean; onToggle: () => void; placeholder?: string }) {
  return <label htmlFor={id} className="grid gap-2 text-sm font-medium text-[var(--care-ink)]"><span>{label}</span><span className="relative"><input id={id} type={show ? 'text' : 'password'} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-12 w-full rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-4 pr-16 text-base text-[var(--care-ink)] outline-none transition placeholder:text-[var(--care-muted)] focus:border-[var(--care-primary)] focus:ring-4 focus:ring-[var(--care-highlight)]" required /><button type="button" onClick={onToggle} className="absolute inset-y-0 right-3 px-2 text-xs font-semibold text-[var(--care-muted)] hover:text-[var(--care-ink)]" aria-label={show ? 'Hide password' : 'Show password'}>{show ? 'Hide' : 'Show'}</button></span></label>
}

export function AuthCard({ children }: { children: React.ReactNode }) { return <section className="rounded-2xl border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-[0_16px_50px_rgba(53,65,61,0.07)] sm:p-8">{children}</section> }

export function PrimaryButton({ children, disabled = false }: { children: React.ReactNode; disabled?: boolean }) { return <button disabled={disabled} className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[var(--care-primary)] px-5 font-semibold text-white transition hover:bg-[var(--care-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60">{children}</button> }

export function TextInput({ id, label, type = 'text', value, onChange, placeholder }: { id: string; label: string; type?: string; value: string; onChange: (value: string) => void; placeholder?: string }) { return <label htmlFor={id} className="grid gap-2 text-sm font-medium text-[var(--care-ink)]"><span>{label}</span><input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-12 rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-4 text-base text-[var(--care-ink)] outline-none transition placeholder:text-[var(--care-muted)] focus:border-[var(--care-primary)] focus:ring-4 focus:ring-[var(--care-highlight)]" required /></label> }

export const roles = [{ label: 'Admin', path: '/admin' }, { label: 'Doctor', path: '/doctor' }, { label: 'Nurse', path: '/nurse' }, { label: 'Medicine Staff', path: '/medical-staff' }, { label: 'Billing Staff', path: '/billing' }, { label: 'Receptionist', path: '/receptionist' }, { label: 'Patient / User', path: '/patient' }]

export function SignOutButton() { return <Link href="/" className="inline-flex rounded-xl border border-[var(--care-border)] px-4 py-2.5 text-sm font-semibold text-[var(--care-ink)] transition hover:bg-[var(--care-highlight)]">Return home</Link> }
