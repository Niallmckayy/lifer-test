'use client'

import { useState, useTransition } from 'react'
import { importClientSite } from '@/lib/actions'

interface Props {
  websiteId:   string
  hasImport:   boolean  // htmlContent already set
}

export default function AdminImportForm({ websiteId, hasImport }: Props) {
  const [open,    setOpen]    = useState(false)
  const [tab,     setTab]     = useState<'url' | 'paste'>('url')
  const [url,     setUrl]     = useState('')
  const [html,    setHtml]    = useState('')
  const [error,   setError]   = useState<string | null>(null)
  const [done,    setDone]    = useState(hasImport)
  const [isPending, start]    = useTransition()

  const inp: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
    padding: '7px 10px', fontSize: '12px', color: '#fff', outline: 'none',
    fontFamily: 'monospace',
  }
  const tabStyle = (active: boolean): React.CSSProperties => ({
    fontSize: '11px', fontWeight: 600, padding: '4px 10px', cursor: 'pointer',
    border: 'none', borderRadius: '6px',
    background: active ? 'rgba(212,131,12,0.18)' : 'transparent',
    color: active ? '#e8a020' : 'rgba(255,255,255,0.3)',
  })

  function handleSubmit() {
    setError(null)
    const input = tab === 'url'
      ? { url: url.trim() }
      : { html: html.trim() }
    if (tab === 'url' && !url.trim()) return
    if (tab === 'paste' && !html.trim()) return

    start(async () => {
      const res = await importClientSite(websiteId, input)
      if (res?.error) { setError(res.error); return }
      setDone(true)
      setOpen(false)
    })
  }

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className="text-xs font-medium transition-opacity hover:opacity-70"
        style={{ color: done ? '#6dbf56' : '#e8a020', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        {open ? 'close' : done ? 're-import' : 'import'}
      </button>

      {open && (
        <div
          className="mt-3 flex flex-col gap-2.5 p-3 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', minWidth: '240px' }}
        >
          {/* Tabs */}
          <div className="flex gap-1">
            <button style={tabStyle(tab === 'url')}   onClick={() => setTab('url')}>   URL</button>
            <button style={tabStyle(tab === 'paste')} onClick={() => setTab('paste')}>Paste HTML</button>
          </div>

          {tab === 'url' ? (
            <div className="flex flex-col gap-1">
              <label className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Live site URL</label>
              <input
                value={url} onChange={e => setUrl(e.target.value)}
                placeholder="https://reset-recovery.vercel.app"
                style={inp}
              />
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
                Relative asset paths will be rewritten to absolute automatically.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Paste HTML</label>
              <textarea
                value={html} onChange={e => setHtml(e.target.value)}
                placeholder="<!DOCTYPE html>..."
                rows={5}
                style={{ ...inp, fontFamily: 'monospace', resize: 'vertical' }}
              />
            </div>
          )}

          {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={isPending || (tab === 'url' ? !url.trim() : !html.trim())}
            className="text-xs font-semibold text-white py-2 transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ background: '#d4830c', borderRadius: '8px', cursor: 'pointer', border: 'none' }}
          >
            {isPending ? (tab === 'url' ? 'Fetching…' : 'Saving…') : (done ? 'Re-import' : 'Import')}
          </button>
        </div>
      )}
    </div>
  )
}
