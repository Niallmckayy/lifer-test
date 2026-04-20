'use client'

import { useTransition } from 'react'
import { approveRequest, deployRequest, denyRequest, mergeRequest, deleteChangeRequest } from '@/lib/actions'

interface Props {
  requestId: string
  status: string
  githubPrNumber?: number | null
  githubPrUrl?: string | null
}

function DeleteButton({ requestId, isPending, startTransition }: {
  requestId: string
  isPending: boolean
  startTransition: (fn: () => void) => void
}) {
  return (
    <button
      onClick={() => {
        if (confirm('Delete this request?')) {
          startTransition(() => deleteChangeRequest(requestId))
        }
      }}
      disabled={isPending}
      className="text-xs transition-opacity hover:opacity-70 disabled:opacity-40"
      style={{ color: '#ccc', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }}
      title="Delete request"
    >
      ×
    </button>
  )
}

export default function AdminActions({ requestId, status, githubPrNumber, githubPrUrl }: Props) {
  const [isPending, startTransition] = useTransition()

  if (status === 'PENDING') {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => startTransition(() => denyRequest(requestId))}
          disabled={isPending}
          className="text-xs font-semibold px-4 py-1.5 transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)', borderRadius: '999px' }}
        >
          {isPending ? 'Denying…' : 'Deny'}
        </button>
        <DeleteButton requestId={requestId} isPending={isPending} startTransition={startTransition} />
      </div>
    )
  }

  if (status === 'DRAFT') {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => startTransition(() => approveRequest(requestId))}
          disabled={isPending}
          className="text-xs font-semibold text-white px-4 py-1.5 transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ background: '#d4830c', borderRadius: '999px' }}
        >
          {isPending ? 'Approving…' : 'Approve'}
        </button>
        <button
          onClick={() => startTransition(() => denyRequest(requestId))}
          disabled={isPending}
          className="text-xs font-semibold px-4 py-1.5 transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)', borderRadius: '999px' }}
        >
          {isPending ? 'Denying…' : 'Deny'}
        </button>
        <DeleteButton requestId={requestId} isPending={isPending} startTransition={startTransition} />
      </div>
    )
  }

  if (status === 'APPROVED') {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {githubPrNumber ? (
          <>
            {githubPrUrl && (
              <a
                href={githubPrUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium transition-opacity hover:opacity-70"
                style={{ color: '#d4830c' }}
              >
                PR #{githubPrNumber} ↗
              </a>
            )}
            <button
              onClick={() => startTransition(() => mergeRequest(requestId))}
              disabled={isPending}
              className="text-xs font-semibold text-white px-4 py-1.5 transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ background: '#d4830c', borderRadius: '999px' }}
            >
              {isPending ? 'Merging…' : 'Merge & Deploy'}
            </button>
          </>
        ) : (
          <button
            onClick={() => startTransition(() => deployRequest(requestId))}
            disabled={isPending}
            className="text-xs font-semibold text-white px-4 py-1.5 transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: '#d4830c', borderRadius: '999px' }}
          >
            {isPending ? 'Deploying…' : 'Deploy Live'}
          </button>
        )}
        <button
          onClick={() => startTransition(() => denyRequest(requestId))}
          disabled={isPending}
          className="text-xs font-semibold px-4 py-1.5 transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)', borderRadius: '999px' }}
        >
          {isPending ? 'Denying…' : 'Deny'}
        </button>
        <DeleteButton requestId={requestId} isPending={isPending} startTransition={startTransition} />
      </div>
    )
  }

  if (status === 'DEPLOYED') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium" style={{ color: '#16a34a' }}>✓ deployed</span>
        <DeleteButton requestId={requestId} isPending={isPending} startTransition={startTransition} />
      </div>
    )
  }

  if (status === 'DENIED') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium" style={{ color: '#ef4444' }}>✕ denied</span>
        <DeleteButton requestId={requestId} isPending={isPending} startTransition={startTransition} />
      </div>
    )
  }

  return null
}
