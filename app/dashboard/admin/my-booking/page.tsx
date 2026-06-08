import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getOrCreateAdminBookingProfile, getCalendarConnection } from '@/lib/actions'
import { prisma } from '@/lib/prisma'
import { parseTheme } from '@/lib/booking-theme'
import ResourceManager from '@/app/dashboard/customer/bookings/ResourceManager'
import CalendarConnect from '@/app/dashboard/customer/bookings/CalendarConnect'
import BookingCalendarView from '@/app/dashboard/customer/bookings/BookingCalendarView'
import BookingAppearance from '@/app/dashboard/customer/bookings/BookingAppearance'

export default async function AdminMyBookingPage() {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') redirect('/login')

  const profile = await getOrCreateAdminBookingProfile()
  if (profile.error) redirect('/dashboard/admin')

  const { clientId, slug } = profile
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  const startOfWindow = new Date()
  startOfWindow.setDate(1)
  startOfWindow.setHours(0, 0, 0, 0)

  const [resources, calendarBookings, calResult, clientData] = await Promise.all([
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
    prisma.client.findUnique({ where: { id: clientId }, select: { bookingTheme: true } }),
  ])

  const calendarConnection = ('connection' in calResult ? calResult.connection : null) ?? null
  const googleConfigured   = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  const outlookConfigured  = !!(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET)

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

  const savedTheme = parseTheme(clientData?.bookingTheme ?? '{}')

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
        <span className="text-sm font-semibold text-white">My Booking Page</span>
        <a
          href={`${appUrl}/book/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-xs transition-opacity hover:opacity-70"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          ↗ open in new tab
        </a>
      </header>

      {/* Two-column layout: management left, live preview right */}
      <div className="flex min-h-[calc(100vh-52px)]">

        {/* Left column */}
        <div className="flex-1 min-w-0 px-6 py-8 flex flex-col gap-10 overflow-y-auto" style={{ maxWidth: '700px' }}>

          {/* Bookings calendar */}
          <section>
            <h2 className="text-sm font-semibold text-white mb-5">Bookings</h2>
            <BookingCalendarView bookings={serialisedBookings} />
          </section>

          {/* Booking units */}
          <section>
            <div className="mb-5">
              <h2 className="text-sm font-semibold text-white">Booking Units</h2>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Configure the units people can book with you.
              </p>
            </div>
            <ResourceManager
              clientId={clientId}
              resources={resources.map(r => ({
                id:            r.id,
                name:          r.name,
                description:   r.description,
                slotDuration:  r.slotDuration,
                bufferTime:    r.bufferTime,
                maxCapacity:   r.maxCapacity,
                timezone:      r.timezone,
                color:         r.color,
                meetingType:   r.meetingType,
                location:      r.location,
                sendReminders: r.sendReminders,
                sendFollowUp:  r.sendFollowUp,
                active:        r.active,
                availability:  r.availability,
              }))}
            />
          </section>

          {/* Calendar sync */}
          <CalendarConnect
            clientId={clientId}
            connection={calendarConnection}
            googleConfigured={googleConfigured}
            outlookConfigured={outlookConfigured}
          />

          {/* Widget appearance */}
          <section>
            <div className="mb-5">
              <h2 className="text-sm font-semibold text-white">Widget Appearance</h2>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Customise the booking widget colours and style.
              </p>
            </div>
            <BookingAppearance
              clientId={clientId}
              slug={slug}
              savedTheme={savedTheme}
              appUrl={appUrl}
            />
          </section>

        </div>

        {/* Right column: live preview */}
        <div
          className="shrink-0 px-6 py-8"
          style={{ width: '420px', borderLeft: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="sticky" style={{ top: '68px' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white">Live Preview</h2>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(212,131,12,0.12)', color: '#e8a020' }}>
                saved theme
              </span>
            </div>
            <div
              className="overflow-hidden"
              style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', height: 'calc(100vh - 120px)' }}
            >
              <iframe
                src={`${appUrl}/book/${slug}`}
                width="100%"
                height="100%"
                style={{ border: 'none', display: 'block' }}
                title="My booking page preview"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
