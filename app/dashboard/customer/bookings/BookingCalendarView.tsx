'use client'

import { useState } from 'react'
import CancelBookingButton from './CancelBookingButton'

export interface SerializedBooking {
  id:            string
  startsAt:      string  // ISO UTC string
  endsAt:        string
  customerName:  string
  customerEmail: string
  customerPhone: string | null
  notes:         string | null
  status:        string
  resource: {
    name:     string
    timezone: string
    color:    string | null
  }
}

interface Props {
  bookings: SerializedBooking[]
}

const MONTHS      = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_HEADERS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function getLocalDateStr(isoUtc: string, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date(isoUtc))
}

function formatTime(isoUtc: string, timezone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(isoUtc))
}

function formatDayHeading(dateStr: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).format(new Date(dateStr + 'T12:00:00Z'))
}

export default function BookingCalendarView({ bookings }: Props) {
  const today    = new Date()
  const todayStr = isoDate(today.getFullYear(), today.getMonth(), today.getDate())

  const [calYear, setCalYear]       = useState(() => today.getFullYear())
  const [calMonth, setCalMonth]     = useState(() => today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Group bookings by local date in their resource's timezone
  const byDate = new Map<string, SerializedBooking[]>()
  for (const b of bookings) {
    const d = getLocalDateStr(b.startsAt, b.resource.timezone)
    if (!byDate.has(d)) byDate.set(d, [])
    byDate.get(d)!.push(b)
  }

  // Sort each day's bookings by time
  byDate.forEach(list => list.sort((a, b) => a.startsAt.localeCompare(b.startsAt)))

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
    else setCalMonth(m => m - 1)
    setSelectedDate(null)
  }

  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
    else setCalMonth(m => m + 1)
    setSelectedDate(null)
  }

  const upcoming = bookings
    .filter(b => new Date(b.startsAt) >= today)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, 8)

  const dayBookings = selectedDate ? (byDate.get(selectedDate) ?? []) : []

  return (
    <div className="flex flex-col md:flex-row gap-6">

      {/* Calendar + selected-day panel */}
      <div className="flex-1 min-w-0">

        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="px-3 py-1.5 text-sm transition-opacity hover:opacity-70"
            style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}
          >‹</button>
          <span className="text-sm font-semibold text-white">{MONTHS[calMonth]} {calYear}</span>
          <button
            onClick={nextMonth}
            className="px-3 py-1.5 text-sm transition-opacity hover:opacity-70"
            style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}
          >›</button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_HEADERS.map(d => (
            <div key={d} className="text-center text-xs font-medium py-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: getFirstDayOfMonth(calYear, calMonth) }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {Array.from({ length: getDaysInMonth(calYear, calMonth) }).map((_, i) => {
            const day      = i + 1
            const dateStr  = isoDate(calYear, calMonth, day)
            const isPast   = dateStr < todayStr
            const isToday  = dateStr === todayStr
            const isSelected = dateStr === selectedDate
            const dots     = byDate.get(dateStr) ?? []

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className="flex flex-col items-center py-1.5 rounded-lg transition-all"
                style={{
                  background: isSelected
                    ? 'rgba(212,131,12,0.18)'
                    : isToday
                    ? 'rgba(255,255,255,0.05)'
                    : 'transparent',
                  border: isSelected
                    ? '1px solid rgba(212,131,12,0.45)'
                    : isToday
                    ? '1px solid rgba(255,255,255,0.1)'
                    : '1px solid transparent',
                }}
              >
                <span
                  className="text-xs"
                  style={{
                    color: isSelected
                      ? '#e8a020'
                      : isPast
                      ? 'rgba(255,255,255,0.2)'
                      : 'rgba(255,255,255,0.75)',
                  }}
                >
                  {day}
                </span>
                {dots.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center" style={{ minHeight: '8px' }}>
                    {dots.slice(0, 3).map(b => (
                      <span
                        key={b.id}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: b.resource.color ?? '#d4830c' }}
                      />
                    ))}
                    {dots.length > 3 && (
                      <span style={{ fontSize: '9px', color: '#d4830c', lineHeight: '6px' }}>
                        +{dots.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Selected day detail panel */}
        {selectedDate && (
          <div
            className="mt-4 p-4 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-xs font-semibold text-white mb-3">
              {formatDayHeading(selectedDate)}
            </p>
            {dayBookings.length === 0 ? (
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>No bookings on this day.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {dayBookings.map(b => (
                  <BookingCard key={b.id} booking={b} formatTime={formatTime} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upcoming bookings */}
      <div className="md:w-55 md:shrink-0">
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Upcoming
        </p>
        {upcoming.length === 0 ? (
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>No upcoming bookings.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {upcoming.map(b => (
              <UpcomingCard key={b.id} booking={b} formatTime={formatTime} />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────

function BookingCard({ booking: b, formatTime }: { booking: SerializedBooking; formatTime: (iso: string, tz: string) => string }) {
  return (
    <div
      className="px-3 py-2.5 rounded-lg flex items-start justify-between gap-2"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-start gap-2 min-w-0">
        {b.resource.color && (
          <span className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: b.resource.color }} />
        )}
        <div className="min-w-0">
          <p className="text-xs font-medium text-white truncate">{b.customerName}</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {formatTime(b.startsAt, b.resource.timezone)} · {b.resource.name}
          </p>
          <p className="text-xs font-mono truncate" style={{ color: 'rgba(255,255,255,0.25)' }}>{b.customerEmail}</p>
          {b.customerPhone && (
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{b.customerPhone}</p>
          )}
          {b.notes && (
            <p className="text-xs mt-1 italic truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{b.notes}</p>
          )}
        </div>
      </div>
      <div className="shrink-0">
        <CancelBookingButton bookingId={b.id} />
      </div>
    </div>
  )
}

function UpcomingCard({ booking: b, formatTime }: { booking: SerializedBooking; formatTime: (iso: string, tz: string) => string }) {
  const localDate = new Intl.DateTimeFormat('en-GB', {
    timeZone: b.resource.timezone,
    day: 'numeric', month: 'short', weekday: 'short',
  }).format(new Date(b.startsAt))

  return (
    <div
      className="px-3 py-2.5 rounded-lg"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        {b.resource.color && (
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: b.resource.color }} />
        )}
        <p className="text-xs font-medium text-white truncate">{b.resource.name}</p>
      </div>
      <p className="text-xs tabular-nums" style={{ color: '#e8a020' }}>
        {localDate} {formatTime(b.startsAt, b.resource.timezone)}
      </p>
      <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{b.customerName}</p>
    </div>
  )
}
