'use client'

import { useState, useTransition } from 'react'
import { updatePassword } from '@/lib/actions'

interface Props {
  userId: string
  email: string
  memberSince: string
}

export default function SettingsClient({ userId, email, memberSince }: Props) {
  const [current, setCurrent] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)

    if (newPass !== confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match.' })
      return
    }
    if (newPass.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters.' })
      return
    }

    startTransition(async () => {
      const result = await updatePassword(userId, current, newPass)
      if (result.success) {
        setMessage({ type: 'success', text: 'Password updated successfully.' })
        setCurrent('')
        setNewPass('')
        setConfirm('')
      } else {
        setMessage({ type: 'error', text: result.error ?? 'Something went wrong.' })
      }
    })
  }

  const inputStyle = {
    background: 'rgba(245,232,208,0.04)',
    border: '1px solid rgba(245,232,208,0.1)',
    borderRadius: '10px',
    color: '#f5e8d0',
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Account info */}
      <div
        className="px-6 py-5 flex flex-col gap-4"
        style={{
          background: 'rgba(245,232,208,0.03)',
          borderRadius: '16px',
          border: '1px solid rgba(245,232,208,0.07)',
        }}
      >
        <h2 className="text-sm font-semibold" style={{ color: '#f5e8d0' }}>Account</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'rgba(245,232,208,0.3)' }}>Email</p>
            <p className="text-sm font-mono" style={{ color: 'rgba(245,232,208,0.6)' }}>{email}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'rgba(245,232,208,0.3)' }}>Member since</p>
            <p className="text-sm" style={{ color: 'rgba(245,232,208,0.6)' }}>{memberSince}</p>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div
        className="px-6 py-5 flex flex-col gap-4"
        style={{
          background: 'rgba(245,232,208,0.03)',
          borderRadius: '16px',
          border: '1px solid rgba(245,232,208,0.07)',
        }}
      >
        <h2 className="text-sm font-semibold" style={{ color: '#f5e8d0' }}>Change password</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {[
            { label: 'Current password', value: current, onChange: setCurrent },
            { label: 'New password',     value: newPass, onChange: setNewPass },
            { label: 'Confirm new password', value: confirm, onChange: setConfirm },
          ].map(field => (
            <div key={field.label}>
              <label className="block text-xs mb-1.5" style={{ color: 'rgba(245,232,208,0.35)' }}>
                {field.label}
              </label>
              <input
                type="password"
                required
                value={field.value}
                onChange={e => field.onChange(e.target.value)}
                className="w-full px-4 py-3 text-sm focus:outline-none transition-colors"
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(212,131,12,0.5)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(245,232,208,0.1)')}
              />
            </div>
          ))}

          {message && (
            <p
              className="text-xs px-4 py-2.5 rounded-lg"
              style={{
                background: message.type === 'success' ? 'rgba(77,158,58,0.12)' : 'rgba(192,57,27,0.12)',
                color: message.type === 'success' ? '#6dbf56' : '#e05a3a',
              }}
            >
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="text-sm font-semibold py-3 mt-1 transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: '#d4830c', borderRadius: '999px', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            {pending ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  )
}
