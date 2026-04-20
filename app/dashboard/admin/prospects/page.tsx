import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getProspectsDashboardData } from '@/lib/prospect-actions'
import ProspectActions from './ProspectActions'
import SignOutButton from '@/components/ui/SignOutButton'
import BirdLogo from '@/components/ui/BirdLogo'

const prospectStatusStyle: Record<string, { bg: string; color: string; dot: string }> = {
  GENERATING: { bg: 'rgba(212,131,12,0.12)',   color: '#e8a020', dot: '#d4830c' },
  PREVIEW:    { bg: 'rgba(135,174,206,0.12)',   color: '#87aece', dot: '#87aece' },
  READY:      { bg: 'rgba(77,158,58,0.12)',     color: '#6dbf56', dot: '#4d9e3a' },
  ERROR:      { bg: 'rgba(192,57,27,0.12)',     color: '#e05a3a', dot: '#c0391b' },
  CONVERTED:  { bg: 'rgba(135,174,206,0.12)',   color: '#87aece', dot: '#87aece' },
  ARCHIVED:   { bg: 'rgba(245,232,208,0.04)',   color: 'rgba(245,232,208,0.25)', dot: '#7a8585' },
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider"
      style={{ color: 'rgba(245,232,208,0.25)', borderBottom: '1px solid rgba(245,232,208,0.06)' }}
    >
      {children}
    </th>
  )
}

function Tag({ label, style }: { label: string; style: { bg: string; color: string; dot?: string } }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 capitalize"
      style={{ background: style.bg, color: style.color, borderRadius: '999px' }}
    >
      {style.dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${label === 'GENERATING' ? 'animate-pulse' : ''}`}
          style={{ background: style.dot }}
        />
      )}
      {label.toLowerCase()}
    </span>
  )
}

function StatCard({ label, value, sub, accent = false }: { label: string; value: number | string; sub?: string; accent?: boolean }) {
  return (
    <div
      className="flex flex-col gap-1 px-5 py-5 relative overflow-hidden"
      style={{
        background: accent ? 'rgba(212,131,12,0.08)' : 'rgba(245,232,208,0.03)',
        borderRadius: '16px',
        border: accent ? '1px solid rgba(212,131,12,0.22)' : '1px solid rgba(245,232,208,0.07)',
      }}
    >
      {accent && (
        <div
          className="absolute top-0 right-0 w-24 h-24 pointer-events-none"
          style={{ background: 'radial-gradient(circle at top right, rgba(212,131,12,0.15), transparent 70%)' }}
        />
      )}
      <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</span>
      <span className="text-2xl font-bold tabular-nums" style={{ color: accent ? '#e8a020' : '#f5e8d0' }}>{value}</span>
      {sub && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{sub}</span>}
    </div>
  )
}

export default async function ProspectsPage() {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') redirect('/login')

  const { prospects, analytics } = await getProspectsDashboardData()

  return (
    <div className="min-h-screen" style={{ background: '#0e0b07' }}>

      {/* ── Header ── */}
      <header
        className="flex items-center justify-between px-6 py-3.5 sticky top-0 z-10"
        style={{
          background: 'rgba(14,11,7,0.92)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(212,131,12,0.14)',
        }}
      >
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5" style={{ color: '#d4830c' }}>
            <BirdLogo size={20} />
            <span className="text-sm font-semibold" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#f5e8d0' }}>
              Lifer
            </span>
          </Link>
          <span className="block w-px h-4" style={{ background: 'rgba(245,232,208,0.1)' }} />
          <Link
            href="/dashboard/admin"
            className="text-xs font-medium transition-opacity hover:opacity-70"
            style={{ color: 'rgba(245,232,208,0.3)' }}
          >
            Admin
          </Link>
          <span className="text-xs" style={{ color: 'rgba(245,232,208,0.15)' }}>/</span>
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(245,232,208,0.5)' }}>
            Prospects
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/admin/prospects/new"
            className="text-xs font-semibold px-4 py-2 transition-all hover:opacity-90"
            style={{ background: '#d4830c', borderRadius: '999px', color: '#fff' }}
          >
            + Generate New Site
          </Link>
          <SignOutButton
            className="text-xs font-medium transition-opacity hover:opacity-70"
            style={{ color: 'rgba(245,232,208,0.35)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">

        {/* ── Analytics ── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-4 px-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Overview
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Total"     value={analytics.total} />
            <StatCard label="Ready"     value={analytics.ready}     sub="awaiting outreach" accent />
            <StatCard label="Converted" value={analytics.converted} sub="became clients" />
            <StatCard label="This Month" value={analytics.thisMonth} sub="generated" />
          </div>
        </section>

        {/* ── Prospects table ── */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-sm font-semibold text-white">Prospect Sites</h2>
            <span
              className="text-xs font-semibold px-2.5 py-1"
              style={{ background: 'rgba(212,131,12,0.12)', color: '#e8a020', borderRadius: '999px' }}
            >
              {prospects.length}
            </span>
          </div>

          {prospects.length === 0 ? (
            <div
              className="px-8 py-20 text-center"
              style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <p className="text-sm font-medium mb-1 text-white">No prospects yet</p>
              <p className="text-xs mb-6" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Generate a website for a prospect to start the conversation
              </p>
              <Link
                href="/dashboard/admin/prospects/new"
                className="text-xs font-semibold px-4 py-2 inline-block transition-all hover:opacity-90"
                style={{ background: '#d4830c', borderRadius: '999px', color: '#fff' }}
              >
                + Generate New Site
              </Link>
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <Th>Business</Th>
                    <Th>Industry</Th>
                    <Th>Status</Th>
                    <Th>Live Site</Th>
                    <Th>Date</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {prospects.map((p, i) => (
                    <tr
                      key={p.id}
                      className="transition-colors hover:bg-white/2"
                      style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : undefined }}
                    >
                      <td className="px-5 py-4 font-medium text-white">
                        <div>{p.businessName}</div>
                        {p.prospectEmail && (
                          <div className="text-xs mt-0.5 font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
                            {p.prospectEmail}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {p.industry}
                      </td>
                      <td className="px-5 py-4">
                        <Tag
                          label={p.status}
                          style={prospectStatusStyle[p.status] ?? prospectStatusStyle.ARCHIVED}
                        />
                      </td>
                      <td className="px-5 py-4">
                        {p.htmlContent ? (
                          <div className="flex items-center gap-2">
                            <a
                              href={`/preview/prospects/${p.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium transition-opacity hover:opacity-70"
                              style={{ color: '#d4830c' }}
                            >
                              ↗ preview
                            </a>
                            {p.deploymentUrl && (
                              <a
                                href={p.deploymentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-medium transition-opacity hover:opacity-70"
                                style={{ color: '#4ade80' }}
                              >
                                ↗ live
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.15)' }}>—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs tabular-nums whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        {new Date(p.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-5 py-4">
                        <ProspectActions
                          prospectId={p.id}
                          status={p.status}
                          businessName={p.businessName}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </main>
    </div>
  )
}
