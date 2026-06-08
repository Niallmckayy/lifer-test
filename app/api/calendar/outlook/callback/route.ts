import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return new NextResponse('Unauthorised', { status: 401 })

  const code  = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/customer/bookings`

  if (error || !code) {
    return NextResponse.redirect(`${dashboardUrl}?calendar_error=access_denied`)
  }

  const clientId     = process.env.MICROSOFT_CLIENT_ID!
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET!
  const tenantId     = process.env.MICROSOFT_TENANT_ID ?? 'common'
  const redirectUri  = `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/outlook/callback`

  let tokens: { access_token: string; refresh_token?: string; expires_in: number }
  try {
    const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code', scope: 'https://graph.microsoft.com/Calendars.ReadWrite offline_access' }),
    })
    tokens = await res.json()
    if (!tokens.access_token) throw new Error('No access_token in response')
  } catch {
    return NextResponse.redirect(`${dashboardUrl}?calendar_error=token_exchange_failed`)
  }

  const client = await prisma.client.findUnique({
    where: { userId: (session.user as { id: string }).id },
    select: { id: true },
  })
  if (!client) return NextResponse.redirect(`${dashboardUrl}?calendar_error=client_not_found`)

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)

  await prisma.calendarConnection.upsert({
    where:  { clientId: client.id },
    create: {
      clientId:     client.id,
      provider:     'outlook',
      accessToken:  tokens.access_token,
      refreshToken: tokens.refresh_token ?? '',
      expiresAt,
      calendarId:   'primary',
    },
    update: {
      provider:     'outlook',
      accessToken:  tokens.access_token,
      ...(tokens.refresh_token && { refreshToken: tokens.refresh_token }),
      expiresAt,
    },
  })

  return NextResponse.redirect(`${dashboardUrl}?calendar_connected=outlook`)
}
