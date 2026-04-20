'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Client, Website, Version, ChangeRequest, RequestStatus } from './types'
import {
  initialClients,
  initialWebsites,
  initialVersions,
  initialChangeRequests,
} from './mock-data'
import { generateWebsiteUpdate } from './mock-ai'

interface StoreCtx {
  clients: Client[]
  websites: Website[]
  versions: Record<string, Version>
  changeRequests: ChangeRequest[]
  // Returns the new requestId so callers can track status changes
  submitRequest: (clientId: string, websiteId: string, message: string) => string
  approveRequest: (requestId: string) => void
  deployRequest: (requestId: string) => void
}

const StoreContext = createContext<StoreCtx | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [clients] = useState<Client[]>(initialClients)
  const [websites, setWebsites] = useState<Website[]>(initialWebsites)
  const [versions, setVersions] = useState<Record<string, Version>>(initialVersions)
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>(initialChangeRequests)

  const submitRequest = useCallback(
    (clientId: string, websiteId: string, message: string): string => {
      const requestId = `req-${Date.now()}`

      // 1. Add the request immediately as 'pending'
      setChangeRequests(prev => [
        {
          id: requestId,
          clientId,
          websiteId,
          message,
          status: 'pending' as RequestStatus,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ])

      // 2. Pre-generate the draft now using current state (captured in closure)
      //    so we don't need to read state inside the timeout.
      const site = websites.find(w => w.id === websiteId)
      const currentVersion = site ? versions[site.liveVersionId] : null

      if (currentVersion) {
        const draft = generateWebsiteUpdate(currentVersion, message)

        // 3. After simulated AI delay, apply the draft to state
        setTimeout(() => {
          setVersions(prev => ({ ...prev, [draft.id]: draft }))
          setWebsites(prev =>
            prev.map(w => w.id === websiteId ? { ...w, draftVersionId: draft.id } : w)
          )
          setChangeRequests(prev =>
            prev.map(r => r.id === requestId ? { ...r, status: 'draft' as RequestStatus } : r)
          )
        }, 1500)
      }

      return requestId
    },
    [websites, versions]
  )

  const approveRequest = useCallback((requestId: string) => {
    setChangeRequests(prev =>
      prev.map(r => r.id === requestId ? { ...r, status: 'approved' as RequestStatus } : r)
    )
  }, [])

  const deployRequest = useCallback((requestId: string) => {
    // Find the request to get the websiteId, then promote draft → live
    setChangeRequests(prev => {
      const req = prev.find(r => r.id === requestId)
      if (!req) return prev

      setWebsites(sites =>
        sites.map(w => {
          if (w.id !== req.websiteId || !w.draftVersionId) return w
          return { ...w, liveVersionId: w.draftVersionId, draftVersionId: null }
        })
      )

      return prev.map(r => r.id === requestId ? { ...r, status: 'deployed' as RequestStatus } : r)
    })
  }, [])

  return (
    <StoreContext.Provider
      value={{ clients, websites, versions, changeRequests, submitRequest, approveRequest, deployRequest }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore(): StoreCtx {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
