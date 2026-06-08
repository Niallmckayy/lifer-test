export interface AvailabilityRule {
  startTime: string // "HH:MM" 24h, local to resource timezone
  endTime:   string // "HH:MM" 24h, local to resource timezone
}

export interface ExistingBooking {
  startsAt: Date
  endsAt:   Date
}

// Returns the IANA day-of-week (0=Sun … 6=Sat) for a local date string in a given timezone.
// Never use new Date(dateStr).getDay() — that uses UTC and is wrong for timezones behind UTC.
export function getLocalDayOfWeek(dateStr: string, timezone: string): number {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'long' })
  // Use T12:00:00Z so the date is unambiguous across all timezones
  const day = fmt.format(new Date(`${dateStr}T12:00:00Z`))
  return days.indexOf(day)
}

// Converts a local HH:MM time on a given date (YYYY-MM-DD) to a UTC timestamp (ms).
// Uses Intl to correctly account for DST transitions.
function localHHMMtoUtcMs(dateStr: string, time: string, timezone: string): number {
  const [h, m] = time.split(':').map(Number)
  // Construct a nominal UTC timestamp treating the local time as UTC
  const nominalMs = Date.UTC(
    parseInt(dateStr.slice(0, 4)),
    parseInt(dateStr.slice(5, 7)) - 1,
    parseInt(dateStr.slice(8, 10)),
    h, m, 0,
  )
  // Ask Intl what local time corresponds to that UTC timestamp in our timezone
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  })
  const parts = Object.fromEntries(fmt.formatToParts(new Date(nominalMs)).map(p => [p.type, p.value]))
  const localH = parseInt(parts.hour) === 24 ? 0 : parseInt(parts.hour)
  const interpretedMs = Date.UTC(
    parseInt(parts.year),
    parseInt(parts.month) - 1,
    parseInt(parts.day),
    localH,
    parseInt(parts.minute),
    parseInt(parts.second),
  )
  // The offset tells us how far off our nominal was; apply it back
  const offsetMs = nominalMs - interpretedMs
  return nominalMs + offsetMs
}

/**
 * Generates available booking slot start times (ISO UTC strings) for a resource on a given date.
 * Returns [] on any invalid input — never throws.
 */
export function generateAvailableSlots(
  rule: AvailabilityRule,
  date: string,          // "YYYY-MM-DD" in resource local timezone
  timezone: string,
  slotDuration: number,  // minutes
  bufferTime: number,
  maxCapacity: number,
  existingBookings: ExistingBooking[],
): string[] {
  if (slotDuration <= 0 || !date.match(/^\d{4}-\d{2}-\d{2}$/)) return []

  const [startH, startM] = rule.startTime.split(':').map(Number)
  const [endH, endM]     = rule.endTime.split(':').map(Number)
  if ([startH, startM, endH, endM].some(isNaN)) return []
  if (startH < 0 || startH > 23 || startM < 0 || startM > 59) return []
  if (endH < 0 || endH > 23 || endM < 0 || endM > 59) return []

  const windowStartMs = localHHMMtoUtcMs(date, rule.startTime, timezone)
  const windowEndMs   = localHHMMtoUtcMs(date, rule.endTime,   timezone)
  if (windowEndMs <= windowStartMs) return []

  const slotLenMs  = slotDuration * 60_000
  const stepMs     = (slotDuration + bufferTime) * 60_000
  const graceCutMs = Date.now() + 5 * 60_000

  const slots: string[] = []
  let cursor = windowStartMs

  while (cursor + slotLenMs <= windowEndMs) {
    const slotEndMs = cursor + slotLenMs

    if (slotEndMs > graceCutMs) {
      const taken = existingBookings.filter(b => b.startsAt.getTime() < slotEndMs && b.endsAt.getTime() > cursor).length
      if (taken < maxCapacity) {
        slots.push(new Date(cursor).toISOString())
      }
    }

    cursor += stepMs
  }

  return slots
}

// Format a UTC Date as a human-readable local time string for display.
export function formatSlotTime(isoUtc: string, timezone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(isoUtc))
}

export function formatSlotDate(isoUtc: string, timezone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(isoUtc))
}
