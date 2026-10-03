import Link from 'next/link'
import { ArrowRight, Check, LockKeyhole, ShieldCheck, UsersRound, Sparkles } from 'lucide-react'
import { CareLinkFooter, CareLinkHeader } from '@/components/carelink-header'
import { DEMO_ACCOUNTS } from '@/lib/demo-accounts'

export default function Page() {
  return (
    <div className="min-h-screen bg-[var(--care-bg)]">
      <CareLinkHeader />
      <main>
        {/* Hero Section */}
        <section className="mx-auto grid max-w-6xl gap-12 px-5 pb-16 pt-16 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:px-8 lg:pb-20 lg:pt-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--care-border)] bg-[var(--care-surface)] px-3 py-1.5 text-sm font-medium text-[var(--care-primary)]">
              <span className="size-2 rounded-full bg-[var(--care-primary)]" /> Connected care foundation
            </div>
            <h1 className="max-w-2xl text-5xl font-semibold leading-[1.08] tracking-tight text-[var(--care-ink)] sm:text-6xl">
              A clearer connection to care.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--care-muted)]">
              CareLink is the trusted digital front door for a more connected hospital experience—designed to bring patients and care teams together securely.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--care-primary)] px-5 py-3.5 font-semibold text-white transition hover:bg-[var(--care-primary-dark)] shadow-sm"
              >
                Sign in with Demo Accounts <ArrowRight size={17} />
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center rounded-xl border border-[var(--care-border)] bg-[var(--care-surface)] px-5 py-3.5 font-semibold text-[var(--care-ink)] transition hover:bg-[var(--care-highlight)]"
              >
                Create patient account
              </Link>
            </div>
          </div>

          <div className="relative rounded-[2rem] border border-[var(--care-border)] bg-[var(--care-surface)] p-6 shadow-[0_20px_70px_rgba(53,65,61,0.09)] sm:p-8">
            <div className="absolute -right-3 -top-3 size-16 rounded-full bg-[var(--care-accent)]/40 blur-2xl" />
            <div className="relative">
              <div className="flex items-center justify-between border-b border-[var(--care-border)] pb-5">
                <div>
                  <p className="text-sm font-semibold text-[var(--care-ink)]">CareLink account</p>
                  <p className="mt-1 text-xs text-[var(--care-muted)]">A secure place to begin</p>
                </div>
                <ShieldCheck className="text-[var(--care-primary)]" aria-hidden="true" />
              </div>

              <div className="grid gap-3 py-6">
                <div className="flex items-start gap-3 rounded-xl bg-[var(--care-highlight)] p-4">
                  <LockKeyhole className="mt-0.5 text-[var(--care-primary)]" size={19} />
                  <div>
                    <p className="text-sm font-semibold text-[var(--care-ink)]">Privacy-first by design</p>
                    <p className="mt-1 text-sm leading-5 text-[var(--care-muted)]">
                      Account access is securely separated from future hospital workflows.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-[var(--care-border)] p-4">
                  <UsersRound className="mt-0.5 text-[var(--care-primary)]" size={19} />
                  <div>
                    <p className="text-sm font-semibold text-[var(--care-ink)]">One account, right access</p>
                    <p className="mt-1 text-sm leading-5 text-[var(--care-muted)]">
                      Your account role determines where you can go.
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs leading-5 text-[var(--care-muted)]">
                Includes pre-configured demo profiles for all 7 clinical and administrative roles.
              </p>
            </div>
          </div>
        </section>

        {/* Demo Roles Showcase Section */}
        <section className="border-t border-[var(--care-border)] bg-[var(--care-surface)] py-14">
          <div className="mx-auto max-w-6xl px-5 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--care-highlight)] px-3 py-1 text-xs font-semibold text-[var(--care-primary-dark)] mb-2">
                  <Sparkles className="size-3.5" /> 7 Pre-Configured Demo Roles
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-[var(--care-ink)] sm:text-3xl">
                  Explore CareLink by Role
                </h2>
                <p className="mt-1 text-sm text-[var(--care-muted)]">
                  Click on any role to immediately test its personalized dashboard and workflows.
                </p>
              </div>

              <Link
                href="/sign-in"
                className="text-sm font-semibold text-[var(--care-primary)] hover:underline inline-flex items-center gap-1 self-start md:self-auto"
              >
                Go to Sign-in & Credentials <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {DEMO_ACCOUNTS.map((account) => (
                <Link
                  key={account.id}
                  href={`/${account.roleSlug}`}
                  className="group flex flex-col justify-between rounded-2xl border border-[var(--care-border)] bg-[var(--care-bg)] p-5 transition hover:border-[var(--care-primary)] hover:bg-[var(--care-highlight)]/40 hover:shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--care-primary)] text-sm font-bold text-white shadow-sm">
                        {account.avatarInitials}
                      </span>
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${account.badgeColor}`}>
                        {account.roleLabel}
                      </span>
                    </div>

                    <h3 className="mt-3.5 font-bold text-[var(--care-ink)] text-sm group-hover:text-[var(--care-primary-dark)] transition">
                      {account.name}
                    </h3>
                    <p className="text-xs text-[var(--care-muted)] mt-0.5 line-clamp-1">
                      {account.title}
                    </p>
                    <p className="text-[11px] text-[var(--care-muted)] font-mono mt-2 truncate">
                      {account.email}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-[var(--care-border)] pt-3 text-xs font-semibold text-[var(--care-primary)]">
                    <span>Open Dashboard</span>
                    <ArrowRight className="size-3.5 transition group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="border-t border-[var(--care-border)] bg-[var(--care-bg)]">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-3 lg:px-8">
            <div>
              <Check className="mb-4 text-[var(--care-primary)]" />
              <h3 className="font-semibold text-[var(--care-ink)]">Built for trust</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--care-muted)]">
                A calm, accessible starting point for every CareLink user.
              </p>
            </div>
            <div>
              <Check className="mb-4 text-[var(--care-primary)]" />
              <h3 className="font-semibold text-[var(--care-ink)]">Clear access</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--care-muted)]">
                Role-aware authentication keeps account access intentional.
              </p>
            </div>
            <div>
              <Check className="mb-4 text-[var(--care-primary)]" />
              <h3 className="font-semibold text-[var(--care-ink)]">Ready to grow</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--care-muted)]">
                A focused foundation for future hospital experiences.
              </p>
            </div>
          </div>
        </section>
      </main>
      <CareLinkFooter />
    </div>
  )
}
