'use client'

const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

interface Availability {
  dayOfWeek: number
  startTime: string
  endTime:   string
}

interface Resource {
  id:           string
  name:         string
  description:  string | null
  slotDuration: number
  bufferTime:   number
  maxCapacity:  number
  timezone:     string
  color:        string | null
  active:       boolean
  availability: Availability[]
}

export default function BookingResourceCard({ resource }: { resource: Resource }) {
  return (
    <div
      className="px-5 py-4"
      style={{
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '14px',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          {resource.color && (
            <span className="w-3 h-3 rounded-full shrink-0 mt-0.5" style={{ background: resource.color }} />
          )}
          <div>
            <p className="font-semibold text-white text-sm">{resource.name}</p>
            {resource.description && (
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{resource.description}</p>
            )}
          </div>
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded-full shrink-0"
          style={{
            background: resource.active ? 'rgba(77,158,58,0.12)' : 'rgba(255,255,255,0.05)',
            color: resource.active ? '#6dbf56' : 'rgba(255,255,255,0.3)',
          }}
        >
          {resource.active ? 'active' : 'inactive'}
        </span>
      </div>

      <div className="flex flex-wrap gap-4 text-xs mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
        <span>{resource.slotDuration} min slots</span>
        {resource.bufferTime > 0 && <span>{resource.bufferTime} min buffer</span>}
        {resource.maxCapacity > 1 && <span>up to {resource.maxCapacity} per slot</span>}
        <span>{resource.timezone}</span>
      </div>

      {resource.availability.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {resource.availability.map(a => (
            <span
              key={a.dayOfWeek}
              className="text-xs px-2 py-0.5"
              style={{ background: 'rgba(212,131,12,0.1)', color: '#e8a020', borderRadius: '6px' }}
            >
              {DAY_LABELS[a.dayOfWeek]} {a.startTime}–{a.endTime}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>No availability set</p>
      )}
    </div>
  )
}
