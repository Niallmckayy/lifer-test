'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createAndGenerateProspect } from '@/lib/prospect-actions'

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

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function NewProspectForm() {
  const router   = useRouter()
  const [pending, startTransition] = useTransition()

  const [businessName,  setBusinessName]  = useState('')
  const [industry,      setIndustry]      = useState('')
  const [description,   setDescription]   = useState('')
  const [slug,          setSlug]          = useState('')
  const [prospectEmail, setProspectEmail] = useState('')
  const [slugEdited,    setSlugEdited]    = useState(false)
  const [error,         setError]         = useState<string | null>(null)

  function handleNameChange(val: string) {
    setBusinessName(val)
    if (!slugEdited) setSlug(toSlug(val))
  }

  function handleSlugChange(val: string) {
    setSlug(toSlug(val))
    setSlugEdited(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const fd = new FormData()
    fd.set('businessName',  businessName)
    fd.set('industry',      industry)
    fd.set('description',   description)
    fd.set('slug',          slug)
    fd.set('prospectEmail', prospectEmail)

    startTransition(async () => {
      const result = await createAndGenerateProspect(fd)
      if (result.error) {
        setError(result.error)
      } else {
        router.push('/dashboard/admin/prospects')
      }
    })
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#fff',
    outline: 'none',
    padding: '10px 14px',
    fontSize: '14px',
    width: '100%',
    transition: 'border-color 0.15s',
  } as React.CSSProperties

  const labelStyle = {
    fontSize: '12px',
    fontWeight: 500,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    marginBottom: '6px',
    display: 'block',
  }

  if (pending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6" style={{ background: '#0e0b07' }}>
        <div
          className="flex items-center justify-center w-14 h-14"
          style={{ background: '#d4830c', borderRadius: '16px', animation: 'pulse 1.5s ease-in-out infinite' }}
        >
          <span className="text-white text-xl font-bold">S</span>
        </div>
        <div className="text-center">
          <p className="text-white font-semibold text-lg mb-1">Generating your website...</p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Claude is designing a custom site for {businessName || 'your prospect'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
            This takes about 15–30 seconds
          </p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: '#d4830c',
                animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
        <style>{`
          @keyframes bounce {
            0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
            40% { transform: translateY(-8px); opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#0e0b07' }}>
      <div className="max-w-xl mx-auto px-6 py-12">

        <div className="mb-8">
          <a
            href="/dashboard/admin/prospects"
            className="text-xs transition-opacity hover:opacity-70 mb-6 inline-block"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            ← Back to Prospects
          </a>
          <h1 className="text-2xl font-bold text-white mb-1">Generate Prospect Site</h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Claude will build a custom, industry-specific website and deploy it to a live URL.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          <div>
            <label style={labelStyle}>Business Name *</label>
            <input
              type="text"
              value={businessName}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="e.g. Pacific Law Group"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Industry *</label>
            <select
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              required
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="" disabled>Select an industry...</option>
              {INDUSTRIES.map(ind => (
                <option key={ind} value={ind} style={{ background: '#1a1a2e' }}>{ind}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>
              Business Description *
              <span className="ml-2 normal-case" style={{ color: description.length > 450 ? '#f87171' : 'rgba(255,255,255,0.2)' }}>
                {description.length}/500
              </span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the business — what they do, their clients, their values, what makes them different..."
              required
              maxLength={500}
              rows={5}
              style={{ ...inputStyle, resize: 'vertical' as const, fontFamily: 'inherit' }}
            />
          </div>

          <div>
            <label style={labelStyle}>
              URL Slug *
              <span className="ml-2 normal-case font-normal" style={{ color: 'rgba(255,255,255,0.2)' }}>
                auto-generated
              </span>
            </label>
            <input
              type="text"
              value={slug}
              onChange={e => handleSlugChange(e.target.value)}
              placeholder="pacific-law-group"
              required
              style={inputStyle}
            />
            {slug && (
              <p className="mt-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
                GitHub repo: prospect-{slug}
              </p>
            )}
          </div>

          <div>
            <label style={labelStyle}>Prospect Email <span className="normal-case font-normal">(optional)</span></label>
            <input
              type="email"
              value={prospectEmail}
              onChange={e => setProspectEmail(e.target.value)}
              placeholder="contact@prospect.com"
              style={inputStyle}
            />
          </div>

          {error && (
            <div
              className="px-4 py-3 text-sm"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: '#f87171' }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="text-sm font-semibold py-3 transition-all hover:opacity-90 mt-2"
            style={{ background: '#d4830c', borderRadius: '12px', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            Generate Website
          </button>

        </form>
      </div>
    </div>
  )
}
