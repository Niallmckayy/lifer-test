'use client'

import { use, useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import BirdLogo from '@/components/ui/BirdLogo'
import { claimProspect } from '@/lib/prospect-actions'

const ACCENT  = '#d4830c'
const TEXT    = '#f5e8d0'
const BG      = '#0e0b07'
const BORDER  = 'rgba(212,131,12,0.16)'

const inputStyle: React.CSSProperties = {
  background: 'rgba(245,232,208,0.05)',
  border: '1px solid rgba(245,232,208,0.12)',
  borderRadius: '8px',
  color: '#fff',
  outline: 'none',
  padding: '8px 12px',
  fontSize: '13px',
  transition: 'border-color 0.15s',
  minWidth: 0,
}

export default function TryPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [ready,    setReady]    = useState(false)

  // Brief delay so the iframe has a moment to start loading before we show the banner
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 300)
    return () => clearTimeout(t)
  }, [])

  function handleClaim(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('Please enter your email and a password.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    startTransition(async () => {
      const result = await claimProspect(id, email, password)
      if (result.error) {
        setError(result.error)
        return
      }
      const signInResult = await signIn('credentials', { email, password, redirect: false })
      if (signInResult?.error) {
        setError('Account created but sign-in failed — try logging in manually.')
        return
      }
      router.push('/dashboard/customer')
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col" style={{ height: '100vh', background: BG, overflow: 'hidden' }}>

      {/* ── Sticky claim banner ── */}
      <div
        className="shrink-0 flex flex-col gap-0"
        style={{
          background: 'rgba(14,11,7,0.97)',
          borderBottom: `1px solid ${BORDER}`,
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Top row */}
        <div className="flex items-center gap-4 px-5 py-3 flex-wrap">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0" style={{ color: ACCENT }}>
            <BirdLogo size={20} />
            <span
              className="text-sm font-semibold"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: TEXT }}
            >
              Lifer
            </span>
          </Link>

          <div className="hidden sm:block w-px h-4 shrink-0" style={{ background: 'rgba(245,232,208,0.1)' }} />

          {/* Headline */}
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: '#4d9e3a', boxShadow: '0 0 6px rgba(77,158,58,0.5)' }}
            />
            <p className="text-sm font-semibold" style={{ color: TEXT }}>
              Your site is ready —{' '}
              <span style={{ color: 'rgba(245,232,208,0.5)', fontWeight: 400 }}>sign up to save it</span>
            </p>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Claim form */}
          <form
            onSubmit={handleClaim}
            className="flex items-center gap-2 flex-wrap"
          >
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{ ...inputStyle, width: '180px' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(212,131,12,0.6)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(245,232,208,0.12)')}
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="choose a password"
              style={{ ...inputStyle, width: '160px' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(212,131,12,0.6)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(245,232,208,0.12)')}
            />
            <button
              type="submit"
              disabled={pending}
              className="text-xs font-semibold px-4 py-2 transition-all hover:opacity-90 disabled:opacity-50 shrink-0"
              style={{
                background: ACCENT,
                borderRadius: '999px',
                color: '#fff',
                border: 'none',
                cursor: pending ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 0 20px rgba(212,131,12,0.25)',
              }}
            >
              {pending ? 'Saving…' : 'Save & sign up →'}
            </button>
          </form>
        </div>

        {/* Error / sub-row */}
        {error ? (
          <div
            className="px-5 py-2 text-xs font-medium"
            style={{
              background: 'rgba(239,68,68,0.08)',
              borderTop: '1px solid rgba(239,68,68,0.15)',
              color: '#fca5a5',
            }}
          >
            {error}
          </div>
        ) : (
          <div
            className="px-5 py-1.5 flex items-center gap-3"
            style={{ borderTop: '1px solid rgba(245,232,208,0.05)' }}
          >
            <p className="text-xs" style={{ color: 'rgba(245,232,208,0.25)' }}>
              Leave without saving and you&apos;ll lose this site.
            </p>
            <span style={{ color: 'rgba(245,232,208,0.1)' }}>·</span>
            <Link
              href="/login"
              className="text-xs transition-opacity hover:opacity-70"
              style={{ color: 'rgba(245,232,208,0.35)' }}
            >
              Already have an account? Sign in
            </Link>
          </div>
        )}
      </div>

      {/* ── Preview iframe ── */}
      <div className="flex-1 relative" style={{ overflow: 'hidden' }}>
        {!ready && (
          <div
            className="absolute inset-0 flex items-center justify-center flex-col gap-4"
            style={{ background: BG, zIndex: 10 }}
          >
            <div style={{ color: ACCENT, animation: 'sway 1.8s ease-in-out infinite' }}>
              <BirdLogo size={44} />
            </div>
            <p className="text-sm" style={{ color: 'rgba(245,232,208,0.4)' }}>Loading your site…</p>
            <style>{`
              @keyframes sway {
                0%, 100% { transform: rotate(-4deg); }
                50% { transform: rotate(4deg); }
              }
            `}</style>
          </div>
        )}
        <iframe
          src={`/preview/prospects/${id}`}
          className="w-full h-full"
          style={{ border: 'none', display: 'block' }}
          title="Your generated website"
        />
      </div>

    </div>
  )
}
