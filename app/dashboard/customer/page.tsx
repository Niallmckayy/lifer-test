import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getCustomerOverviewData } from '@/lib/actions'

const FG       = '#f5e8d0'
const FG2      = 'rgba(245,232,208,0.45)'
const FG3      = 'rgba(245,232,208,0.2)'
const ACCENT   = '#d4830c'
const SURFACE1 = 'rgba(245,232,208,0.03)'
const BORDER   = 'rgba(245,232,208,0.07)'
const BG       = '#0e0b07'

function StatCard({
  label, value, sub, href,
}: {
  label: string
  value: string | number
  sub?: string
  href: string
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex', flexDirection: 'column', gap: 4,
        padding: '20px 20px 18px',
        background: SURFACE1, border: `1px solid ${BORDER}`, borderRadius: 16,
        textDecoration: 'none',
        transition: 'border-color 0.15s',
      }}
    >
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: FG2 }}>
        {label}
      </p>
      <p style={{ fontSize: 28, fontWeight: 300, color: FG, lineHeight: 1, fontFamily: "'Playfair Display', Georgia, serif" }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 12, color: FG3 }}>{sub}</p>}
    </Link>
  )
}

function Sparkline({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1)
  const W = 280
  const H = 40
  const barW = Math.floor(W / data.length) - 2

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 40, display: 'block' }}>
      {data.map((d, i) => {
        const barH = Math.max((d.count / max) * H, d.count > 0 ? 3 : 0)
        const x = i * (W / data.length) + 1
        return (
          <rect
            key={d.date}
            x={x} y={H - barH} width={barW} height={barH}
            rx={2}
            fill={d.count > 0 ? ACCENT : 'rgba(245,232,208,0.06)'}
            opacity={d.count > 0 ? 0.85 : 1}
          />
        )
      })}
    </svg>
  )
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatTime(d: Date) {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export default async function CustomerOverviewPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const data = await getCustomerOverviewData(session.user.id)
  if (!data) redirect('/login')

  const { client, website, upcomingBookings, uniqueVisitors, dailyVisits } = data
  const hasTraffic = uniqueVisitors > 0 || dailyVisits.some(d => d.count > 0)
  const contentUpdatedAt = website?.siteContent?.updatedAt

  return (
    <div className="flex-1 overflow-auto" style={{ background: BG }}>
      <div className="px-4 py-6 md:px-8 md:py-10" style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Welcome ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: FG, fontFamily: "'Playfair Display', Georgia, serif", marginBottom: 4 }}>
              Welcome back, {client.name}
            </h1>
            <p style={{ fontSize: 13, color: FG2 }}>Here&apos;s what&apos;s happening with your site.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', background: 'rgba(212,131,12,0.12)', color: '#e8a020', borderRadius: 999 }}>
              {client.plan}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: '#6dbf56' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4d9e3a', boxShadow: '0 0 6px rgba(77,158,58,0.5)', display: 'inline-block' }} />
              {client.status}
            </span>
          </div>
        </div>

        {/* ── Site card ───────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" style={{ background: SURFACE1, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '20px 24px' }}>
          {website ? (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: FG, fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {website.name}
                </p>
                <p style={{ fontSize: 12, fontFamily: 'monospace', color: FG3 }}>
                  {website.previewUrl ?? `lifer.app/sites/${website.slug}`}
                </p>
              </div>
              <a
                href={website.previewUrl ?? `https://lifer.app/sites/${website.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 13, fontWeight: 600, padding: '8px 20px', background: ACCENT, color: '#fff', borderRadius: 999, textDecoration: 'none' }}
              >
                Visit site →
              </a>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(212,131,12,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke={ACCENT} strokeWidth="1.25" strokeDasharray="2 2" />
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: FG }}>Your site is being set up</p>
                <p style={{ fontSize: 12, color: FG3, marginTop: 2 }}>We&apos;ll be in touch shortly.</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Quick stats ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard
            label="Visitors this week"
            value={uniqueVisitors}
            sub="unique sessions"
            href="/dashboard/customer/analytics"
          />
          <StatCard
            label="Upcoming bookings"
            value={upcomingBookings.length}
            sub={upcomingBookings.length === 1 ? 'session confirmed' : 'sessions confirmed'}
            href="/dashboard/customer/bookings"
          />
          <StatCard
            label="Content last updated"
            value={contentUpdatedAt ? contentUpdatedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}
            sub={contentUpdatedAt ? contentUpdatedAt.toLocaleDateString('en-GB', { year: 'numeric' }) : 'Not yet configured'}
            href="/dashboard/customer/content"
          />
        </div>

        {/* ── Upcoming bookings ───────────────────────────────── */}
        <div style={{ background: SURFACE1, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: FG }}>Upcoming bookings</p>
            <Link href="/dashboard/customer/bookings" style={{ fontSize: 12, color: ACCENT, textDecoration: 'none' }}>
              View all →
            </Link>
          </div>
          {upcomingBookings.length === 0 ? (
            <div style={{ padding: '32px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: FG3 }}>No upcoming bookings</p>
            </div>
          ) : (
            <div>
              {upcomingBookings.map((booking, i) => (
                <div
                  key={booking.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px',
                    borderTop: i > 0 ? `1px solid rgba(245,232,208,0.04)` : undefined,
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 110 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: ACCENT }}>{formatDate(booking.startsAt)}</p>
                    <p style={{ fontSize: 11, color: FG3 }}>{formatTime(booking.startsAt)}</p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, color: FG }}>{booking.customerName}</p>
                    <p style={{ fontSize: 12, color: FG3, marginTop: 1 }}>{booking.resource.name}</p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', background: 'rgba(77,158,58,0.12)', color: '#6dbf56', borderRadius: 999 }}>
                    Confirmed
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Traffic sparkline ───────────────────────────────── */}
        {hasTraffic && (
          <div style={{ background: SURFACE1, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: FG, marginBottom: 4 }}>Traffic this week</p>
                <p style={{ fontSize: 12, color: FG3 }}>{uniqueVisitors} unique visitor{uniqueVisitors !== 1 ? 's' : ''}</p>
              </div>
              <Link href="/dashboard/customer/analytics" style={{ fontSize: 12, color: ACCENT, textDecoration: 'none' }}>
                Full analytics →
              </Link>
            </div>
            <Sparkline data={dailyVisits} />
          </div>
        )}

      </div>
    </div>
  )
}
