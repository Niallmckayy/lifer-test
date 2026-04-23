'use client'

import { useState, useTransition } from 'react'
import { resetClientPassword } from '@/lib/actions'

export default function AdminResetPasswordButton({ clientId }: { clientId: string }) {
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, start] = useTransition()

  function handleReset() {
    if (!confirm('Reset this client\'s password? They will need the new temporary password to log in.')) return
    setError(null)
    start(async () => {
      const res = await resetClientPassword(clientId)
      if (res.error) { setError(res.error); return }
      if (res.tempPassword) setTempPassword(res.tempPassword)
    })
  }

  if (tempPassword) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>New password:</span>
        <code
          className="text-xs font-mono px-2 py-1 select-all"
          style={{ background: 'rgba(77,158,58,0.12)', color: '#6dbf56', borderRadius: '6px', border: '1px solid rgba(77,158,58,0.2)' }}
        >
          {tempPassword}
        </code>
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>shown once</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleReset}
        disabled={isPending}
        className="text-xs font-medium transition-opacity hover:opacity-70 disabled:opacity-40"
        style={{ color: 'rgba(245,232,208,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
      >
        {isPending ? 'Resetting…' : 'Reset password'}
      </button>
      {error && <span className="text-xs" style={{ color: '#f87171' }}>{error}</span>}
    </div>
  )
}
