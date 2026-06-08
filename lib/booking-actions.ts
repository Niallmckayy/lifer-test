'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateAvailableSlots, getLocalDayOfWeek } from '@/lib/booking-slots'
import { parseTheme, type BookingTheme } from '@/lib/booking-theme'

// ── Auth helpers ──────────────────────────────────────────

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
    throw new Error('Unauthorised.')
  }
}

async function requireAdminOrOwner(clientId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorised.')
  const isAdmin = (session.user as { role?: string }).role === 'ADMIN'
  if (isAdmin) return
  const client = await prisma.client.findUnique({ where: { userId: (session.user as { id: string }).id } })
  if (!client || client.id !== clientId) throw new Error('Unauthorised.')
}

// ── Resource management ───────────────────────────────────

export async function createBookingResource(input: {
  clientId:       string
  name:           string
  description?:   string
  slotDuration:   number
  bufferTime:     number
  maxCapacity:    number
  timezone:       string
  color?:         string
  meetingType?:   string
  location?:      string
  sendReminders?: boolean
  sendFollowUp?:  boolean
}): Promise<{ id?: string; error?: string }> {
  try {
    await requireAdminOrOwner(input.clientId)
  } catch { return { error: 'Unauthorised.' } }

  if (!input.name.trim()) return { error: 'Name is required.' }
  if (input.slotDuration < 5 || input.slotDuration > 480) return { error: 'Slot duration must be 5–480 minutes.' }
  if (input.bufferTime < 0 || input.bufferTime > 120) return { error: 'Buffer time must be 0–120 minutes.' }
  if (input.maxCapacity < 1 || input.maxCapacity > 500) return { error: 'Max capacity must be 1–500.' }

  const validTimezones = Intl.supportedValuesOf('timeZone')
  if (!validTimezones.includes(input.timezone)) return { error: 'Invalid timezone.' }

  const meetingType = input.meetingType ?? 'in_person'
  if (!['in_person', 'virtual', 'phone'].includes(meetingType)) return { error: 'Invalid meeting type.' }

  const resource = await prisma.bookingResource.create({
    data: {
      clientId:      input.clientId,
      name:          input.name.trim(),
      description:   input.description?.trim() || null,
      slotDuration:  input.slotDuration,
      bufferTime:    input.bufferTime,
      maxCapacity:   input.maxCapacity,
      timezone:      input.timezone,
      color:         input.color || null,
      meetingType,
      location:      meetingType === 'in_person' ? (input.location?.trim() || null) : null,
      sendReminders: input.sendReminders ?? true,
      sendFollowUp:  input.sendFollowUp ?? false,
    },
  })

  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/customer/bookings')
  return { id: resource.id }
}

export async function updateBookingResource(
  resourceId: string,
  input: {
    name?:          string
    description?:   string
    slotDuration?:  number
    bufferTime?:    number
    maxCapacity?:   number
    timezone?:      string
    color?:         string
    meetingType?:   string
    location?:      string
    sendReminders?: boolean
    sendFollowUp?:  boolean
  },
): Promise<{ error?: string }> {
  const resource = await prisma.bookingResource.findUnique({ where: { id: resourceId } })
  if (!resource) return { error: 'Resource not found.' }

  try { await requireAdminOrOwner(resource.clientId) } catch { return { error: 'Unauthorised.' } }

  if (input.name !== undefined && !input.name.trim()) return { error: 'Name is required.' }
  if (input.slotDuration !== undefined && (input.slotDuration < 5 || input.slotDuration > 480)) {
    return { error: 'Slot duration must be 5–480 minutes.' }
  }
  if (input.bufferTime !== undefined && (input.bufferTime < 0 || input.bufferTime > 120)) {
    return { error: 'Buffer time must be 0–120 minutes.' }
  }
  if (input.timezone !== undefined && !Intl.supportedValuesOf('timeZone').includes(input.timezone)) {
    return { error: 'Invalid timezone.' }
  }
  if (input.meetingType !== undefined && !['in_person', 'virtual', 'phone'].includes(input.meetingType)) {
    return { error: 'Invalid meeting type.' }
  }

  const resolvedMeetingType = input.meetingType ?? resource.meetingType

  await prisma.bookingResource.update({
    where: { id: resourceId },
    data: {
      ...(input.name          !== undefined && { name:          input.name.trim() }),
      ...(input.description   !== undefined && { description:   input.description.trim() || null }),
      ...(input.slotDuration  !== undefined && { slotDuration:  input.slotDuration }),
      ...(input.bufferTime    !== undefined && { bufferTime:    input.bufferTime }),
      ...(input.maxCapacity   !== undefined && { maxCapacity:   input.maxCapacity }),
      ...(input.timezone      !== undefined && { timezone:      input.timezone }),
      ...(input.color         !== undefined && { color:         input.color || null }),
      ...(input.meetingType   !== undefined && { meetingType:   input.meetingType }),
      ...(input.location      !== undefined && { location:      resolvedMeetingType === 'in_person' ? (input.location.trim() || null) : null }),
      ...(input.sendReminders !== undefined && { sendReminders: input.sendReminders }),
      ...(input.sendFollowUp  !== undefined && { sendFollowUp:  input.sendFollowUp }),
    },
  })

  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/customer/bookings')
  return {}
}

export async function deactivateBookingResource(resourceId: string): Promise<{ error?: string }> {
  const resource = await prisma.bookingResource.findUnique({ where: { id: resourceId } })
  if (!resource) return { error: 'Resource not found.' }

  try { await requireAdminOrOwner(resource.clientId) } catch { return { error: 'Unauthorised.' } }

  const futureBookings = await prisma.booking.count({
    where: {
      resourceId,
      status:   'CONFIRMED',
      startsAt: { gt: new Date() },
    },
  })
  if (futureBookings > 0) {
    return { error: `Cannot deactivate: ${futureBookings} upcoming booking(s) exist. Cancel them first.` }
  }

  await prisma.bookingResource.update({ where: { id: resourceId }, data: { active: false } })
  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/customer/bookings')
  return {}
}

export async function setAvailabilityRules(
  resourceId: string,
  rules: Array<{ dayOfWeek: number; startTime: string; endTime: string }>,
): Promise<{ error?: string }> {
  const resource = await prisma.bookingResource.findUnique({ where: { id: resourceId } })
  if (!resource) return { error: 'Resource not found.' }

  try { await requireAdminOrOwner(resource.clientId) } catch { return { error: 'Unauthorised.' } }

  const timeRe = /^\d{2}:\d{2}$/
  for (const r of rules) {
    if (r.dayOfWeek < 0 || r.dayOfWeek > 6) return { error: 'Invalid day of week.' }
    if (!timeRe.test(r.startTime) || !timeRe.test(r.endTime)) return { error: 'Times must be HH:MM.' }
    if (r.endTime <= r.startTime) return { error: `End time must be after start time (day ${r.dayOfWeek}).` }
  }

  const days = rules.map(r => r.dayOfWeek)
  if (new Set(days).size !== days.length) return { error: 'Duplicate days not allowed.' }

  await prisma.$transaction([
    prisma.bookingAvailability.deleteMany({ where: { resourceId } }),
    prisma.bookingAvailability.createMany({
      data: rules.map(r => ({ resourceId, dayOfWeek: r.dayOfWeek, startTime: r.startTime, endTime: r.endTime })),
    }),
  ])

  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/customer/bookings')
  return {}
}

// ── Slot availability (public) ────────────────────────────

export async function getAvailableSlots(input: {
  resourceId: string
  date:       string  // "YYYY-MM-DD" in resource local timezone
}): Promise<{ slots?: string[]; error?: string }> {
  if (!input.date.match(/^\d{4}-\d{2}-\d{2}$/)) return { error: 'Invalid date.' }

  const resource = await prisma.bookingResource.findUnique({
    where:   { id: input.resourceId },
    include: { availability: true },
  })
  if (!resource || !resource.active) return { error: 'Resource not available.' }

  const dayOfWeek = getLocalDayOfWeek(input.date, resource.timezone)
  const rule = resource.availability.find(a => a.dayOfWeek === dayOfWeek)
  if (!rule) return { slots: [] }

  // Window start/end in UTC for querying existing bookings
  const windowStart = new Date(`${input.date}T00:00:00Z`)
  const windowEnd   = new Date(`${input.date}T23:59:59Z`)

  const existingBookings = await prisma.booking.findMany({
    where: {
      resourceId: input.resourceId,
      status:     'CONFIRMED',
      startsAt:   { gte: windowStart, lte: windowEnd },
    },
    select: { startsAt: true, endsAt: true },
  })

  const slots = generateAvailableSlots(
    rule,
    input.date,
    resource.timezone,
    resource.slotDuration,
    resource.bufferTime,
    resource.maxCapacity,
    existingBookings,
  )

  return { slots }
}

// ── Create booking (public) ───────────────────────────────

export async function createBooking(input: {
  resourceId:     string
  slotStartIso:   string
  customerName:   string
  customerEmail:  string
  customerPhone?: string
  notes?:         string
}): Promise<{ bookingId?: string; error?: string }> {
  if (!input.customerName.trim()) return { error: 'Name is required.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.customerEmail)) return { error: 'Valid email is required.' }

  let startsAt: Date
  try { startsAt = new Date(input.slotStartIso) } catch { return { error: 'Invalid slot time.' } }
  if (startsAt <= new Date()) return { error: 'Cannot book a slot in the past.' }

  let booking
  try {
    booking = await prisma.$transaction(async (tx) => {
      const resource = await tx.bookingResource.findUnique({
        where: { id: input.resourceId },
        select: { slotDuration: true, maxCapacity: true, clientId: true, active: true, timezone: true, name: true, meetingType: true, location: true, sendReminders: true, sendFollowUp: true },
      })
      if (!resource || !resource.active) throw new Error('Resource not available.')

      const endsAt = new Date(startsAt.getTime() + resource.slotDuration * 60_000)

      const conflicting = await tx.booking.count({
        where: {
          resourceId: input.resourceId,
          status:     'CONFIRMED',
          startsAt:   { lt: endsAt },
          endsAt:     { gt: startsAt },
        },
      })
      if (conflicting >= resource.maxCapacity) throw new Error('This slot is no longer available.')

      return tx.booking.create({
        data: {
          resourceId:    input.resourceId,
          clientId:      resource.clientId,
          startsAt,
          endsAt,
          customerName:  input.customerName.trim(),
          customerEmail: input.customerEmail.trim().toLowerCase(),
          customerPhone: input.customerPhone?.trim() || null,
          notes:         input.notes?.trim() || null,
          status:        'CONFIRMED',
          cancelToken:   crypto.randomUUID(),
        },
        include: { resource: { include: { client: { include: { user: true } } } } },
      })
    })
  } catch (err) {
    return { error: (err as Error).message }
  }

  // Calendar sync first (may return a Meet link), then emails
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const { pushBookingToCalendar } = await import('./calendar-sync')
  const { sendBookingConfirmationEmail, sendBookingNotificationEmail } = await import('./email')

  const meetingType = booking.resource.meetingType
  const location    = booking.resource.location ?? undefined

  // Await calendar sync so Meet link is available for emails
  let meetLink: string | undefined
  try {
    const link = await pushBookingToCalendar({
      ...booking,
      resource: { ...booking.resource, meetingType, location: booking.resource.location },
    })
    meetLink = link ?? undefined
  } catch (err) {
    console.error('Calendar sync failed:', err)
  }

  void sendBookingConfirmationEmail({
    to:           booking.customerEmail,
    customerName: booking.customerName,
    resourceName: booking.resource.name,
    clientName:   booking.resource.client.name,
    startsAt:     booking.startsAt,
    endsAt:       booking.endsAt,
    timezone:     booking.resource.timezone,
    cancelToken:  booking.cancelToken!,
    appUrl,
    meetingType,
    location,
    meetLink,
  }).catch(console.error)

  const clientEmail = booking.resource.client.user?.email
  if (clientEmail) {
    void sendBookingNotificationEmail({
      to:            clientEmail,
      clientName:    booking.resource.client.name,
      resourceName:  booking.resource.name,
      customerName:  booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      startsAt:      booking.startsAt,
      timezone:      booking.resource.timezone,
      notes:         booking.notes,
      adminUrl:      `${appUrl}/dashboard/admin/booking/${booking.clientId}`,
      meetingType,
      location,
      meetLink,
    }).catch(console.error)
  }

  revalidatePath('/dashboard/customer/bookings')
  return { bookingId: booking.id }
}

// ── Cancel booking (public — via email token) ─────────────

export async function cancelBookingByToken(cancelToken: string): Promise<{ error?: string }> {
  const booking = await prisma.booking.findUnique({ where: { cancelToken } })
  if (!booking) return { error: 'Booking not found.' }
  if (booking.status === 'CANCELLED') return { error: 'This booking is already cancelled.' }
  if (booking.startsAt <= new Date()) return { error: 'Cannot cancel a booking that has already passed.' }

  await prisma.booking.update({ where: { cancelToken }, data: { status: 'CANCELLED' } })
  const { removeBookingFromCalendar } = await import('./calendar-sync')
  void removeBookingFromCalendar(booking.id, booking.clientId).catch(console.error)
  revalidatePath('/dashboard/customer/bookings')
  revalidatePath('/dashboard/admin')
  return {}
}

// ── Cancel booking (admin) ────────────────────────────────

export async function cancelBookingAsAdmin(bookingId: string): Promise<{ error?: string }> {
  try { await requireAdmin() } catch { return { error: 'Unauthorised.' } }

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
  if (!booking) return { error: 'Booking not found.' }
  if (booking.status === 'CANCELLED') return { error: 'Already cancelled.' }

  await prisma.booking.update({ where: { id: bookingId }, data: { status: 'CANCELLED' } })
  const { removeBookingFromCalendar } = await import('./calendar-sync')
  void removeBookingFromCalendar(bookingId, booking.clientId).catch(console.error)
  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/customer/bookings')
  return {}
}

// ── Cancel booking (client via dashboard) ────────────────

export async function cancelBookingAsClient(bookingId: string): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorised.' }

  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { client: true } })
  if (!booking) return { error: 'Booking not found.' }

  const client = await prisma.client.findUnique({ where: { userId: (session.user as { id: string }).id } })
  const isAdmin = (session.user as { role?: string }).role === 'ADMIN'
  if (!isAdmin && booking.clientId !== client?.id) return { error: 'Unauthorised.' }
  if (booking.status === 'CANCELLED') return { error: 'Already cancelled.' }

  await prisma.booking.update({ where: { id: bookingId }, data: { status: 'CANCELLED' } })
  const { removeBookingFromCalendar } = await import('./calendar-sync')
  void removeBookingFromCalendar(bookingId, booking.clientId).catch(console.error)
  revalidatePath('/dashboard/customer/bookings')
  revalidatePath('/dashboard/admin')
  return {}
}

// ── Data fetching ─────────────────────────────────────────

export async function getAdminBookingData(clientId: string) {
  try { await requireAdmin() } catch { return { error: 'Unauthorised.' } }

  const resources = await prisma.bookingResource.findMany({
    where:   { clientId },
    include: { availability: { orderBy: { dayOfWeek: 'asc' } } },
    orderBy: { createdAt: 'asc' },
  })

  const bookings = await prisma.booking.findMany({
    where:   { clientId, startsAt: { gte: new Date() } },
    include: { resource: { select: { name: true, timezone: true } } },
    orderBy: { startsAt: 'asc' },
    take:    100,
  })

  return { resources, bookings }
}

export async function getClientBookingData() {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorised.' }

  const client = await prisma.client.findUnique({
    where: { userId: (session.user as { id: string }).id },
  })
  if (!client) return { error: 'Client not found.' }

  const resources = await prisma.bookingResource.findMany({
    where:   { clientId: client.id, active: true },
    include: { availability: { orderBy: { dayOfWeek: 'asc' } } },
    orderBy: { createdAt: 'asc' },
  })

  const upcomingBookings = await prisma.booking.findMany({
    where:   { clientId: client.id, startsAt: { gte: new Date() }, status: 'CONFIRMED' },
    include: { resource: { select: { name: true, timezone: true } } },
    orderBy: { startsAt: 'asc' },
    take:    50,
  })

  return { client, resources, upcomingBookings }
}

// ── Booking widget theme ──────────────────────────────────

export async function updateBookingTheme(
  clientId: string,
  patch: Partial<BookingTheme>,
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorised.' }

  const isAdmin = (session.user as { role?: string }).role === 'ADMIN'
  if (!isAdmin) {
    const client = await prisma.client.findUnique({ where: { userId: (session.user as { id: string }).id } })
    if (!client || client.id !== clientId) return { error: 'Unauthorised.' }
  }

  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { bookingTheme: true } })
  if (!client) return { error: 'Client not found.' }

  const existing = parseTheme(client.bookingTheme)
  const merged   = { ...existing, ...patch }

  // Validate
  const hexRe = /^#[0-9a-fA-F]{6}$/
  if (!hexRe.test(merged.primaryColor))    return { error: 'Invalid primary colour.' }
  if (!hexRe.test(merged.backgroundColor)) return { error: 'Invalid background colour.' }
  if (merged.mode !== 'dark' && merged.mode !== 'light') return { error: 'Invalid mode.' }
  if (merged.borderRadius < 4 || merged.borderRadius > 24) return { error: 'Border radius must be 4–24.' }

  await prisma.client.update({ where: { id: clientId }, data: { bookingTheme: JSON.stringify(merged) } })

  revalidatePath('/dashboard/customer/bookings')
  revalidatePath('/dashboard/admin/my-booking')
  return {}
}

// ── Calendar token ────────────────────────────────────────

export async function getOrCreateCalendarToken(clientId: string): Promise<{ token?: string; error?: string }> {
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorised.' }
  const isAdmin = (session.user as { role?: string }).role === 'ADMIN'
  if (!isAdmin) {
    const client = await prisma.client.findUnique({ where: { userId: (session.user as { id: string }).id } })
    if (!client || client.id !== clientId) return { error: 'Unauthorised.' }
  }

  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { calendarToken: true } })
  if (!client) return { error: 'Client not found.' }

  if (client.calendarToken) return { token: client.calendarToken }

  const token = crypto.randomUUID()
  await prisma.client.update({ where: { id: clientId }, data: { calendarToken: token } })
  return { token }
}
