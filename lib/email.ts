import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? '')
}

const FROM = () => process.env.RESEND_FROM_EMAIL ?? 'updates@example.com'

export async function sendGoLiveEmail(
  to: string,
  name: string,
  billingUrl: string,
): Promise<void> {
  await getResend().emails.send({
    from: FROM(),
    to,
    subject: 'Your site is ready — start your free trial',
    text: [
      `Hi ${name},`,
      ``,
      `Your site is built and ready to go live.`,
      ``,
      `Start your 14-day free trial — no charge until day 14:`,
      billingUrl,
      ``,
      `Studio`,
    ].join('\n'),
  })
}

export async function sendDraftReadyEmail(
  to: string,
  clientName: string,
  dashboardUrl: string,
): Promise<void> {
  await getResend().emails.send({
    from: FROM(),
    to,
    subject: `Your website draft is ready — ${clientName}`,
    text: [
      `Hi,`,
      ``,
      `Your website draft is ready to preview.`,
      ``,
      `Log in to your dashboard to review it and request any changes:`,
      dashboardUrl,
      ``,
      `Studio`,
    ].join('\n'),
  })
}

export async function sendDeployedEmail(
  to: string,
  clientName: string,
  liveUrl: string,
): Promise<void> {
  await getResend().emails.send({
    from: FROM(),
    to,
    subject: `Your website is now live — ${clientName}`,
    text: [
      `Hi,`,
      ``,
      `Your website update is now live:`,
      liveUrl,
      ``,
      `Studio`,
    ].join('\n'),
  })
}

function formatBookingDateTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function formatTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function googleCalendarLink(params: {
  title: string
  startsAt: Date
  endsAt: Date
  details?: string
}): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: params.title,
    dates: `${fmt(params.startsAt)}/${fmt(params.endsAt)}`,
    ...(params.details ? { details: params.details } : {}),
  })
  return `https://www.google.com/calendar/render?${q.toString()}`
}

function outlookCalendarLink(params: {
  title: string
  startsAt: Date
  endsAt: Date
  body?: string
}): string {
  const q = new URLSearchParams({
    subject: params.title,
    startdt: params.startsAt.toISOString(),
    enddt:   params.endsAt.toISOString(),
    ...(params.body ? { body: params.body } : {}),
  })
  return `https://outlook.live.com/calendar/0/deeplink/compose?${q.toString()}`
}

function meetingBlock(meetingType: string, location?: string, meetLink?: string): string[] {
  if (meetingType === 'virtual' && meetLink) {
    return [``, `Join Google Meet:`, meetLink]
  }
  if (meetingType === 'virtual') {
    return [``, `This is a virtual session. A Google Meet link will follow shortly.`]
  }
  if (meetingType === 'phone') {
    return [``, `This is a phone call — we'll call you at the time of your booking.`]
  }
  if (meetingType === 'in_person' && location) {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
    return [``, `Location: ${location}`, `Get directions: ${mapsUrl}`]
  }
  return []
}

interface ConfirmationParams {
  to:           string
  customerName: string
  resourceName: string
  clientName:   string
  startsAt:     Date
  endsAt:       Date
  timezone:     string
  cancelToken:  string
  appUrl:       string
  meetingType?: string
  location?:    string
  meetLink?:    string
}

export async function sendBookingConfirmationEmail(params: ConfirmationParams): Promise<void> {
  const title     = `${params.resourceName} at ${params.clientName}`
  const startStr  = formatBookingDateTime(params.startsAt, params.timezone)
  const endStr    = formatTime(params.endsAt, params.timezone)
  const cancelUrl = `${params.appUrl}/book/cancel/${params.cancelToken}`
  const gcal      = googleCalendarLink({ title, startsAt: params.startsAt, endsAt: params.endsAt })
  const outlook   = outlookCalendarLink({ title, startsAt: params.startsAt, endsAt: params.endsAt })
  const mType     = params.meetingType ?? 'in_person'

  const locationLine = (() => {
    if (mType === 'virtual' && params.meetLink) return `<p style="margin:4px 0">Join Google Meet: <a href="${params.meetLink}" style="color:#d4830c">${params.meetLink}</a></p>`
    if (mType === 'virtual') return `<p style="margin:4px 0">A Google Meet link will follow shortly.</p>`
    if (mType === 'phone') return `<p style="margin:4px 0">We&apos;ll call you at the time of your booking.</p>`
    if (mType === 'in_person' && params.location) {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(params.location)}`
      return `<p style="margin:4px 0">Location: ${params.location} &mdash; <a href="${mapsUrl}" style="color:#d4830c">Get directions</a></p>`
    }
    return ''
  })()

  await getResend().emails.send({
    from: FROM(),
    to: params.to,
    subject: `Booking confirmed — ${title}`,
    text: [
      `Hi ${params.customerName},`,
      ``,
      `Your booking is confirmed.`,
      ``,
      `  ${title}`,
      `  ${startStr} – ${endStr}`,
      ...meetingBlock(mType, params.location, params.meetLink),
      ``,
      `Add to your calendar:`,
      `  Google Calendar: ${gcal}`,
      `  Outlook: ${outlook}`,
      ``,
      `Need to cancel? Use this link (up to the time of your booking):`,
      cancelUrl,
      ``,
      `See you then.`,
    ].join('\n'),
    html: `
      <div style="font-family:sans-serif;font-size:14px;color:#1a1a1a;max-width:480px">
        <p>Hi ${params.customerName},</p>
        <p>Your booking is confirmed.</p>
        <div style="background:#f9f6f1;border-radius:8px;padding:16px 20px;margin:16px 0">
          <p style="margin:0 0 4px;font-weight:600">${title}</p>
          <p style="margin:4px 0;color:#555">${startStr} &ndash; ${endStr}</p>
          ${locationLine}
        </div>
        <p style="margin:16px 0 6px">Add to your calendar:</p>
        <p style="margin:4px 0">
          <a href="${gcal}" style="color:#d4830c;text-decoration:none;font-weight:500">Add to Google Calendar</a>
          &nbsp;&nbsp;·&nbsp;&nbsp;
          <a href="${outlook}" style="color:#d4830c;text-decoration:none;font-weight:500">Add to Outlook Calendar</a>
        </p>
        <p style="margin:20px 0 4px;color:#555;font-size:13px">
          Need to cancel? <a href="${cancelUrl}" style="color:#d4830c">Cancel this booking</a> (up to the time of your booking).
        </p>
        <p>See you then.</p>
      </div>
    `,
  })
}

export async function sendBookingReminderEmail(params: ConfirmationParams): Promise<void> {
  const title    = `${params.resourceName} at ${params.clientName}`
  const startStr = formatBookingDateTime(params.startsAt, params.timezone)
  const endStr   = formatTime(params.endsAt, params.timezone)
  const cancelUrl = `${params.appUrl}/book/cancel/${params.cancelToken}`
  const mType    = params.meetingType ?? 'in_person'

  await getResend().emails.send({
    from: FROM(),
    to: params.to,
    subject: `Reminder: your booking is tomorrow — ${params.resourceName}`,
    text: [
      `Hi ${params.customerName},`,
      ``,
      `Just a reminder — your booking is tomorrow.`,
      ``,
      `  ${title}`,
      `  ${startStr} – ${endStr}`,
      ...meetingBlock(mType, params.location, params.meetLink),
      ``,
      `Need to cancel? Use this link:`,
      cancelUrl,
      ``,
      `See you tomorrow.`,
    ].join('\n'),
  })
}

export async function sendBookingFollowUpEmail(params: {
  to:           string
  customerName: string
  resourceName: string
  clientName:   string
  bookingUrl:   string
}): Promise<void> {
  await getResend().emails.send({
    from: FROM(),
    to: params.to,
    subject: `How was your session? — ${params.resourceName}`,
    text: [
      `Hi ${params.customerName},`,
      ``,
      `Hope your ${params.resourceName} session with ${params.clientName} went well.`,
      ``,
      `If you'd like to book again:`,
      params.bookingUrl,
      ``,
      `Thanks for booking with us.`,
    ].join('\n'),
  })
}

interface NotificationParams {
  to:            string
  clientName:    string
  resourceName:  string
  customerName:  string
  customerEmail: string
  customerPhone: string | null | undefined
  startsAt:      Date
  timezone:      string
  notes:         string | null | undefined
  adminUrl:      string
  meetingType?:  string
  location?:     string
  meetLink?:     string
}

export async function sendBookingNotificationEmail(params: NotificationParams): Promise<void> {
  const startStr = formatBookingDateTime(params.startsAt, params.timezone)
  const mType    = params.meetingType ?? 'in_person'

  const lines = [
    `New booking — ${params.resourceName}`,
    ``,
    `  Customer: ${params.customerName}`,
    `  Email:    ${params.customerEmail}`,
    ...(params.customerPhone ? [`  Phone:    ${params.customerPhone}`] : []),
    `  Time:     ${startStr}`,
    ...(params.notes ? [`  Notes:    ${params.notes}`] : []),
    ...meetingBlock(mType, params.location, params.meetLink),
    ``,
    `Manage this booking:`,
    params.adminUrl,
  ]

  await getResend().emails.send({
    from: FROM(),
    to: params.to,
    subject: `New booking: ${params.customerName} — ${startStr}`,
    text: lines.join('\n'),
  })
}
