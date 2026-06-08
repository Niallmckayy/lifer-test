import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getClientBookingData, getOrCreateCalendarToken } from '@/lib/booking-actions'
import { getCalendarConnection } from '@/lib/actions'
import { prisma } from '@/lib/prisma'
import { parseTheme } from '@/lib/booking-theme'
import ResourceManager from './ResourceManager'
import CalendarConnect from './CalendarConnect'
import BookingCalendarView from './BookingCalendarView'
import BookingAppearance from './BookingAppearance'

export default async function CustomerBookingsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const result = await getClientBookingData()
  if ('error' in result) redirect('/dashboard/customer')

  const { client, resources } = result

  // Fetch bookings for calendar: current month backwards + all future
  const startOfWindow = new Date()
  startOfWindow.setDate(1)
  startOfWindow.setHours(0, 0, 0, 0)

  const [calendarBookings, clientWithTheme] = await Promise.all([
    prisma.booking.findMany({
      where:   { clientId: client.id, startsAt: { gte: startOfWindow }, status: 'CONFIRMED' },
      include: { resource: { select: { name: true, timezone: true, color: true } } },
      orderBy: { startsAt: 'asc' },
      take:    200,
    }),
    prisma.client.findUnique({
      where:  { id: client.id },
      select: { bookingTheme: true, website: { select: { slug: true } } },
    }),
  ])

  const calResult = await getCalendarConnection(client.id)
  const calendarConnection = ('connection' in calResult ? calResult.connection : null) ?? null

  const googleConfigured  = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  const outlookConfigured = !!(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET)
  const appUrl            = process.env.NEXT_PUBLIC_APP_URL ?? ''

  // Serialise Date → string for client component
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

  const savedTheme = parseTheme(clientWithTheme?.bookingTheme ?? '{}')
  const slug       = clientWithTheme?.website?.slug ?? null

  return (
    <div className="flex flex-col gap-10 px-8 py-8 max-w-5xl">

      {/* Section: Bookings calendar */}
      <section>
        <h1 className="text-lg font-bold text-white mb-5">Bookings</h1>
        <BookingCalendarView bookings={serialisedBookings} />
      </section>

      {/* Section: Booking units */}
      <section>
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-white">Booking Units</h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Configure the units customers can book.
          </p>
        </div>
        <ResourceManager
          clientId={client.id}
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

      {/* Section: Calendar sync */}
      <CalendarConnect
        clientId={client.id}
        connection={calendarConnection}
        googleConfigured={googleConfigured}
        outlookConfigured={outlookConfigured}
      />

      {/* Section: Widget appearance */}
      <section>
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-white">Widget Appearance</h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Customise the booking widget to match your brand.
          </p>
        </div>
        <BookingAppearance
          clientId={client.id}
          slug={slug}
          savedTheme={savedTheme}
          appUrl={appUrl}
        />
      </section>

    </div>
  )
}
