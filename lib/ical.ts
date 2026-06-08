// RFC 5545 iCalendar feed builder — no external dependencies.

interface ICalBooking {
  id:           string
  startsAt:     Date
  endsAt:       Date
  customerName: string
  resourceName: string
  notes:        string | null
  customerPhone: string | null
}

function foldLine(line: string): string {
  // RFC 5545 §3.1: lines longer than 75 octets must be folded
  const chunks: string[] = []
  let remaining = line
  while (remaining.length > 75) {
    chunks.push(remaining.slice(0, 75))
    remaining = ' ' + remaining.slice(75)
  }
  chunks.push(remaining)
  return chunks.join('\r\n')
}

function icalDate(date: Date): string {
  // YYYYMMDDTHHMMSSZ
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export function buildICalFeed(clientName: string, bookings: ICalBooking[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lifer//Booking Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(clientName)} Bookings`,
    'X-WR-TIMEZONE:UTC',
  ]

  for (const b of bookings) {
    const description = [
      b.customerPhone ? `Phone: ${b.customerPhone}` : null,
      b.notes ? `Notes: ${b.notes}` : null,
    ].filter(Boolean).join('\\n')

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:booking-${b.id}@lifer`)
    lines.push(`DTSTAMP:${icalDate(new Date())}`)
    lines.push(`DTSTART:${icalDate(b.startsAt)}`)
    lines.push(`DTEND:${icalDate(b.endsAt)}`)
    lines.push(foldLine(`SUMMARY:${escapeText(b.customerName)} — ${escapeText(b.resourceName)}`))
    if (description) lines.push(foldLine(`DESCRIPTION:${description}`))
    lines.push('STATUS:CONFIRMED')
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}
