'use client'

import { useState } from 'react'

interface Props {
  src: string
}

export default function IframePreview({ src }: Props) {
  const [loaded, setLoaded] = useState(false)

  const displayUrl = src.replace(/^https?:\/\//, '')

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* URL bar */}
      <div
        className="shrink-0 flex items-center gap-2 px-3 py-1.5"
        style={{ background: '#f5f7ff', borderBottom: '1px solid rgba(0,0,0,0.06)' }}
      >
        <span
          className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: loaded ? '#22c55e' : '#f59e0b' }}
        />
        <span className="text-xs font-mono truncate flex-1" style={{ color: '#888' }}>
          {displayUrl}
        </span>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs shrink-0 transition-opacity hover:opacity-70"
          style={{ color: '#6b7aff' }}
        >
          ↗
        </a>
      </div>

      {/* Iframe area */}
      <div className="relative flex-1">
        {!loaded && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: '#f5f7ff' }}
          >
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-5 h-5 rounded-full border-2 animate-spin"
                style={{ borderColor: 'rgba(107,122,255,0.2)', borderTopColor: '#6b7aff' }}
              />
              <span className="text-xs" style={{ color: '#aaa' }}>Loading preview…</span>
            </div>
          </div>
        )}
        <iframe
          key={src}
          src={src}
          className="w-full h-full border-0"
          title="Website preview"
          onLoad={() => setLoaded(true)}
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.3s' }}
        />
      </div>
    </div>
  )
}
