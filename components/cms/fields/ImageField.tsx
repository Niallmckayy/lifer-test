'use client'

import { useRef, useState } from 'react'

type Props = {
  label: string
  value: string
  websiteId: string
  onChange: (url: string) => void
}

export function ImageField({ label, value, websiteId, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('websiteId', websiteId)

    try {
      const res = await fetch('/api/cms/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()
      onChange(url)
    } catch {
      setError('Upload failed — please try again')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(245,232,208,0.35)' }}>
        {label}
      </label>
      <div
        className="flex items-center gap-3 p-3"
        style={{
          background: 'rgba(245,232,208,0.04)',
          border: '1px solid rgba(245,232,208,0.1)',
          borderRadius: '8px',
        }}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            className="w-14 h-14 object-cover shrink-0"
            style={{ borderRadius: '6px' }}
          />
        ) : (
          <div
            className="w-14 h-14 shrink-0 flex items-center justify-center"
            style={{ background: 'rgba(245,232,208,0.06)', borderRadius: '6px' }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2" width="16" height="16" rx="2" stroke="rgba(245,232,208,0.2)" strokeWidth="1.25" />
              <circle cx="7" cy="7.5" r="1.5" stroke="rgba(245,232,208,0.2)" strokeWidth="1.25" />
              <path d="M2 13l4.5-4 3 3 2.5-2.5L18 14" stroke="rgba(245,232,208,0.2)" strokeWidth="1.25" strokeLinejoin="round" />
            </svg>
          </div>
        )}
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          {value && (
            <span className="text-xs truncate" style={{ color: 'rgba(245,232,208,0.3)' }}>
              {value.split('/').pop()}
            </span>
          )}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="text-xs font-medium px-3 py-1.5 self-start transition-opacity"
            style={{
              background: 'rgba(212,131,12,0.15)',
              color: '#e8a020',
              borderRadius: '6px',
              border: '1px solid rgba(212,131,12,0.2)',
              cursor: uploading ? 'not-allowed' : 'pointer',
              opacity: uploading ? 0.5 : 1,
            }}
          >
            {uploading ? 'Uploading…' : value ? 'Replace' : 'Upload image'}
          </button>
          {error && <span className="text-xs" style={{ color: '#e05a3a' }}>{error}</span>}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}
