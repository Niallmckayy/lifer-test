import { prisma } from '@/lib/prisma'

interface CalendarEvent {
  bookingId:     string
  title:         string
  description:   string
  startsAt:      Date
  endsAt:        Date
  timezone:      string
  attendeeEmail: string
  attendeeName:  string
  meetingType:   string
  location?:     string | null
}

export interface GoogleEventResult {
  eventId:  string
  meetLink: string | null
}

async function refreshIfNeeded(clientId: string): Promise<string | null> {
  const conn = await prisma.calendarConnection.findUnique({ where: { clientId } })
  if (!conn || conn.provider !== 'google') return null

  if (conn.expiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: conn.refreshToken,
        grant_type:    'refresh_token',
      }),
    })
    const data: { access_token?: string; expires_in?: number } = await res.json()
    if (!data.access_token) throw new Error('Google token refresh failed')

    await prisma.calendarConnection.update({
      where: { clientId },
      data: {
        accessToken: data.access_token,
        expiresAt:   new Date(Date.now() + (data.expires_in ?? 3600) * 1000),
      },
    })
    return data.access_token
  }

  return conn.accessToken
}

export async function createGoogleEvent(clientId: string, event: CalendarEvent): Promise<GoogleEventResult | null> {
  const conn = await prisma.calendarConnection.findUnique({ where: { clientId } })
  if (!conn || conn.provider !== 'google') return null

  const accessToken = await refreshIfNeeded(clientId)
  if (!accessToken) return null

  const isVirtual = event.meetingType === 'virtual'

  const body: Record<string, unknown> = {
    summary:     event.title,
    description: event.description,
    start:       { dateTime: event.startsAt.toISOString(), timeZone: event.timezone },
    end:         { dateTime: event.endsAt.toISOString(),   timeZone: event.timezone },
    attendees:   [{ email: event.attendeeEmail, displayName: event.attendeeName }],
  }

  if (event.location) body.location = event.location

  if (isVirtual) {
    body.conferenceData = {
      createRequest: {
        requestId: event.bookingId,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    }
  }

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(conn.calendarId)}/events${isVirtual ? '?conferenceDataVersion=1' : ''}`

  const res = await fetch(url, {
    method:  'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })

  if (!res.ok) {
    console.error('Google Calendar createEvent failed:', await res.text())
    return null
  }

  const data: {
    id?: string
    conferenceData?: { entryPoints?: { uri?: string; entryPointType?: string }[] }
  } = await res.json()

  if (!data.id) return null

  const meetLink = data.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri ?? null

  return { eventId: data.id, meetLink }
}

export async function deleteGoogleEvent(clientId: string, eventId: string): Promise<void> {
  const accessToken = await refreshIfNeeded(clientId)
  if (!accessToken) return

  const conn = await prisma.calendarConnection.findUnique({ where: { clientId } })
  if (!conn) return

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(conn.calendarId)}/events/${eventId}`, {
    method:  'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok && res.status !== 404) {
    console.error('Google Calendar deleteEvent failed:', res.status)
  }
}
