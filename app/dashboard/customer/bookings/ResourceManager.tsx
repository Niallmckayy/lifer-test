'use client'

import { useState, useTransition } from 'react'
import {
  createBookingResource,
  updateBookingResource,
  deactivateBookingResource,
  setAvailabilityRules,
} from '@/lib/booking-actions'

const DAY_LABELS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const DAY_SHORT  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

interface Availability {
  dayOfWeek: number
  startTime: string
  endTime:   string
}

interface Resource {
  id:            string
  name:          string
  description:   string | null
  slotDuration:  number
  bufferTime:    number
  maxCapacity:   number
  timezone:      string
  color:         string | null
  meetingType:   string
  location:      string | null
  sendReminders: boolean
  sendFollowUp:  boolean
  active:        boolean
  availability:  Availability[]
}

function emptyAvailability(): Availability[] {
  return [1,2,3,4,5].map(d => ({ dayOfWeek: d, startTime: '09:00', endTime: '17:00' }))
}

// Common timezone list
const TIMEZONES = [
  'Europe/London','Europe/Paris','Europe/Berlin','Europe/Madrid','Europe/Rome',
  'America/New_York','America/Chicago','America/Denver','America/Los_Angeles',
  'America/Toronto','America/Vancouver','Australia/Sydney','Australia/Melbourne',
  'Asia/Dubai','Asia/Singapore','Asia/Tokyo','Pacific/Auckland',
]

export default function ResourceManager({
  clientId,
  resources: initial,
}: {
  clientId:  string
  resources: Resource[]
}) {
  const [resources, setResources]   = useState<Resource[]>(initial)
  const [showAdd, setShowAdd]       = useState(false)
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [availId, setAvailId]       = useState<string | null>(null)
  const [error, setError]           = useState<string | null>(null)
  const [pending, start]            = useTransition()

  // Add form state
  const [addName, setAddName]               = useState('')
  const [addDesc, setAddDesc]               = useState('')
  const [addDuration, setAddDuration]       = useState(60)
  const [addBuffer, setAddBuffer]           = useState(0)
  const [addCapacity, setAddCapacity]       = useState(1)
  const [addTimezone, setAddTimezone]       = useState('Europe/London')
  const [addColor, setAddColor]             = useState('')
  const [addMeetingType, setAddMeetingType] = useState('in_person')
  const [addLocation, setAddLocation]       = useState('')
  const [addReminders, setAddReminders]     = useState(true)
  const [addFollowUp, setAddFollowUp]       = useState(false)

  // Edit form state (keyed by id)
  const [editState, setEditState] = useState<Record<string, {
    name: string; description: string; slotDuration: number
    bufferTime: number; maxCapacity: number; timezone: string; color: string
    meetingType: string; location: string; sendReminders: boolean; sendFollowUp: boolean
  }>>({})

  // Availability edit state
  const [availState, setAvailState] = useState<Record<string, Availability[]>>({})

  function startEdit(r: Resource) {
    setEditingId(r.id)
    setEditState(prev => ({
      ...prev,
      [r.id]: {
        name: r.name, description: r.description ?? '',
        slotDuration: r.slotDuration, bufferTime: r.bufferTime,
        maxCapacity: r.maxCapacity, timezone: r.timezone, color: r.color ?? '',
        meetingType: r.meetingType, location: r.location ?? '',
        sendReminders: r.sendReminders, sendFollowUp: r.sendFollowUp,
      },
    }))
  }

  function startAvail(r: Resource) {
    setAvailId(r.id)
    setAvailState(prev => ({
      ...prev,
      [r.id]: r.availability.length > 0 ? [...r.availability] : emptyAvailability(),
    }))
  }

  function toggleAvailDay(resourceId: string, dayOfWeek: number) {
    setAvailState(prev => {
      const current = prev[resourceId] ?? emptyAvailability()
      const has = current.some(a => a.dayOfWeek === dayOfWeek)
      if (has) return { ...prev, [resourceId]: current.filter(a => a.dayOfWeek !== dayOfWeek) }
      return { ...prev, [resourceId]: [...current, { dayOfWeek, startTime: '09:00', endTime: '17:00' }].sort((a, b) => a.dayOfWeek - b.dayOfWeek) }
    })
  }

  function updateAvailTime(resourceId: string, dayOfWeek: number, field: 'startTime' | 'endTime', val: string) {
    setAvailState(prev => ({
      ...prev,
      [resourceId]: (prev[resourceId] ?? []).map(a => a.dayOfWeek === dayOfWeek ? { ...a, [field]: val } : a),
    }))
  }

  async function handleAdd() {
    setError(null)
    start(async () => {
      const r = await createBookingResource({
        clientId, name: addName, description: addDesc || undefined,
        slotDuration: addDuration, bufferTime: addBuffer, maxCapacity: addCapacity,
        timezone: addTimezone, color: addColor || undefined,
        meetingType: addMeetingType, location: addLocation || undefined,
        sendReminders: addReminders, sendFollowUp: addFollowUp,
      })
      if (r.error) { setError(r.error); return }
      const newRes: Resource = {
        id: r.id!, name: addName, description: addDesc || null,
        slotDuration: addDuration, bufferTime: addBuffer, maxCapacity: addCapacity,
        timezone: addTimezone, color: addColor || null,
        meetingType: addMeetingType, location: addLocation || null,
        sendReminders: addReminders, sendFollowUp: addFollowUp,
        active: true, availability: [],
      }
      setResources(prev => [...prev, newRes])
      setShowAdd(false)
      setAddName(''); setAddDesc(''); setAddDuration(60); setAddBuffer(0); setAddCapacity(1)
      setAddTimezone('Europe/London'); setAddColor(''); setAddMeetingType('in_person')
      setAddLocation(''); setAddReminders(true); setAddFollowUp(false)
    })
  }

  async function handleEdit(resourceId: string) {
    const s = editState[resourceId]
    if (!s) return
    setError(null)
    start(async () => {
      const r = await updateBookingResource(resourceId, {
        name: s.name, description: s.description || undefined,
        slotDuration: s.slotDuration, bufferTime: s.bufferTime,
        maxCapacity: s.maxCapacity, timezone: s.timezone, color: s.color || undefined,
        meetingType: s.meetingType, location: s.location || undefined,
        sendReminders: s.sendReminders, sendFollowUp: s.sendFollowUp,
      })
      if (r.error) { setError(r.error); return }
      setResources(prev => prev.map(res => res.id === resourceId ? {
        ...res, name: s.name, description: s.description || null,
        slotDuration: s.slotDuration, bufferTime: s.bufferTime,
        maxCapacity: s.maxCapacity, timezone: s.timezone, color: s.color || null,
        meetingType: s.meetingType, location: s.location || null,
        sendReminders: s.sendReminders, sendFollowUp: s.sendFollowUp,
      } : res))
      setEditingId(null)
    })
  }

  async function handleAvailSave(resourceId: string) {
    const rules = availState[resourceId] ?? []
    setError(null)
    start(async () => {
      const r = await setAvailabilityRules(resourceId, rules)
      if (r.error) { setError(r.error); return }
      setResources(prev => prev.map(res => res.id === resourceId ? { ...res, availability: rules } : res))
      setAvailId(null)
    })
  }

  async function handleDeactivate(resourceId: string) {
    setError(null)
    start(async () => {
      const r = await deactivateBookingResource(resourceId)
      if (r.error) { setError(r.error); return }
      setResources(prev => prev.map(res => res.id === resourceId ? { ...res, active: false } : res))
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="text-xs px-4 py-3 rounded-xl" style={{ background: 'rgba(192,57,27,0.1)', color: '#e05a3a', border: '1px solid rgba(192,57,27,0.2)' }}>
          {error}
        </p>
      )}

      {resources.map(r => (
        <div
          key={r.id}
          className="px-5 py-4"
          style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {editingId === r.id ? (
            <ResourceForm
              state={editState[r.id]!}
              onChange={patch => setEditState(prev => ({ ...prev, [r.id]: { ...prev[r.id]!, ...patch } }))}
              onSave={() => handleEdit(r.id)}
              onCancel={() => setEditingId(null)}
              pending={pending}
              label="Save changes"
            />
          ) : availId === r.id ? (
            <AvailabilityForm
              rules={availState[r.id] ?? r.availability}
              onToggle={dow => toggleAvailDay(r.id, dow)}
              onTimeChange={(dow, field, val) => updateAvailTime(r.id, dow, field, val)}
              onSave={() => handleAvailSave(r.id)}
              onCancel={() => setAvailId(null)}
              pending={pending}
            />
          ) : (
            <>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  {r.color && <span className="w-3 h-3 rounded-full shrink-0 mt-0.5" style={{ background: r.color }} />}
                  <div>
                    <p className="font-semibold text-white text-sm">{r.name}</p>
                    {r.description && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{r.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.active && (
                    <>
                      <Btn onClick={() => startEdit(r)}>Edit</Btn>
                      <Btn onClick={() => startAvail(r)}>Availability</Btn>
                      <Btn danger onClick={() => handleDeactivate(r.id)} disabled={pending}>Deactivate</Btn>
                    </>
                  )}
                  {!r.active && <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>inactive</span>}
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-xs mt-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                <span>{r.slotDuration} min</span>
                {r.bufferTime > 0 && <span>{r.bufferTime} min buffer</span>}
                {r.maxCapacity > 1 && <span>{r.maxCapacity} capacity</span>}
                <span>{r.timezone}</span>
                <MeetingTypeBadge meetingType={r.meetingType} />
              </div>
              {r.meetingType === 'in_person' && r.location && (
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>{r.location}</p>
              )}
              <div className="flex gap-3 text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
                {r.sendReminders && <span>24h reminder on</span>}
                {r.sendFollowUp && <span>follow-up on</span>}
              </div>
              {r.availability.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {r.availability.map(a => (
                    <span key={a.dayOfWeek} className="text-xs px-2 py-0.5" style={{ background: 'rgba(212,131,12,0.1)', color: '#e8a020', borderRadius: '6px' }}>
                      {DAY_SHORT[a.dayOfWeek]} {a.startTime}–{a.endTime}
                    </span>
                  ))}
                </div>
              )}
              {r.availability.length === 0 && r.active && (
                <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.2)' }}>No availability set — customers won&apos;t be able to book until you add availability.</p>
              )}
            </>
          )}
        </div>
      ))}

      {/* Add resource */}
      {showAdd ? (
        <div className="px-5 py-4" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(212,131,12,0.2)' }}>
          <p className="text-sm font-semibold text-white mb-4">New unit</p>
          <ResourceForm
            state={{ name: addName, description: addDesc, slotDuration: addDuration, bufferTime: addBuffer, maxCapacity: addCapacity, timezone: addTimezone, color: addColor, meetingType: addMeetingType, location: addLocation, sendReminders: addReminders, sendFollowUp: addFollowUp }}
            onChange={patch => {
              if (patch.name !== undefined) setAddName(patch.name)
              if (patch.description !== undefined) setAddDesc(patch.description)
              if (patch.slotDuration !== undefined) setAddDuration(patch.slotDuration)
              if (patch.bufferTime !== undefined) setAddBuffer(patch.bufferTime)
              if (patch.maxCapacity !== undefined) setAddCapacity(patch.maxCapacity)
              if (patch.timezone !== undefined) setAddTimezone(patch.timezone)
              if (patch.color !== undefined) setAddColor(patch.color)
              if (patch.meetingType !== undefined) setAddMeetingType(patch.meetingType)
              if (patch.location !== undefined) setAddLocation(patch.location)
              if (patch.sendReminders !== undefined) setAddReminders(patch.sendReminders)
              if (patch.sendFollowUp !== undefined) setAddFollowUp(patch.sendFollowUp)
            }}
            onSave={handleAdd}
            onCancel={() => setShowAdd(false)}
            pending={pending}
            label="Create unit"
          />
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full py-3 text-sm font-medium transition-all hover:opacity-90"
          style={{ background: 'rgba(212,131,12,0.1)', borderRadius: '12px', color: '#e8a020', border: '1px dashed rgba(212,131,12,0.3)' }}
        >
          + Add unit
        </button>
      )}
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────

type FormState = {
  name: string; description: string; slotDuration: number
  bufferTime: number; maxCapacity: number; timezone: string; color: string
  meetingType: string; location: string; sendReminders: boolean; sendFollowUp: boolean
}

const MEETING_TYPES = [
  { value: 'in_person', label: 'In Person' },
  { value: 'virtual',   label: 'Virtual (Google Meet)' },
  { value: 'phone',     label: 'Phone Call' },
]

function ResourceForm({
  state, onChange, onSave, onCancel, pending, label,
}: {
  state: FormState
  onChange: (patch: Partial<FormState>) => void
  onSave: () => void
  onCancel: () => void
  pending: boolean
  label: string
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <FField label="Name *">
          <input value={state.name} onChange={e => onChange({ name: e.target.value })} placeholder="e.g. Mobile Recovery Unit" className="field-input" style={fieldStyle} />
        </FField>
        <FField label="Description">
          <input value={state.description} onChange={e => onChange({ description: e.target.value })} placeholder="Optional" className="field-input" style={fieldStyle} />
        </FField>
        <FField label="Slot duration (min)">
          <input type="number" value={state.slotDuration} onChange={e => onChange({ slotDuration: +e.target.value })} min={5} max={480} style={fieldStyle} />
        </FField>
        <FField label="Buffer time (min)">
          <input type="number" value={state.bufferTime} onChange={e => onChange({ bufferTime: +e.target.value })} min={0} max={120} style={fieldStyle} />
        </FField>
        <FField label="Max capacity">
          <input type="number" value={state.maxCapacity} onChange={e => onChange({ maxCapacity: +e.target.value })} min={1} max={500} style={fieldStyle} />
        </FField>
        <FField label="Color (optional)">
          <input value={state.color} onChange={e => onChange({ color: e.target.value })} placeholder="#d4830c" style={fieldStyle} />
        </FField>
      </div>
      <FField label="Timezone">
        <select value={state.timezone} onChange={e => onChange({ timezone: e.target.value })} style={{ ...fieldStyle, cursor: 'pointer' }}>
          {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
        </select>
      </FField>

      {/* Meeting type */}
      <FField label="Meeting type">
        <div className="flex gap-1.5">
          {MEETING_TYPES.map(mt => (
            <button
              key={mt.value}
              type="button"
              onClick={() => onChange({ meetingType: mt.value })}
              className="flex-1 py-1.5 text-xs font-medium transition-all"
              style={{
                borderRadius: '8px',
                background: state.meetingType === mt.value ? 'rgba(212,131,12,0.2)' : 'rgba(255,255,255,0.04)',
                color: state.meetingType === mt.value ? '#e8a020' : 'rgba(255,255,255,0.35)',
                border: state.meetingType === mt.value ? '1px solid rgba(212,131,12,0.4)' : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {mt.label}
            </button>
          ))}
        </div>
      </FField>

      {/* Location — only for in_person */}
      {state.meetingType === 'in_person' && (
        <FField label="Location">
          <input
            value={state.location}
            onChange={e => onChange({ location: e.target.value })}
            placeholder="123 Main St, Belfast"
            style={fieldStyle}
          />
        </FField>
      )}

      {/* Email toggles */}
      <div className="flex gap-4 mt-1">
        <Toggle
          checked={state.sendReminders}
          onChange={v => onChange({ sendReminders: v })}
          label="24h reminder email"
        />
        <Toggle
          checked={state.sendFollowUp}
          onChange={v => onChange({ sendFollowUp: v })}
          label="Post-session follow-up"
        />
      </div>

      <div className="flex gap-2 mt-1">
        <button
          onClick={onSave}
          disabled={pending || !state.name.trim()}
          className="px-4 py-2 text-xs font-semibold transition-all"
          style={{ background: '#d4830c', borderRadius: '8px', color: '#fff', opacity: pending || !state.name.trim() ? 0.5 : 1 }}
        >
          {pending ? '…' : label}
        </button>
        <button onClick={onCancel} className="px-4 py-2 text-xs transition-opacity hover:opacity-70" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-xs transition-opacity hover:opacity-80"
      style={{ color: checked ? '#e8a020' : 'rgba(255,255,255,0.3)' }}
    >
      <span
        className="relative inline-flex w-8 h-4 rounded-full transition-colors"
        style={{ background: checked ? 'rgba(212,131,12,0.5)' : 'rgba(255,255,255,0.1)', border: checked ? '1px solid rgba(212,131,12,0.5)' : '1px solid rgba(255,255,255,0.1)' }}
      >
        <span
          className="absolute top-0.5 w-3 h-3 rounded-full transition-transform"
          style={{ background: checked ? '#e8a020' : 'rgba(255,255,255,0.3)', transform: checked ? 'translateX(17px)' : 'translateX(1px)' }}
        />
      </span>
      {label}
    </button>
  )
}

function MeetingTypeBadge({ meetingType }: { meetingType: string }) {
  const labels: Record<string, string> = { in_person: 'In Person', virtual: 'Virtual', phone: 'Phone' }
  return <span style={{ color: 'rgba(255,255,255,0.35)' }}>{labels[meetingType] ?? meetingType}</span>
}

function AvailabilityForm({
  rules, onToggle, onTimeChange, onSave, onCancel, pending,
}: {
  rules: Availability[]
  onToggle: (dow: number) => void
  onTimeChange: (dow: number, field: 'startTime' | 'endTime', val: string) => void
  onSave: () => void
  onCancel: () => void
  pending: boolean
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-white mb-3">Set availability</p>
      <div className="flex flex-col gap-2">
        {[0,1,2,3,4,5,6].map(dow => {
          const rule = rules.find(r => r.dayOfWeek === dow)
          const active = !!rule
          return (
            <div key={dow} className="flex items-center gap-3">
              <button
                onClick={() => onToggle(dow)}
                className="w-14 text-xs font-medium py-1 transition-all"
                style={{
                  borderRadius: '6px',
                  background: active ? 'rgba(212,131,12,0.15)' : 'rgba(255,255,255,0.05)',
                  color: active ? '#e8a020' : 'rgba(255,255,255,0.25)',
                  border: active ? '1px solid rgba(212,131,12,0.3)' : '1px solid transparent',
                }}
              >
                {DAY_SHORT[dow]}
              </button>
              {active && rule && (
                <>
                  <input
                    type="time"
                    value={rule.startTime}
                    onChange={e => onTimeChange(dow, 'startTime', e.target.value)}
                    style={{ ...fieldStyle, width: '90px' }}
                  />
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>to</span>
                  <input
                    type="time"
                    value={rule.endTime}
                    onChange={e => onTimeChange(dow, 'endTime', e.target.value)}
                    style={{ ...fieldStyle, width: '90px' }}
                  />
                </>
              )}
            </div>
          )
        })}
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={onSave}
          disabled={pending}
          className="px-4 py-2 text-xs font-semibold"
          style={{ background: '#d4830c', borderRadius: '8px', color: '#fff', opacity: pending ? 0.5 : 1 }}
        >
          {pending ? '…' : 'Save availability'}
        </button>
        <button onClick={onCancel} className="px-4 py-2 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

function FField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</label>
      {children}
    </div>
  )
}

function Btn({ children, onClick, danger, disabled }: { children: React.ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-xs px-2.5 py-1 transition-opacity hover:opacity-70"
      style={{
        background: danger ? 'rgba(192,57,27,0.1)' : 'rgba(255,255,255,0.06)',
        color: danger ? '#e05a3a' : 'rgba(255,255,255,0.5)',
        borderRadius: '6px',
        border: danger ? '1px solid rgba(192,57,27,0.2)' : '1px solid rgba(255,255,255,0.08)',
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  )
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  fontSize: '13px',
  color: '#fff',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  outline: 'none',
}
