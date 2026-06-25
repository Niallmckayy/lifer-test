'use client'

import { useState, useTransition } from 'react'
import { getAvailableSlots, createBooking } from '@/lib/booking-actions'
import { formatSlotTime, formatSlotDate } from '@/lib/booking-slots'

interface Resource {
  id:           string
  name:         string
  description:  string | null
  slotDuration: number
  bufferTime:   number
  maxCapacity:  number
  timezone:     string
  color:        string | null
  meetingType?: string
  location?:    string | null
  availability: { dayOfWeek: number; startTime: string; endTime: string }[]
}

interface Props {
  clientId:   string
  clientName: string
  resources:  Resource[]
}

type Step = 'resource' | 'date' | 'slot' | 'details' | 'confirmed'

const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function hasAvailability(resource: Resource, dateStr: string): boolean {
  const d        = new Date(`${dateStr}T12:00:00Z`)
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const fmt      = new Intl.DateTimeFormat('en-US', { timeZone: resource.timezone, weekday: 'long' })
  const dayName  = fmt.format(d)
  const dow      = dayNames.indexOf(dayName)
  return resource.availability.some(a => a.dayOfWeek === dow)
}

export default function BookingFlow({ clientId, clientName, resources }: Props) {
  const [step, setStep]               = useState<Step>('resource')
  const [resource, setResource]       = useState<Resource | null>(null)
  const [calYear, setCalYear]         = useState(() => new Date().getFullYear())
  const [calMonth, setCalMonth]       = useState(() => new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [slots, setSlots]             = useState<string[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [name, setName]               = useState('')
  const [email, setEmail]             = useState('')
  const [phone, setPhone]             = useState('')
  const [notes, setNotes]             = useState('')
  const [bookingId, setBookingId]     = useState<string | null>(null)
  const [error, setError]             = useState<string | null>(null)
  const [pending, startTransition]    = useTransition()

  async function handleDateSelect(dateStr: string) {
    if (!resource) return
    setSelectedDate(dateStr)
    setSlots([])
    setError(null)
    startTransition(async () => {
      const result = await getAvailableSlots({ resourceId: resource.id, date: dateStr })
      if (result.error) { setError(result.error); return }
      setSlots(result.slots ?? [])
      setStep('slot')
    })
  }

  async function handleBook() {
    if (!resource || !selectedSlot) return
    setError(null)
    startTransition(async () => {
      const result = await createBooking({
        resourceId:    resource.id,
        slotStartIso:  selectedSlot,
        customerName:  name.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim() || undefined,
        notes:         notes.trim() || undefined,
      })
      if (result.error) { setError(result.error); return }
      setBookingId(result.bookingId!)
      setStep('confirmed')
    })
  }

  const today    = new Date()
  const todayStr = isoDate(today.getFullYear(), today.getMonth(), today.getDate())

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      {/* Inject theme-aware CSS for hover/transition pseudo-states */}
      <style>{`
        .bf-resource-btn { transition: background 0.15s, border-color 0.15s, transform 0.1s; }
        .bf-resource-btn:hover { background: rgba(var(--bp-primary-rgb), 0.1) !important; border-color: rgba(var(--bp-primary-rgb), 0.35) !important; transform: translateY(-1px); }
        .bf-resource-btn:active { transform: translateY(0); }

        .bf-cal-avail { transition: background 0.12s, border-color 0.12s, transform 0.1s; }
        .bf-cal-avail:hover { background: rgba(var(--bp-primary-rgb), 0.3) !important; border-color: rgba(var(--bp-primary-rgb), 0.7) !important; transform: scale(1.08); }
        .bf-cal-avail:active { transform: scale(1.02); }

        .bf-slot-btn { transition: background 0.12s, border-color 0.12s, transform 0.1s; cursor: pointer; }
        .bf-slot-btn:hover { background: rgba(var(--bp-primary-rgb), 0.25) !important; border-color: rgba(var(--bp-primary-rgb), 0.7) !important; transform: translateY(-1px); }
        .bf-slot-btn:active { transform: translateY(0); }
      `}</style>

      {/* Back to site */}
      <button
        onClick={() => {
          try { (window.top ?? window).history.back() } catch { window.history.back() }
        }}
        className="flex items-center gap-1.5 text-xs mb-6 transition-opacity hover:opacity-70"
        style={{ color: 'var(--bp-text-muted)' }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to site
      </button>

      {/* Header */}
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--bp-text-muted)' }}>
          {clientName}
        </p>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--bp-text)' }}>Book a session</h1>
      </div>

      {/* Step: Resource picker */}
      {step === 'resource' && (
        <div className="flex flex-col gap-3">
          {resources.map(r => (
            <button
              key={r.id}
              onClick={() => { setResource(r); setStep('date') }}
              className="bf-resource-btn w-full text-left px-5 py-4"
              style={{
                background:   'var(--bp-surface)',
                borderRadius: 'var(--bp-radius)',
                border:       '1px solid var(--bp-border)',
              }}
            >
              <div className="flex items-center gap-3">
                {r.color && (
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: r.color }} />
                )}
                <div className="flex-1">
                  <p className="font-semibold" style={{ color: 'var(--bp-text)' }}>{r.name}</p>
                  {r.description && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--bp-text-muted)' }}>{r.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs" style={{ color: 'var(--bp-primary)' }}>
                      {r.slotDuration} min
                    </p>
                    {r.meetingType && (
                      <p className="text-xs" style={{ color: 'var(--bp-text-faint)' }}>
                        {r.meetingType === 'virtual' ? 'Google Meet' : r.meetingType === 'phone' ? 'Phone call' : r.location ? r.location : 'In person'}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs" style={{ color: 'var(--bp-text-ghost)' }}>›</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Step: Date picker (calendar) */}
      {step === 'date' && resource && (
        <div>
          <BackButton onClick={() => setStep('resource')} />
          <p className="text-sm font-medium mb-4" style={{ color: 'var(--bp-text)' }}>{resource.name} — select a date</p>

          {/* Calendar nav */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
                else setCalMonth(m => m - 1)
              }}
              className="px-3 py-1.5 text-sm transition-opacity hover:opacity-70"
              style={{ color: 'var(--bp-text-muted)', background: 'var(--bp-surface)', borderRadius: 'var(--bp-radius-sm)' }}
            >
              ‹
            </button>
            <span className="text-sm font-medium" style={{ color: 'var(--bp-text)' }}>{MONTHS[calMonth]} {calYear}</span>
            <button
              onClick={() => {
                if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
                else setCalMonth(m => m + 1)
              }}
              className="px-3 py-1.5 text-sm transition-opacity hover:opacity-70"
              style={{ color: 'var(--bp-text-muted)', background: 'var(--bp-surface)', borderRadius: 'var(--bp-radius-sm)' }}
            >
              ›
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-medium py-1" style={{ color: 'var(--bp-text-faint)' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mb-3">
            <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--bp-text-muted)' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: 'var(--bp-primary)' }} />
              Available
            </span>
            <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--bp-text-faint)' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: 'var(--bp-border-strong)' }} />
              Unavailable
            </span>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: getFirstDayOfMonth(calYear, calMonth) }).map((_, i) => (
              <div key={`blank-${i}`} />
            ))}
            {Array.from({ length: getDaysInMonth(calYear, calMonth) }).map((_, i) => {
              const day     = i + 1
              const dateStr = isoDate(calYear, calMonth, day)
              const isPast  = dateStr < todayStr
              const isToday = dateStr === todayStr
              const avail   = !isPast && hasAvailability(resource, dateStr)
              return (
                <button
                  key={day}
                  disabled={!avail || pending}
                  onClick={() => handleDateSelect(dateStr)}
                  className={`bf-cal-day aspect-square flex flex-col items-center justify-center text-sm font-medium rounded-lg${avail ? ' bf-cal-avail' : ''}`}
                  style={{
                    background: avail ? `rgba(var(--bp-primary-rgb), 0.15)` : 'transparent',
                    color:      isPast ? 'var(--bp-text-ghost)' : avail ? 'var(--bp-primary)' : 'var(--bp-text-faint)',
                    border:     avail
                      ? `1px solid rgba(var(--bp-primary-rgb), 0.4)`
                      : isToday
                      ? '1px solid var(--bp-border-strong)'
                      : '1px solid transparent',
                    cursor:     avail ? 'pointer' : 'default',
                    fontWeight: avail ? 600 : 400,
                  }}
                >
                  {day}
                  {avail && <span className="w-1 h-1 rounded-full mt-0.5" style={{ background: 'var(--bp-primary)', opacity: 0.7 }} />}
                </button>
              )
            })}
          </div>

          {error && <p className="text-xs mt-3 text-center" style={{ color: '#e05a3a' }}>{error}</p>}
        </div>
      )}

      {/* Step: Slot picker */}
      {step === 'slot' && resource && selectedDate && (
        <div>
          <BackButton onClick={() => { setStep('date'); setError(null) }} />
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--bp-text)' }}>{resource.name}</p>
          <p className="text-xs mb-4" style={{ color: 'var(--bp-text-muted)' }}>
            {formatSlotDate(selectedDate + 'T12:00:00Z', resource.timezone)}
          </p>

          {pending && (
            <p className="text-xs text-center py-6" style={{ color: 'var(--bp-text-faint)' }}>Loading slots…</p>
          )}

          {!pending && slots.length === 0 && (
            <p className="text-xs text-center py-6" style={{ color: 'var(--bp-text-faint)' }}>No available slots on this date.</p>
          )}

          {!pending && slots.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {slots.map(slot => (
                <button
                  key={slot}
                  onClick={() => { setSelectedSlot(slot); setStep('details') }}
                  className="bf-slot-btn px-3 py-2.5 text-sm font-medium text-center"
                  style={{
                    background:   `rgba(var(--bp-primary-rgb), 0.12)`,
                    borderRadius: 'var(--bp-radius-sm)',
                    border:       `1px solid rgba(var(--bp-primary-rgb), 0.35)`,
                    color:        'var(--bp-primary)',
                  }}
                >
                  {formatSlotTime(slot, resource.timezone)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step: Customer details */}
      {step === 'details' && resource && selectedSlot && (
        <div>
          <BackButton onClick={() => { setStep('slot'); setError(null) }} />
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--bp-text)' }}>{resource.name}</p>
          <p className="text-xs mb-6" style={{ color: 'var(--bp-primary)' }}>
            {formatSlotDate(selectedSlot, resource.timezone)} at {formatSlotTime(selectedSlot, resource.timezone)}
          </p>

          <div className="flex flex-col gap-3">
            <Field label="Name *">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3 py-2.5 text-sm outline-none"
                style={{ background: 'var(--bp-surface)', borderRadius: 'var(--bp-radius-sm)', border: '1px solid var(--bp-border)', color: 'var(--bp-text)' }}
              />
            </Field>
            <Field label="Email *">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-3 py-2.5 text-sm outline-none"
                style={{ background: 'var(--bp-surface)', borderRadius: 'var(--bp-radius-sm)', border: '1px solid var(--bp-border)', color: 'var(--bp-text)' }}
              />
            </Field>
            <Field label="Phone">
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+44 7700 000000"
                className="w-full px-3 py-2.5 text-sm outline-none"
                style={{ background: 'var(--bp-surface)', borderRadius: 'var(--bp-radius-sm)', border: '1px solid var(--bp-border)', color: 'var(--bp-text)' }}
              />
            </Field>
            <Field label="Notes">
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Anything we should know?"
                rows={3}
                className="w-full px-3 py-2.5 text-sm outline-none resize-none"
                style={{ background: 'var(--bp-surface)', borderRadius: 'var(--bp-radius-sm)', border: '1px solid var(--bp-border)', color: 'var(--bp-text)' }}
              />
            </Field>
          </div>

          {error && <p className="text-xs mt-3" style={{ color: '#e05a3a' }}>{error}</p>}

          <button
            onClick={handleBook}
            disabled={pending || !name.trim() || !email.trim()}
            className="w-full mt-5 py-3 text-sm font-semibold transition-all"
            style={{
              background:   pending || !name.trim() || !email.trim() ? `rgba(var(--bp-primary-rgb), 0.3)` : 'var(--bp-primary)',
              borderRadius: 'var(--bp-radius)',
              color:        '#fff',
              cursor:       pending || !name.trim() || !email.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {pending ? 'Booking…' : 'Confirm booking'}
          </button>
        </div>
      )}

      {/* Step: Confirmed */}
      {step === 'confirmed' && resource && selectedSlot && (
        <div className="text-center flex flex-col items-center gap-4">
          <div
            className="w-14 h-14 flex items-center justify-center rounded-full"
            style={{ background: 'rgba(77,158,58,0.15)', border: '1px solid rgba(77,158,58,0.3)' }}
          >
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <path d="M6 13l5 5 9-9" stroke="#6dbf56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--bp-text)' }}>You&apos;re booked!</h2>
            <p className="text-sm" style={{ color: 'var(--bp-text-muted)' }}>
              {resource.name} — {formatSlotDate(selectedSlot, resource.timezone)} at {formatSlotTime(selectedSlot, resource.timezone)}
            </p>
          </div>
          <p className="text-xs" style={{ color: 'var(--bp-text-faint)' }}>
            A confirmation email has been sent to {email}. It includes a link to cancel if needed.
          </p>
          <button
            onClick={() => {
              setStep('resource')
              setResource(null)
              setSelectedDate(null)
              setSelectedSlot(null)
              setSlots([])
              setName(''); setEmail(''); setPhone(''); setNotes('')
              setError(null)
              setBookingId(null)
            }}
            className="text-xs mt-2 transition-opacity hover:opacity-70"
            style={{ color: 'var(--bp-primary)' }}
          >
            Make another booking
          </button>
        </div>
      )}
    </div>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs mb-5 transition-opacity hover:opacity-70"
      style={{ color: 'var(--bp-text-muted)' }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Back
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{ color: 'var(--bp-text-muted)' }}>{label}</label>
      {children}
    </div>
  )
}
