'use client'

import { useState, useTransition } from 'react'
import { sendGoLiveInvite } from '@/lib/actions'

export default function GoLiveInviteButton({ clientId }: { clientId: string }) {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, start] = useTransition()

  function handleClick() {
    setError(null)
    start(async () => {
      const res = await sendGoLiveInvite(clientId)
      if (res.error) { setError(res.error); return }
      setSent(true)
    })
  }

  if (sent) {
    return <span className="text-xs font-medium" style={{ color: '#6dbf56' }}>Sent ✓</span>
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="text-xs font-medium transition-opacity hover:opacity-70 disabled:opacity-40"
        style={{ color: '#c8a96e', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
      >
        {isPending ? 'Sending…' : 'Send invite →'}
      </button>
      {error && <span className="text-xs" style={{ color: '#f87171' }}>{error}</span>}
    </div>
  )
}
