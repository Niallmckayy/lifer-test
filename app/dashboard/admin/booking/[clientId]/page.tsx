import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getCalendarConnection } from '@/lib/actions'
import { prisma } from '@/lib/prisma'
import BookingResourceCard from './BookingResourceCard'
import BookingCalendarView from '@/app/dashboard/customer/bookings/BookingCalendarView'

const PROVIDER_LABELS: Record<string, string> = {
  google:  'Google Calendar',
  outlook: 'Outlook Calendar',
}

export default async function AdminBookingPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') redirect('/login')

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { name: true, website: { select: { slug: true } } },
  })
  if (!client) redirect('/dashboard/admin')

  const slug   = client.website?.slug ?? null
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  const startOfWindow = new Date()
  startOfWindow.setDate(1)
  startOfWindow.setHours(0, 0, 0, 0)

  const [resources, calendarBookings, calResult] = await Promise.all([
    prisma.bookingResource.findMany({
      where:   { clientId },
      include: { availability: { orderBy: { dayOfWeek: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.booking.findMany({
      where:   { clientId, startsAt: { gte: startOfWindow }, status: 'CONFIRMED' },
      include: { resource: { select: { name: true, timezone: true, color: true } } },
      orderBy: { startsAt: 'asc' },
      take:    200,
    }),
    getCalendarConnection(clientId),
  ])

  const calConn = ('connection' in calResult ? calResult.connection : null) ?? null

  const serialisedBookings = calendarBookings.map(b => ({
    id:            b.id,
    startsAt:      b.startsAt.toISOString(),
    endsAt:        b.endsAt.toISOString(),
    customerName:  b.customerName,
    customerEmail: b.customerEmail,
    customerPhone: b.customerPhone,
    notes:         b.notes,
    status:        b.status,
    resource: {
      name:     b.resource.name,
      timezone: b.resource.timezone,
      color:    b.resource.color,
    },
  }))

  return (
    <div className="min-h-screen" style={{ background: '#0e0b07' }}>
      <header
        className="flex items-center gap-4 px-6 py-3.5 sticky top-0 z-20"
        style={{ background: 'rgba(14,11,7,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(212,131,12,0.14)' }}
      >
        <Link href="/dashboard/admin" className="text-xs transition-opacity hover:opacity-70" style={{ color: 'rgba(255,255,255,0.35)' }}>
          ← Admin
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
        <span className="text-sm font-semibold text-white">{client.name} — Bookings</span>
        {slug && (
          <a
            href={`${appUrl}/book/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs transition-opacity hover:opacity-70"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            ↗ open in new tab
          </a>
        )}
      </header>

      {/* Two-column layout */}
      <div className="flex min-h-[calc(100vh-52px)]">

        {/* Left column: management */}
        <div className="flex-1 min-w-0 px-6 py-8 flex flex-col gap-10 overflow-y-auto" style={{ maxWidth: '700px' }}>

          {/* Bookings calendar */}
          <section>
            <h2 className="text-sm font-semibold text-white mb-5">Bookings</h2>
            <BookingCalendarView bookings={serialisedBookings} />
          </section>

          {/* Units */}
          <section>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-sm font-semibold text-white">Units</h2>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{resources.length} configured</span>
            </div>
            <div className="flex flex-col gap-4">
              {resources.length === 0 ? (
                <div
                  className="px-8 py-12 text-center"
                  style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <p className="text-sm text-white mb-1">No units yet</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Ask the client to set up their units from their dashboard.</p>
                </div>
              ) : (
                resources.map(r => (
                  <BookingResourceCard key={r.id} resource={r} />
                ))
              )}
            </div>
          </section>

          {/* Calendar sync status (read-only) */}
          <section>
            <h2 className="text-sm font-semibold text-white mb-3">Calendar sync</h2>
            <div
              className="px-4 py-3 rounded-xl flex items-center gap-3"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {calConn ? (
                <>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#6dbf56' }} />
                  <div>
                    <p className="text-xs font-medium text-white">
                      {PROVIDER_LABELS[calConn.provider] ?? calConn.provider} connected
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      Calendar: {calConn.calendarId}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }} />
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    No calendar connected — client can connect from their dashboard.
                  </p>
                </>
              )}
            </div>
          </section>

          {/* Embed code — admin only, collapsed */}
          {slug && (
            <section>
              <details className="group">
                <summary
                  className="flex items-center gap-2 cursor-pointer list-none text-xs font-medium select-none"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  <span className="transition-transform group-open:rotate-90 inline-block">›</span>
                  Embed code
                </summary>
                <div
                  className="mt-3 p-4 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Direct link</p>
                  <code className="block text-xs mb-4 px-3 py-2 rounded-lg select-all" style={{ background: 'rgba(0,0,0,0.3)', color: '#e8a020', wordBreak: 'break-all' }}>
                    {appUrl}/book/{slug}
                  </code>
                  <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Iframe embed</p>
                  <code className="block text-xs px-3 py-2 rounded-lg select-all" style={{ background: 'rgba(0,0,0,0.3)', color: '#e8a020', wordBreak: 'break-all' }}>
                    {`<iframe src="${appUrl}/book/${slug}" width="100%" height="700" frameborder="0"></iframe>`}
                  </code>
                </div>
              </details>
            </section>
          )}

        </div>

        {/* Right column: live booking preview */}
        <div
          className="shrink-0 px-6 py-8"
          style={{ width: '420px', borderLeft: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="sticky" style={{ top: '68px' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white">Live Preview</h2>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(77,158,58,0.12)', color: '#6dbf56' }}>
                test mode
              </span>
            </div>

            {slug ? (
              <div
                className="overflow-hidden"
                style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', height: 'calc(100vh - 120px)' }}
              >
                <iframe
                  src={`${appUrl}/book/${slug}`}
                  width="100%"
                  height="100%"
                  style={{ border: 'none', display: 'block' }}
                  title="Booking preview"
                />
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center gap-2"
                style={{ height: 'calc(100vh - 120px)', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <p className="text-sm text-white">No website assigned</p>
                <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.25)', maxWidth: '200px' }}>
                  This client needs a website with a slug before the booking page can be previewed.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
