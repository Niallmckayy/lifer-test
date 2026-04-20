'use client'

import type { Version } from '@/lib/types'

interface Props {
  version: Version
  siteName: string
  isDraft?: boolean
}

export default function WebsitePreview({ version, siteName, isDraft = false }: Props) {
  return (
    <div className="w-full h-full overflow-y-auto bg-white text-stone-900 select-none">

      {/* Draft banner */}
      {isDraft && (
        <div
          className="flex items-center gap-2 px-5 py-2 sticky top-0 z-10"
          style={{
            background: 'rgba(107,122,255,0.08)',
            borderBottom: '1px solid rgba(107,122,255,0.2)',
          }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: '#6b7aff' }}
          />
          <span
            className="text-xs uppercase tracking-widest font-semibold"
            style={{ color: '#6b7aff' }}
          >
            Draft — Not Live
          </span>
        </div>
      )}

      {/* Simulated site nav */}
      <div
        className="px-8 py-5 flex items-center justify-between"
        style={{ borderBottom: '1px solid #E7E5E4' }}
      >
        <span className="text-sm font-medium text-stone-900">{siteName}</span>
        <nav className="flex items-center gap-8">
          {['Work', 'Studio', 'Contact'].map(link => (
            <span key={link} className="text-xs text-stone-400 uppercase tracking-widest">{link}</span>
          ))}
        </nav>
      </div>

      {/* Hero */}
      <div className="px-8 py-20 bg-stone-950">
        <p className="text-xs uppercase tracking-widest text-stone-500 mb-8 font-mono">
          Architecture Studio · London
        </p>
        <h1
          className="text-4xl font-light leading-tight mb-6 max-w-lg"
          style={{ color: isDraft ? '#a5b4fc' : '#fff' }}
        >
          {version.headline}
        </h1>
        <p className="text-stone-400 text-sm leading-relaxed max-w-md">{version.subheading}</p>
        <div className="mt-10 flex gap-4">
          <span className="text-xs uppercase tracking-widest border border-stone-600 text-stone-300 px-6 py-3">
            View Work
          </span>
          <span className="text-xs uppercase tracking-widest text-stone-600 px-6 py-3">
            Contact
          </span>
        </div>
      </div>

      {/* Services */}
      <div className="px-8 py-16" style={{ borderBottom: '1px solid #E7E5E4' }}>
        <p className="text-xs uppercase tracking-widest text-stone-400 mb-10 font-mono">Services</p>
        <div className="grid grid-cols-2 gap-2">
          {version.services.map(s => (
            <div key={s} className="px-5 py-4 text-sm text-stone-600" style={{ border: '1px solid #E7E5E4' }}>
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* About */}
      <div className="px-8 py-16">
        <p className="text-xs uppercase tracking-widest text-stone-400 mb-6 font-mono">Studio</p>
        <p className="text-sm text-stone-600 leading-relaxed max-w-lg">{version.about}</p>
      </div>
    </div>
  )
}
