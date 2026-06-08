import { prisma } from '@/lib/prisma'

interface CalendarEvent {
  bookingId:    string
  title:        string
  description:  string
  startsAt:     Date
  endsAt:       Date
  timezone:     string
  attendeeEmail: string
  attendeeName:  string
}

async function refreshIfNeeded(clientId: string): Promise<string | null> {
  const conn = await prisma.calendarConnection.findUnique({ where: { clientId } })
  if (!conn || conn.provider !== 'outlook') return null

  if (conn.expiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
    const tenantId = process.env.MICROSOFT_TENANT_ID ?? 'common'
    const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        refresh_token: conn.refreshToken,
        grant_type:    'refresh_token',
        scope:         'https://graph.microsoft.com/Calendars.ReadWrite offline_access',
      }),
    })
    const data: { access_token?: string; expires_in?: number } = await res.json()
    if (!data.access_token) throw new Error('Outlook token refresh failed')

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

export async function createOutlookEvent(clientId: string, event: CalendarEvent): Promise<string | null> {
  const conn = await prisma.calendarConnection.findUnique({ where: { clientId } })
  if (!conn || conn.provider !== 'outlook') return null

  const accessToken = await refreshIfNeeded(clientId)
  if (!accessToken) return null

  const body = {
    subject:      event.title,
    body:         { contentType: 'text', content: event.description },
    start:        { dateTime: event.startsAt.toISOString(), timeZone: event.timezone },
    end:          { dateTime: event.endsAt.toISOString(),   timeZone: event.timezone },
    attendees:    [{ emailAddress: { address: event.attendeeEmail, name: event.attendeeName }, type: 'required' }],
  }

  // Use /me/calendar/events for 'primary', otherwise use /me/calendars/{id}/events
  const calUrl = conn.calendarId === 'primary'
    ? 'https://graph.microsoft.com/v1.0/me/calendar/events'
    : `https://graph.microsoft.com/v1.0/me/calendars/${conn.calendarId}/events`

  const res = await fetch(calUrl, {
    method:  'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })

  if (!res.ok) {
    console.error('Outlook createEvent failed:', await res.text())
    return null
  }

  const data: { id?: string } = await res.json()
  return data.id ?? null
}

export async function deleteOutlookEvent(clientId: string, eventId: string): Promise<void> {
  const accessToken = await refreshIfNeeded(clientId)
  if (!accessToken) return

  const conn = await prisma.calendarConnection.findUnique({ where: { clientId } })
  if (!conn) return

  const calUrl = conn.calendarId === 'primary'
    ? `https://graph.microsoft.com/v1.0/me/calendar/events/${eventId}`
    : `https://graph.microsoft.com/v1.0/me/calendars/${conn.calendarId}/events/${eventId}`

  const res = await fetch(calUrl, {
    method:  'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok && res.status !== 404) {
    console.error('Outlook deleteEvent failed:', res.status)
  }
}
