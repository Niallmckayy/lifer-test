'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BirdLogo from '@/components/ui/BirdLogo'
import { createPublicProspect } from '@/lib/prospect-actions'

const INDUSTRIES = [
  'Architecture',
  'Legal / Finance',
  'Medical / Healthcare',
  'Restaurant / Hospitality',
  'Fitness / Wellness',
  'Technology / SaaS',
  'Marketing / Creative',
  'Construction / Trades',
  'Retail',
  'Consulting',
  'Other',
]

const TONES = [
  { value: 'professional', label: 'Professional', sub: '& Trustworthy' },
  { value: 'warm',         label: 'Warm',         sub: '& Approachable' },
  { value: 'bold',         label: 'Bold',         sub: '& Confident' },
  { value: 'premium',      label: 'Premium',      sub: '& Exclusive' },
]

const BG      = '#0e0b07'
const ACCENT  = '#d4830c'
const TEXT    = '#f5e8d0'
const BORDER  = 'rgba(212,131,12,0.16)'

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(245,232,208,0.04)',
  border: '1px solid rgba(212,131,12,0.18)',
  borderRadius: '10px',
  color: TEXT,
  outline: 'none',
  padding: '11px 14px',
  fontSize: '14px',
  transition: 'border-color 0.15s',
}

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 500,
  color: 'rgba(245,232,208,0.4)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '6px',
  display: 'block',
}

export default function TryForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [businessName, setBusinessName] = useState('')
  const [industry,     setIndustry]     = useState('')
  const [description,  setDescription]  = useState('')
  const [tone,         setTone]         = useState('')
  const [error,        setError]        = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const fd = new FormData()
    fd.set('businessName', businessName)
    fd.set('industry',     industry)
    fd.set('description',  description)
    if (tone) fd.set('tone', tone)

    startTransition(async () => {
      const result = await createPublicProspect(fd)
      if (result.error) {
        setError(result.error)
      } else {
        router.push('/try/' + result.prospectId)
      }
    })
  }

  if (pending) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen gap-6"
        style={{ background: BG }}
      >
        <div style={{ color: ACCENT, animation: 'sway 1.8s ease-in-out infinite' }}>
          <BirdLogo size={52} />
        </div>
        <div className="text-center">
          <p className="font-semibold text-lg mb-1" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: TEXT }}>
            Building your site…
          </p>
          <p className="text-sm" style={{ color: 'rgba(245,232,208,0.35)' }}>
            Designing a custom website for {businessName || 'your business'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgba(245,232,208,0.2)' }}>
            This takes about 15–30 seconds
          </p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ background: ACCENT, animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
        <style>{`
          @keyframes bounce {
            0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
            40% { transform: translateY(-8px); opacity: 1; }
          }
          @keyframes sway {
            0%, 100% { transform: rotate(-4deg); }
            50% { transform: rotate(4deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: BG, color: TEXT }}>

      {/* Header */}
      <header
        className="flex items-center justify-between px-8 py-4"
        style={{ borderBottom: `1px solid ${BORDER}` }}
      >
        <Link href="/" className="flex items-center gap-2.5" style={{ color: ACCENT }}>
          <BirdLogo size={24} />
          <span
            className="text-lg font-semibold"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: TEXT }}
          >
            Lifer
          </span>
        </Link>
        <Link
          href="/login"
          className="text-sm transition-opacity hover:opacity-70"
          style={{ color: 'rgba(245,232,208,0.35)' }}
        >
          Already have an account? <span style={{ color: ACCENT }}>Sign in</span>
        </Link>
      </header>

      {/* Form */}
      <div className="flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg">

          <div className="mb-10 text-center">
            <div
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 mb-5"
              style={{
                background: 'rgba(212,131,12,0.1)',
                border: `1px solid rgba(212,131,12,0.25)`,
                borderRadius: '999px',
                color: '#e8a020',
              }}
            >
              <span style={{ color: ACCENT }}>●</span> No account needed
            </div>
            <h1
              className="text-3xl font-bold tracking-tight mb-3"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Generate your website
            </h1>
            <p className="text-sm" style={{ color: 'rgba(245,232,208,0.45)' }}>
              Tell us about your business and we&apos;ll build a real, live website — free, in about 20 seconds.
            </p>
          </div>

          <div
            className="px-8 py-8"
            style={{
              background: 'rgba(245,232,208,0.02)',
              borderRadius: '20px',
              border: '1px solid rgba(212,131,12,0.14)',
              boxShadow: '0 0 80px rgba(0,0,0,0.4)',
            }}
          >
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              <div>
                <label style={labelStyle}>Business Name *</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="e.g. Pacific Law Group"
                  required
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(212,131,12,0.6)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(212,131,12,0.18)')}
                />
              </div>

              <div>
                <label style={labelStyle}>Industry *</label>
                <select
                  value={industry}
                  onChange={e => setIndustry(e.target.value)}
                  required
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(212,131,12,0.6)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(212,131,12,0.18)')}
                >
                  <option value="" disabled style={{ background: '#17120c' }}>Select an industry…</option>
                  {INDUSTRIES.map(ind => (
                    <option key={ind} value={ind} style={{ background: '#17120c' }}>{ind}</option>
                  ))}
                </select>
              </div>

              {/* Tone picker */}
              <div>
                <label style={labelStyle}>Brand Tone <span style={{ opacity: 0.5, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {TONES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTone(tone === t.value ? '' : t.value)}
                      style={{
                        padding: '10px 6px',
                        borderRadius: '10px',
                        border: `1px solid ${tone === t.value ? 'rgba(212,131,12,0.7)' : 'rgba(212,131,12,0.18)'}`,
                        background: tone === t.value ? 'rgba(212,131,12,0.12)' : 'rgba(245,232,208,0.02)',
                        color: tone === t.value ? '#e8a020' : 'rgba(245,232,208,0.55)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s',
                        fontSize: '12px',
                        lineHeight: 1.3,
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '2px', color: tone === t.value ? '#e8a020' : TEXT }}>{t.label}</div>
                      <div style={{ fontSize: '11px', opacity: 0.6 }}>{t.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>
                  About your business *
                  <span
                    className="ml-2 normal-case"
                    style={{ color: description.length > 500 ? '#f87171' : 'rgba(245,232,208,0.2)', letterSpacing: 0, textTransform: 'none', fontWeight: 400 }}
                  >
                    {description.length}/600
                  </span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. We help London homeowners transform their spaces. Our clients are busy professionals who want quality without the hassle. We stand out through our fixed-price model — no surprises."
                  required
                  maxLength={600}
                  rows={5}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(212,131,12,0.6)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(212,131,12,0.18)')}
                />
                <p style={{ fontSize: '11px', color: 'rgba(245,232,208,0.25)', marginTop: '5px' }}>
                  Tip: describe what you offer, who you serve, and what makes you different.
                </p>
              </div>

              {error && (
                <div
                  className="px-4 py-3 text-sm"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '10px',
                    color: '#fca5a5',
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full text-sm font-semibold py-3.5 mt-1 transition-all hover:opacity-90"
                style={{
                  background: ACCENT,
                  borderRadius: '999px',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 0 32px rgba(212,131,12,0.3)',
                }}
              >
                Generate my site — it&apos;s free →
              </button>

            </form>
          </div>

          <p className="mt-5 text-center text-xs" style={{ color: 'rgba(245,232,208,0.2)' }}>
            No credit card. No account. Just a real website in seconds.
          </p>
        </div>
      </div>
    </div>
  )
}
