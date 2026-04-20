'use client'

import { useState, useTransition } from 'react'
import { updateWebsiteDeployment } from '@/lib/actions'

interface Props {
  websiteId: string
  githubRepo: string | null
  githubBranch: string | null
  vercelProjectId: string | null
  vercelTeamId: string | null
  previewUrl: string | null
}

export default function AdminDeploymentForm({
  websiteId,
  githubRepo,
  githubBranch,
  vercelProjectId,
  vercelTeamId,
  previewUrl,
}: Props) {
  const [open, setOpen] = useState(false)
  const [repo, setRepo]       = useState(githubRepo ?? '')
  const [branch, setBranch]   = useState(githubBranch ?? 'main')
  const [projId, setProjId]   = useState(vercelProjectId ?? '')
  const [teamId, setTeamId]   = useState(vercelTeamId ?? '')
  const [url, setUrl]         = useState(previewUrl ?? '')
  const [isPending, startTransition] = useTransition()

  function save() {
    startTransition(async () => {
      await updateWebsiteDeployment(websiteId, {
        githubRepo:     repo || undefined,
        githubBranch:   branch || undefined,
        vercelProjectId: projId || undefined,
        vercelTeamId:   teamId || undefined,
        previewUrl:     url || undefined,
      })
      setOpen(false)
    })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    padding: '7px 10px',
    fontSize: '12px',
    color: '#fff',
    outline: 'none',
    fontFamily: 'monospace',
  }

  const labelColor = 'rgba(255,255,255,0.35)'

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className="text-xs font-medium transition-opacity hover:opacity-70"
        style={{ color: '#e8a020', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        {open ? 'close' : githubRepo ? 'edit deploy' : 'add deploy'}
      </button>

      {!open && githubRepo && (
        <div className="mt-1 text-xs font-mono truncate max-w-[140px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
          {githubRepo}
        </div>
      )}

      {open && (
        <div className="mt-3 flex flex-col gap-2.5 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: labelColor }}>GitHub repo (owner/name)</label>
            <input value={repo} onChange={e => setRepo(e.target.value)} placeholder="Niallmckayy/mk-architects" style={inputStyle} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: labelColor }}>Default branch</label>
            <input value={branch} onChange={e => setBranch(e.target.value)} placeholder="main" style={inputStyle} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: labelColor }}>Vercel project ID</label>
            <input value={projId} onChange={e => setProjId(e.target.value)} placeholder="prj_..." style={inputStyle} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: labelColor }}>Vercel team ID (optional)</label>
            <input value={teamId} onChange={e => setTeamId(e.target.value)} placeholder="team_..." style={inputStyle} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: labelColor }}>Live preview URL (Vercel)</label>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." style={{ ...inputStyle, fontFamily: 'inherit' }} />
          </div>
          <button
            onClick={save}
            disabled={isPending}
            className="text-xs font-semibold text-white py-2 transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: '#d4830c', borderRadius: '8px' }}
          >
            {isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}
    </div>
  )
}
