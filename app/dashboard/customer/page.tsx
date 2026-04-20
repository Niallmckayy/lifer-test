import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getCustomerOverviewData } from '@/lib/actions'

const statusStyle: Record<string, { bg: string; color: string; dot: string }> = {
  PENDING:  { bg: 'rgba(245,232,208,0.06)', color: 'rgba(245,232,208,0.5)', dot: '#7a8585' },
  DRAFT:    { bg: 'rgba(212,131,12,0.12)',  color: '#e8a020',               dot: '#d4830c' },
  APPROVED: { bg: 'rgba(77,158,58,0.12)',   color: '#6dbf56',               dot: '#4d9e3a' },
  DEPLOYED: { bg: 'rgba(77,158,58,0.18)',   color: '#6dbf56',               dot: '#4d9e3a' },
  DENIED:   { bg: 'rgba(192,57,27,0.12)',   color: '#e05a3a',               dot: '#c0391b' },
}

function StatusBadge({ status }: { status: string }) {
  const s = statusStyle[status] ?? statusStyle.PENDING
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 capitalize"
      style={{ background: s.bg, color: s.color, borderRadius: '999px' }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
      {status.toLowerCase()}
    </span>
  )
}

export default async function CustomerOverviewPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const data = await getCustomerOverviewData(session.user.id)
  if (!data) redirect('/login')

  const { client, website, recentRequests, monthlyUsage } = data
  const pct = Math.min((monthlyUsage / client.requestLimit) * 100, 100)
  const atLimit = monthlyUsage >= client.requestLimit
  const nearLimit = pct >= 90

  const hasDraft = !!(website?.draftVersionId || website?.draftHtmlContent)

  return (
    <div className="flex-1 overflow-auto px-8 py-8" style={{ background: '#0e0b07' }}>
      <div className="max-w-3xl mx-auto flex flex-col gap-6">

        {/* ── Welcome bar ─────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#f5e8d0' }}
            >
              Welcome back, {client.name}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(245,232,208,0.35)' }}>
              Here&apos;s an overview of your account.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-semibold px-3 py-1"
              style={{ background: 'rgba(212,131,12,0.12)', color: '#e8a020', borderRadius: '999px' }}
            >
              {client.plan}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#6dbf56' }}>
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: '#4d9e3a', boxShadow: '0 0 6px rgba(77,158,58,0.5)' }} />
              {client.status}
            </span>
          </div>
        </div>

        {/* ── Project card ────────────────────────────────── */}
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{
            background: 'rgba(245,232,208,0.03)',
            borderRadius: '16px',
            border: '1px solid rgba(245,232,208,0.07)',
          }}
        >
          {website ? (
            <>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <span className="text-base font-semibold" style={{ color: '#f5e8d0', fontFamily: "'Playfair Display', Georgia, serif" }}>
                    {website.name}
                  </span>
                  {hasDraft && (
                    <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#e8a020' }}>
                      <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#d4830c' }} />
                      draft pending
                    </span>
                  )}
                </div>
                <span className="text-xs font-mono" style={{ color: 'rgba(245,232,208,0.3)' }}>
                  {website.previewUrl ?? `lifer.app/sites/${website.slug}`}
                </span>
              </div>
              <Link
                href="/dashboard/customer/project"
                className="text-sm font-semibold px-5 py-2.5 transition-all hover:opacity-90"
                style={{ background: '#d4830c', borderRadius: '999px', color: '#fff' }}
              >
                Open Editor →
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(212,131,12,0.1)' }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="#d4830c" strokeWidth="1.25" strokeDasharray="2 2" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: '#f5e8d0' }}>Your site is being set up</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(245,232,208,0.35)' }}>We&apos;ll be in touch shortly.</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Quota bar ───────────────────────────────────── */}
        <div
          className="px-6 py-5 flex flex-col gap-3"
          style={{
            background: 'rgba(245,232,208,0.03)',
            borderRadius: '16px',
            border: `1px solid ${nearLimit ? 'rgba(192,57,27,0.25)' : 'rgba(245,232,208,0.07)'}`,
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(245,232,208,0.3)' }}>
              Requests this month
            </span>
            <span
              className="text-xs tabular-nums font-semibold"
              style={{ color: atLimit ? '#e05a3a' : nearLimit ? '#e8a020' : 'rgba(245,232,208,0.5)' }}
            >
              {monthlyUsage} / {client.requestLimit}
            </span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(245,232,208,0.08)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background: atLimit
                  ? 'linear-gradient(90deg, #c0391b, #e05a3a)'
                  : nearLimit
                    ? 'linear-gradient(90deg, #e8a020, #f5b942)'
                    : 'linear-gradient(90deg, #d4830c, #e8a020)',
              }}
            />
          </div>
          {atLimit && (
            <p className="text-xs" style={{ color: '#e05a3a' }}>
              You&apos;ve reached your monthly limit.{' '}
              <Link href="/dashboard/customer/billing" style={{ color: '#e05a3a', textDecoration: 'underline' }}>
                Upgrade your plan
              </Link>
            </p>
          )}
        </div>

        {/* ── Recent requests ─────────────────────────────── */}
        <div
          style={{
            background: 'rgba(245,232,208,0.03)',
            borderRadius: '16px',
            border: '1px solid rgba(245,232,208,0.07)',
            overflow: 'hidden',
          }}
        >
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: '1px solid rgba(245,232,208,0.06)' }}
          >
            <span className="text-sm font-semibold" style={{ color: '#f5e8d0' }}>Recent requests</span>
            {website && (
              <Link
                href="/dashboard/customer/project"
                className="text-xs font-medium transition-opacity hover:opacity-70"
                style={{ color: '#d4830c' }}
              >
                View all →
              </Link>
            )}
          </div>

          {recentRequests.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-medium" style={{ color: 'rgba(245,232,208,0.3)' }}>No requests yet</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(245,232,208,0.2)' }}>
                Open the editor to submit your first change.
              </p>
            </div>
          ) : (
            <div>
              {recentRequests.map((req, i) => (
                <div
                  key={req.id}
                  className="flex items-center gap-4 px-6 py-3.5"
                  style={{ borderTop: i > 0 ? '1px solid rgba(245,232,208,0.04)' : undefined }}
                >
                  <span className="text-xs tabular-nums shrink-0" style={{ color: 'rgba(245,232,208,0.25)', minWidth: '52px' }}>
                    {new Date(req.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className="flex-1 text-sm truncate" style={{ color: 'rgba(245,232,208,0.6)' }}>
                    {req.message}
                  </span>
                  <StatusBadge status={req.status} />
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
