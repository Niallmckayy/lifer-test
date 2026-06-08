'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from './actions'

export default function NewClientForm() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await createClient(formData)

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else if (result.tempPassword) {
      setTempPassword(result.tempPassword)
    }
  }

  const inputStyle = {
    width: '100%',
    background: '#f5f7ff',
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '14px',
    color: '#0d0d0d',
    outline: 'none',
  }

  if (tempPassword) {
    return (
      <div className="flex flex-col gap-6">
        <div
          className="px-5 py-4 rounded-xl"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
        >
          <p className="text-sm font-semibold mb-1" style={{ color: '#16a34a' }}>Client created</p>
          <p className="text-xs" style={{ color: '#555' }}>
            Share these credentials with your client. The password is shown only once.
          </p>
        </div>

        <div
          className="px-5 py-4 rounded-xl font-mono text-sm flex flex-col gap-2"
          style={{ background: '#f5f7ff', border: '1px solid rgba(0,0,0,0.09)' }}
        >
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#888' }}>Credentials</p>
          <p style={{ color: '#0d0d0d' }}>
            <span style={{ color: '#888' }}>Email: </span>
            {/* Will be shown from form data — redirect after copy */}
          </p>
          <p style={{ color: '#0d0d0d' }}>
            <span style={{ color: '#888' }}>Password: </span>
            <span
              className="font-bold"
              style={{ color: '#d4830c', letterSpacing: '0.05em' }}
            >
              {tempPassword}
            </span>
          </p>
        </div>

        <button
          onClick={() => router.push('/dashboard/admin')}
          className="w-full text-sm font-medium text-white py-3 transition-opacity hover:opacity-90"
          style={{ background: '#111', borderRadius: '999px' }}
        >
          Back to admin
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium" style={{ color: '#555' }}>Client name</label>
        <input name="name" type="text" required placeholder="MK Architects" style={inputStyle} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium" style={{ color: '#555' }}>Email</label>
        <input name="email" type="email" required placeholder="client@example.com" style={inputStyle} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium" style={{ color: '#555' }}>Plan</label>
        <select
          name="plan"
          required
          style={{ ...inputStyle, appearance: 'none' as const }}
          defaultValue="Starter"
        >
          <option value="Starter">Starter</option>
          <option value="Growth">Growth</option>
          <option value="Studio">Studio</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium" style={{ color: '#555' }}>Website name</label>
        <input name="websiteName" type="text" required placeholder="MK Architects" style={inputStyle} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium" style={{ color: '#555' }}>
          Website slug{' '}
          <span style={{ color: '#aaa', fontWeight: 400 }}>— used in the URL (/sites/your-slug)</span>
        </label>
        <input
          name="slug"
          type="text"
          required
          placeholder="mk-architects"
          pattern="[a-z0-9-]+"
          title="Lowercase letters, numbers, and hyphens only"
          style={inputStyle}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium" style={{ color: '#555' }}>
          Live site URL{' '}
          <span style={{ color: '#aaa', fontWeight: 400 }}>— external URL if already hosted (e.g. Vercel)</span>
        </label>
        <input
          name="previewUrl"
          type="url"
          placeholder="https://client-site.vercel.app"
          style={inputStyle}
        />
      </div>

      {error && (
        <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full text-sm font-medium text-white py-3 mt-2 transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: '#111', borderRadius: '999px' }}
      >
        {loading ? 'Creating…' : 'Create client'}
      </button>
    </form>
  )
}
