import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getWebsiteAnalytics } from '@/lib/analytics-actions'

const FG        = '#f5e8d0'
const FG2       = 'rgba(245,232,208,0.45)'
const FG3       = 'rgba(245,232,208,0.2)'
const ACCENT    = '#d4830c'
const SURFACE1  = 'rgba(245,232,208,0.03)'
const SURFACE2  = 'rgba(245,232,208,0.06)'
const BORDER    = 'rgba(245,232,208,0.07)'
const BG        = '#0e0b07'

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: SURFACE1, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '20px 20px 18px' }}>
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: FG2, marginBottom: 8 }}>
        {label}
      </p>
      <p style={{ fontSize: 28, fontWeight: 300, color: FG, lineHeight: 1, marginBottom: sub ? 4 : 0, fontFamily: "'Playfair Display', Georgia, serif" }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 12, color: FG3 }}>{sub}</p>}
    </div>
  )
}

function BarChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1)
  const W = 800
  const H = 120
  const BAR_W = Math.floor(W / data.length) - 2

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 120, display: 'block' }}>
      {data.map((d, i) => {
        const barH = Math.max((d.count / max) * (H - 20), d.count > 0 ? 3 : 0)
        const x = i * (W / data.length) + 1
        const y = H - barH
        return (
          <g key={d.date}>
            <rect
              x={x} y={y} width={BAR_W} height={barH}
              rx={2}
              fill={d.count > 0 ? ACCENT : SURFACE2}
              opacity={d.count > 0 ? 0.85 : 1}
            />
          </g>
        )
      })}
    </svg>
  )
}

function DayFilter({ current, websiteId }: { current: number; websiteId: string }) {
  const options = [7, 30, 90]
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {options.map(d => (
        <a
          key={d}
          href={`/dashboard/customer/analytics?days=${d}`}
          style={{
            padding: '4px 12px',
            fontSize: 12,
            borderRadius: 8,
            border: `1px solid ${d === current ? ACCENT : BORDER}`,
            background: d === current ? `rgba(212,131,12,0.12)` : 'transparent',
            color: d === current ? ACCENT : FG2,
            textDecoration: 'none',
            fontWeight: d === current ? 600 : 400,
          }}
        >
          {d}d
        </a>
      ))}
    </div>
  )
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { days: daysParam } = await searchParams
  const days = Math.min(Math.max(parseInt(daysParam ?? '30', 10) || 30, 7), 90)

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { client: { include: { website: true } } },
  })

  const website = user?.client?.website

  if (!website) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: BG }}>
        <p style={{ color: FG2, fontSize: 14 }}>No website found.</p>
      </div>
    )
  }

  const data = await getWebsiteAnalytics(website.id, days)

  const hasData = data.totalPageviews > 0

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: BG }}>
      <div className="px-4 py-6 md:px-8 md:py-10" style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: FG, fontFamily: "'Playfair Display', Georgia, serif", marginBottom: 4 }}>
              Analytics
            </h1>
            <p style={{ fontSize: 13, color: FG2 }}>{website.name}</p>
          </div>
          <DayFilter current={days} websiteId={website.id} />
        </div>

        {!hasData ? (
          <div style={{
            textAlign: 'center', padding: '80px 0',
            background: SURFACE1, borderRadius: 16, border: `1px solid ${BORDER}`,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'rgba(212,131,12,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M3 17L8 11L12 14L17 8M17 8h-4M17 8v4" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p style={{ color: FG, fontSize: 15, fontWeight: 600, marginBottom: 8, fontFamily: "'Playfair Display', Georgia, serif" }}>
              No data yet
            </p>
            <p style={{ color: FG2, fontSize: 13 }}>
              Traffic will appear here once visitors land on your site.
            </p>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" style={{ marginBottom: 12 }}>
              <StatCard label="Unique visitors"  value={data.totalVisits}                 sub={`last ${days} days`} />
              <StatCard label="Page views"       value={data.totalPageviews}              sub="total" />
              <StatCard label="Avg session"      value={formatDuration(data.avgDuration)} sub="time on site" />
              <StatCard label="Conversion rate"  value={`${data.bookingRate}%`}           sub={`${data.bookingCount} booking${data.bookingCount !== 1 ? 's' : ''} from ${data.totalVisits} visitors`} />
            </div>

            {/* Booking cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ marginBottom: 32 }}>
              <StatCard label="Bookings this period" value={data.bookingCount}       sub={`last ${days} days`} />
              <StatCard label="Upcoming bookings"    value={data.upcomingCount}      sub="next 30 days" />
              <StatCard label="Top service"          value={data.topResource ?? '—'} sub="most booked" />
            </div>

            {/* Daily chart */}
            <div style={{
              background: SURFACE1, border: `1px solid ${BORDER}`, borderRadius: 16,
              padding: '24px 24px 16px', marginBottom: 24,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: FG2 }}>
                  Daily visitors
                </p>
                <p style={{ fontSize: 12, color: FG3 }}>past {days} days</p>
              </div>
              <BarChart data={data.dailyVisits} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <p style={{ fontSize: 10, color: FG3 }}>{data.dailyVisits[0]?.date}</p>
                <p style={{ fontSize: 10, color: FG3 }}>{data.dailyVisits[data.dailyVisits.length - 1]?.date}</p>
              </div>
            </div>

            {/* Tables */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Top pages */}
              <div style={{ background: SURFACE1, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
                <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: FG2, marginBottom: 16 }}>
                  Top pages
                </p>
                {data.topPages.length === 0 ? (
                  <p style={{ fontSize: 13, color: FG3 }}>No data</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {data.topPages.map(({ page, count }) => (
                      <div key={page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <p style={{ fontSize: 13, color: FG, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                          {page || '/'}
                        </p>
                        <span style={{ fontSize: 12, color: ACCENT, fontWeight: 600, flexShrink: 0 }}>{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top referrers */}
              <div style={{ background: SURFACE1, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
                <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: FG2, marginBottom: 16 }}>
                  Top referrers
                </p>
                {data.topReferrers.length === 0 ? (
                  <p style={{ fontSize: 13, color: FG3 }}>No referrer data — most visitors came directly.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {data.topReferrers.map(({ referrer, count }) => {
                      let display = referrer
                      try { display = new URL(referrer).hostname } catch {}
                      return (
                        <div key={referrer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <p style={{ fontSize: 13, color: FG, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                            {display}
                          </p>
                          <span style={{ fontSize: 12, color: ACCENT, fontWeight: 600, flexShrink: 0 }}>{count}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
