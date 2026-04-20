'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setLoading(true)
    const result = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (result?.error) { setError('Invalid email or password.'); return }
    router.push(email === 'admin@example.com' ? '/dashboard/admin' : '/dashboard/customer')
    router.refresh()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(245,232,208,0.12)',
    borderRadius: '10px',
    padding: '11px 14px',
    fontSize: '14px',
    color: '#fff',
    outline: 'none',
    transition: 'border-color 0.15s',
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-xs font-medium" style={{ color: 'rgba(245,232,208,0.5)' }}>
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = 'rgba(212,131,12,0.6)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'rgba(245,232,208,0.12)')}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-xs font-medium" style={{ color: 'rgba(245,232,208,0.5)' }}>
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = 'rgba(212,131,12,0.6)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'rgba(245,232,208,0.12)')}
        />
      </div>

      {error && (
        <div
          className="px-4 py-2.5 rounded-lg text-xs font-medium"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 mt-1"
        style={{
          background: '#d4830c',
          borderRadius: '999px',
          padding: '12px',
          color: '#fff',
          boxShadow: '0 0 24px rgba(212,131,12,0.3)',
        }}
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>

      <p className="text-xs text-center leading-relaxed mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
        Demo:{' '}
        <span style={{ color: 'rgba(255,255,255,0.45)' }}>admin@example.com</span> / admin123
        {' '}·{' '}
        <span style={{ color: 'rgba(255,255,255,0.45)' }}>mk@example.com</span> / customer123
      </p>
    </form>
  )
}
