'use client'

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import SignOutButton from '@/components/ui/SignOutButton'
import BirdLogo from '@/components/ui/BirdLogo'
import ChatPanel from '@/components/ui/ChatPanel'
import IframePreview from '@/components/ui/IframePreview'
import { resetDraft, submitPullRequest } from '@/lib/actions'
import DirectEditPanel from '@/components/ui/DirectEditPanel'
import type { ContentBrief } from '@/lib/claude'

interface Request {
  id: string
  message: string
  status: string
  createdAt: string
}

interface Props {
  clientId: string
  clientName: string
  websiteId: string
  websiteSlug: string
  websiteName: string
  websiteUrl: string
  previewUrl: string | null
  hasDraft: boolean
  draftRequestId: string | null
  draftHasGithub: boolean
  draftPreviewUrl: string | null
  draftPrUrl: string | null
  hasHtmlContent: boolean
  contentBrief: string | null
  draftContentBrief: string | null
  usedRequests: number
  requestLimit: number
  recentRequests: Request[]
}

export default function CustomerDashboardClient({
  clientId,
  clientName,
  websiteId,
  websiteSlug,
  websiteUrl,
  previewUrl: externalUrl,
  hasHtmlContent,
  hasDraft,
  draftRequestId,
  draftHasGithub,
  draftPreviewUrl,
  contentBrief,
  draftContentBrief,
  draftPrUrl,
  usedRequests,
  requestLimit,
  recentRequests,
}: Props) {
  const [previewMode, setPreviewMode] = useState<'live' | 'draft'>('live')
  const [panelMode, setPanelMode] = useState<'chat' | 'edit'>('chat')
  const [isResetting, startReset] = useTransition()
  const [isSubmittingPR, startSubmitPR] = useTransition()
  const [prUrl, setPrUrl] = useState<string | null>(draftPrUrl)
  const clearChatRef = useRef<(() => void) | null>(null)

  const activeMode = hasDraft ? previewMode : 'live'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const internalDraftUrl = `${appUrl}/sites/${websiteSlug}?draft=1`
  const internalLiveUrl = `${appUrl}/sites/${websiteSlug}`

  const iframeSrc =
    activeMode === 'draft'
      ? (draftPreviewUrl ?? internalDraftUrl)
      : (hasHtmlContent ? internalLiveUrl : (externalUrl ?? internalLiveUrl))

  const atLimit = usedRequests >= requestLimit
  const pct = Math.min((usedRequests / requestLimit) * 100, 100)

  const activeBriefJson = draftContentBrief ?? contentBrief
  const activeBrief: ContentBrief | null = activeBriefJson ? JSON.parse(activeBriefJson) as ContentBrief : null
  const hasEditPanel = !!activeBrief

  function handleDiscardDraft() {
    startReset(async () => {
      await resetDraft(websiteId)
      setPreviewMode('live')
      clearChatRef.current?.()
    })
  }

  function handleLooksGood() {
    if (!draftRequestId) return
    startSubmitPR(async () => {
      const result = await submitPullRequest(draftRequestId)
      if (result.prUrl) setPrUrl(result.prUrl)
    })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#0e0b07' }}>

      {/* ── Header ───────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-6 py-3 shrink-0"
        style={{
          background: 'rgba(14,11,7,0.92)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(212,131,12,0.14)',
        }}
      >
        <div className="flex items-center gap-4">
          <Link href="/dashboard/customer" className="flex items-center gap-2.5" style={{ color: '#d4830c' }}>
            <BirdLogo size={20} />
            <span className="text-sm font-semibold" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#f5e8d0' }}>
              Lifer
            </span>
          </Link>

          <span className="block w-px h-4" style={{ background: 'rgba(245,232,208,0.1)' }} />

          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: '#4d9e3a', boxShadow: '0 0 6px rgba(77,158,58,0.5)' }} />
            <span className="text-sm font-medium" style={{ color: '#f5e8d0' }}>{clientName}</span>
          </div>
        </div>

        <div className="flex items-center gap-5">
          {/* Usage meter */}
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: 'rgba(245,232,208,0.35)' }}>Requests</span>
            <div
              className="w-24 h-1.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(245,232,208,0.08)' }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  background: atLimit
                    ? 'linear-gradient(90deg, #c0391b, #e05a3a)'
                    : 'linear-gradient(90deg, #d4830c, #e8a020)',
                }}
              />
            </div>
            <span className="text-xs tabular-nums" style={{ color: atLimit ? '#e05a3a' : 'rgba(245,232,208,0.5)' }}>
              {usedRequests}/{requestLimit}
            </span>
          </div>

          <span className="block w-px h-4" style={{ background: 'rgba(245,232,208,0.1)' }} />

          <SignOutButton
            className="text-xs font-medium transition-opacity hover:opacity-70"
            style={{ color: 'rgba(245,232,208,0.35)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          />
        </div>
      </header>

      {/* ── Main panels ──────────────────────────────────────── */}
      <div className="flex flex-1 gap-3 p-3 overflow-hidden">

        {/* Left: Preview panel */}
        <div
          className="flex-1 flex flex-col overflow-hidden"
          style={{
            background: '#17120c',
            borderRadius: '16px',
            border: '1px solid rgba(212,131,12,0.14)',
          }}
        >
          {/* Tab bar */}
          <div
            className="flex items-center justify-between px-4 py-2.5 shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div
              className="flex items-center gap-1 p-1"
              style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}
            >
              <button
                onClick={() => setPreviewMode('live')}
                className="text-xs font-medium px-3 py-1.5 transition-all"
                style={{
                  background: activeMode === 'live' ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: activeMode === 'live' ? '#fff' : 'rgba(255,255,255,0.4)',
                  borderRadius: '8px',
                  boxShadow: activeMode === 'live' ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                Live
              </button>
              <button
                onClick={() => hasDraft && setPreviewMode('draft')}
                disabled={!hasDraft}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 transition-all disabled:cursor-not-allowed"
                style={{
                  background: activeMode === 'draft' ? 'rgba(212,131,12,0.15)' : 'transparent',
                  color: activeMode === 'draft' ? '#e8a020' : hasDraft ? 'rgba(245,232,208,0.4)' : 'rgba(245,232,208,0.15)',
                  borderRadius: '8px',
                  boxShadow: activeMode === 'draft' ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                Draft
                {hasDraft && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#d4830c' }} />
                )}
              </button>
            </div>

            <span className="text-xs truncate px-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
              {websiteUrl}
            </span>

            <div className="flex items-center gap-3 shrink-0">
              {hasDraft && draftHasGithub && activeMode === 'draft' && (
                prUrl ? (
                  <a
                    href={prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold transition-opacity hover:opacity-80"
                    style={{ color: '#4ade80' }}
                  >
                    PR open ↗
                  </a>
                ) : (
                  <button
                    onClick={handleLooksGood}
                    disabled={isSubmittingPR || isResetting}
                    className="text-xs font-semibold px-3 py-1.5 transition-opacity hover:opacity-80 disabled:opacity-40"
                    style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '999px' }}
                  >
                    {isSubmittingPR ? 'Opening PR…' : 'Looks good →'}
                  </button>
                )
              )}
              {hasDraft && (
                <button
                  onClick={handleDiscardDraft}
                  disabled={isResetting}
                  className="text-xs font-medium transition-opacity hover:opacity-70 disabled:opacity-40"
                  style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  {isResetting ? 'Discarding…' : '✕ Discard'}
                </button>
              )}
              <a
                href={iframeSrc}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium transition-opacity hover:opacity-70"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                ↗ Open
              </a>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <IframePreview src={iframeSrc} />
          </div>
        </div>

        {/* Right: Chat / Edit panel */}
        <div
          className="shrink-0 flex flex-col overflow-hidden"
          style={{
            width: '360px',
            background: '#17120c',
            borderRadius: '16px',
            border: '1px solid rgba(212,131,12,0.14)',
          }}
        >
          {/* Panel tab switcher */}
          {hasEditPanel && (
            <div
              className="flex items-center gap-1 p-1.5 shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(15,23,42,0.3)' }}
            >
              <button
                onClick={() => setPanelMode('chat')}
                className="flex-1 text-xs font-medium py-1.5 rounded-lg transition-all"
                style={{
                  background: panelMode === 'chat' ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: panelMode === 'chat' ? '#f5e8d0' : 'rgba(245,232,208,0.35)',
                }}
              >
                AI Chat
              </button>
              <button
                onClick={() => setPanelMode('edit')}
                className="flex-1 text-xs font-medium py-1.5 rounded-lg transition-all"
                style={{
                  background: panelMode === 'edit' ? 'rgba(245,158,11,0.12)' : 'transparent',
                  color: panelMode === 'edit' ? '#f59e0b' : 'rgba(245,232,208,0.35)',
                }}
              >
                Direct Edit
              </button>
            </div>
          )}

          {panelMode === 'edit' && activeBrief ? (
            <DirectEditPanel
              websiteId={websiteId}
              brief={activeBrief}
              onDraftCreated={() => {
                setPreviewMode('draft')
                setPanelMode('chat')
              }}
            />
          ) : (
            <ChatPanel
              clientId={clientId}
              websiteId={websiteId}
              atLimit={atLimit}
              initialRequests={recentRequests}
              clearRef={clearChatRef}
            />
          )}
        </div>
      </div>
    </div>
  )
}
