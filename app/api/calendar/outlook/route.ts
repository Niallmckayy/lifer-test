import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()
  if (!session?.user) return new NextResponse('Unauthorised', { status: 401 })

  const clientId = process.env.MICROSOFT_CLIENT_ID
  if (!clientId) return new NextResponse('Outlook OAuth not configured', { status: 503 })

  const tenantId    = process.env.MICROSOFT_TENANT_ID ?? 'common'
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/outlook/callback`

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: 'code',
    scope:         'https://graph.microsoft.com/Calendars.ReadWrite offline_access',
    response_mode: 'query',
  })

  return NextResponse.redirect(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params}`)
}
