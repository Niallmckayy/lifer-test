'use client'

import { useTransition, useState } from 'react'
import { regenerateProspect, archiveProspect, convertProspectToClient, deleteProspect } from '@/lib/prospect-actions'

interface Props {
  prospectId: string
  status: string
  businessName: string
}

export default function ProspectActions({ prospectId, status, businessName }: Props) {
  const [pending, startTransition] = useTransition()
  const [showConvert, setShowConvert] = useState(false)
  const [convertEmail, setConvertEmail] = useState('')
  const [convertPlan, setConvertPlan] = useState('Starter')
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function handleRegenerate() {
    if (!confirm(`Regenerate site for "${businessName}"? This will overwrite the current HTML.`)) return
    startTransition(async () => {
      const result = await regenerateProspect(prospectId)
      if (result.error) setError(result.error)
    })
  }

  function handleArchive() {
    if (!confirm(`Archive "${businessName}"?`)) return
    startTransition(async () => {
      await archiveProspect(prospectId)
    })
  }

  function handleDelete() {
    if (!confirm(`Permanently delete "${businessName}"? This cannot be undone.`)) return
    startTransition(async () => {
      await deleteProspect(prospectId)
    })
  }

  function handleConvert(e: React.FormEvent) {
    e.preventDefault()
    if (!convertEmail) return
    startTransition(async () => {
      const result = await convertProspectToClient(prospectId, convertEmail, convertPlan)
      if (result.error) {
        setError(result.error)
      } else if (result.tempPassword) {
        setTempPassword(result.tempPassword)
        setShowConvert(false)
      }
    })
  }

  function handleCopy() {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const btnBase = 'text-xs font-medium px-3 py-1.5 transition-all'
  const disabledStyle = pending ? { opacity: 0.5, pointerEvents: 'none' as const } : {}

  if (tempPassword) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono px-2 py-1" style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', borderRadius: '6px' }}>
          {tempPassword}
        </span>
        <button
          onClick={handleCopy}
          className={btnBase}
          style={{ background: 'rgba(255,255,255,0.06)', color: copied ? '#4ade80' : 'rgba(255,255,255,0.5)', borderRadius: '6px' }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    )
  }

  if (showConvert) {
    return (
      <form onSubmit={handleConvert} className="flex items-center gap-2 flex-wrap" style={disabledStyle}>
        <input
          type="email"
          placeholder="client@email.com"
          value={convertEmail}
          onChange={e => setConvertEmail(e.target.value)}
          required
          className="text-xs px-2 py-1.5 outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.12)', width: '160px' }}
        />
        <select
          value={convertPlan}
          onChange={e => setConvertPlan(e.target.value)}
          className="text-xs px-2 py-1.5 outline-none"
          style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <option value="Starter">Starter</option>
          <option value="Growth">Growth</option>
          <option value="Pro">Pro</option>
        </select>
        <button
          type="submit"
          className={btnBase}
          style={{ background: '#d4830c', color: '#fff', borderRadius: '6px' }}
        >
          {pending ? 'Converting...' : 'Confirm'}
        </button>
        <button
          type="button"
          onClick={() => { setShowConvert(false); setError(null) }}
          className={btnBase}
          style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', borderRadius: '6px' }}
        >
          Cancel
        </button>
        {error && <span className="text-xs" style={{ color: '#f87171' }}>{error}</span>}
      </form>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap" style={disabledStyle}>
      {(status === 'READY' || status === 'ERROR') && (
        <>
          {status === 'READY' && (
            <button
              onClick={() => setShowConvert(true)}
              className={btnBase}
              style={{ background: '#d4830c', color: '#fff', borderRadius: '6px' }}
            >
              Convert
            </button>
          )}
          <button
            onClick={handleRegenerate}
            className={btnBase}
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', borderRadius: '6px' }}
          >
            {pending ? 'Working...' : 'Regenerate'}
          </button>
        </>
      )}
      {status === 'GENERATING' && (
        <span className="text-xs flex items-center gap-1.5" style={{ color: '#fbbf24' }}>
          <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#fbbf24' }} />
          Deploying...
        </span>
      )}
      {status !== 'CONVERTED' && status !== 'ARCHIVED' && (
        <button
          onClick={handleArchive}
          className={btnBase}
          style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)', borderRadius: '6px' }}
        >
          Archive
        </button>
      )}
      <button
        onClick={handleDelete}
        className={btnBase}
        style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', borderRadius: '6px' }}
      >
        Delete
      </button>
      {error && <span className="text-xs" style={{ color: '#f87171' }}>{error}</span>}
    </div>
  )
}
