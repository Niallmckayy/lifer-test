'use client'

import { useState, useTransition, useCallback } from 'react'
import { updateBookingTheme } from '@/lib/booking-actions'
import type { BookingTheme } from '@/lib/booking-theme'

interface Props {
  clientId:    string
  slug:        string | null
  savedTheme:  BookingTheme
  appUrl:      string
}

export default function BookingAppearance({ clientId, slug, savedTheme, appUrl }: Props) {
  const [primary,  setPrimary]  = useState(savedTheme.primaryColor)
  const [bg,       setBg]       = useState(savedTheme.backgroundColor)
  const [mode,     setMode]     = useState<'dark' | 'light'>(savedTheme.mode)
  const [radius,   setRadius]   = useState(savedTheme.borderRadius)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [pending,  start]       = useTransition()

  const previewUrl = useCallback(() => {
    if (!slug) return null
    const params = new URLSearchParams({
      preview:      '1',
      primaryColor: primary,
      bg,
      mode,
      radius:       String(radius),
    })
    return `${appUrl}/book/${slug}?${params.toString()}`
  }, [appUrl, slug, primary, bg, mode, radius])

  function handleSave() {
    setError(null)
    setSaved(false)
    start(async () => {
      const r = await updateBookingTheme(clientId, { primaryColor: primary, backgroundColor: bg, mode, borderRadius: radius })
      if (r.error) { setError(r.error); return }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  const url = previewUrl()

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Controls */}
        <div className="flex flex-col gap-4 min-w-[260px]">

          {/* Primary colour */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Accent colour</label>
            <div className="flex items-center gap-2.5">
              <input
                type="color"
                value={primary}
                onChange={e => setPrimary(e.target.value)}
                className="w-9 h-9 rounded-lg cursor-pointer border-0 p-0.5"
                style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '8px' }}
              />
              <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>{primary}</span>
            </div>
          </div>

          {/* Background colour */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Background colour</label>
            <div className="flex items-center gap-2.5">
              <input
                type="color"
                value={bg}
                onChange={e => setBg(e.target.value)}
                className="w-9 h-9 rounded-lg cursor-pointer border-0 p-0.5"
                style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '8px' }}
              />
              <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>{bg}</span>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Colour mode</label>
            <div className="flex gap-1.5">
              {(['dark', 'light'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="flex-1 py-1.5 text-xs font-medium transition-all capitalize"
                  style={{
                    borderRadius: '8px',
                    background: mode === m ? 'rgba(212,131,12,0.2)' : 'rgba(255,255,255,0.04)',
                    color:      mode === m ? '#e8a020'              : 'rgba(255,255,255,0.35)',
                    border:     mode === m ? '1px solid rgba(212,131,12,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Border radius */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Corner radius</label>
              <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>{radius}px</span>
            </div>
            <input
              type="range"
              min={4}
              max={20}
              value={radius}
              onChange={e => setRadius(+e.target.value)}
              className="w-full accent-[#d4830c]"
            />
            <div className="flex justify-between text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
              <span>Sharp</span>
              <span>Rounded</span>
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={handleSave}
              disabled={pending}
              className="px-4 py-2 text-xs font-semibold transition-all"
              style={{
                background:   '#d4830c',
                borderRadius: '8px',
                color:        '#fff',
                opacity:      pending ? 0.6 : 1,
              }}
            >
              {pending ? 'Saving…' : 'Save appearance'}
            </button>
            {saved  && <span className="text-xs" style={{ color: '#6dbf56' }}>Saved</span>}
            {error  && <span className="text-xs" style={{ color: '#e05a3a' }}>{error}</span>}
          </div>

          {/* Reset hint */}
          <button
            onClick={() => { setPrimary('#d4830c'); setBg('#0e0b07'); setMode('dark'); setRadius(14) }}
            className="text-xs text-left transition-opacity hover:opacity-70 w-fit"
            style={{ color: 'rgba(255,255,255,0.2)' }}
          >
            Reset to defaults
          </button>
        </div>

        {/* Live preview */}
        <div className="flex-1 flex flex-col gap-2">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Live preview</p>
          {url ? (
            <div
              className="relative overflow-hidden"
              style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', height: '520px' }}
            >
              {/* Scale wrapper so widget fits in a compact preview */}
              <div style={{ transformOrigin: 'top left', transform: 'scale(0.75)', width: '133.33%', height: '133.33%' }}>
                <iframe
                  key={url}
                  src={url}
                  style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                  title="Booking widget preview"
                />
              </div>
            </div>
          ) : (
            <div
              className="flex items-center justify-center"
              style={{ height: '520px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
            >
              <p className="text-xs text-center px-6" style={{ color: 'rgba(255,255,255,0.2)' }}>
                No booking page configured yet. Add a website slug to preview.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Embed snippet */}
      {slug && (
        <details className="group">
          <summary className="text-xs cursor-pointer select-none" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Embed code
          </summary>
          <pre
            className="mt-2 px-4 py-3 text-xs overflow-x-auto"
            style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
          >
{`<iframe
  src="${appUrl}/book/${slug}"
  width="100%"
  height="700"
  frameborder="0"
  style="border:none;"
></iframe>`}
          </pre>
        </details>
      )}
    </div>
  )
}
