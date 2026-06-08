'use client'

import { useState, useTransition } from 'react'
import { cancelBookingAsClient } from '@/lib/booking-actions'

export default function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const [confirmed, setConfirmed] = useState(false)
  const [done, setDone]           = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [pending, start]          = useTransition()

  if (done) return <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>cancelled</span>

  if (!confirmed) {
    return (
      <button
        onClick={() => setConfirmed(true)}
        className="text-xs transition-opacity hover:opacity-70"
        style={{ color: '#e05a3a' }}
      >
        Cancel
      </button>
    )
  }

  return (
    <span className="flex items-center gap-2 text-xs">
      <span style={{ color: 'rgba(255,255,255,0.4)' }}>Sure?</span>
      <button
        disabled={pending}
        onClick={() => start(async () => {
          const r = await cancelBookingAsClient(bookingId)
          if (r.error) { setError(r.error); setConfirmed(false) }
          else setDone(true)
        })}
        className="transition-opacity hover:opacity-70"
        style={{ color: '#e05a3a' }}
      >
        {pending ? '…' : 'Yes'}
      </button>
      <button
        onClick={() => { setConfirmed(false); setError(null) }}
        style={{ color: 'rgba(255,255,255,0.25)' }}
      >
        No
      </button>
      {error && <span style={{ color: '#e05a3a' }}>{error}</span>}
    </span>
  )
}
