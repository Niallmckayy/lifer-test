import type { Client, Website, Version, ChangeRequest } from './types'

// The demo customer session is always logged in as this client
export const DEMO_CLIENT_ID = 'c1'
export const DEMO_WEBSITE_ID = 'w1'

export const initialVersions: Record<string, Version> = {
  v1: {
    id: 'v1',
    headline: 'Architecture That Endures',
    subheading: 'A London-based studio designing homes, workspaces, and public buildings with rigour and care.',
    about: 'We are a small, considered practice. Our work is defined by close client relationships, material honesty, and a commitment to quality that outlasts trends.',
    services: ['Residential Design', 'Commercial Projects', 'Interior Architecture', 'Planning Consultancy'],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
}

export const initialClients: Client[] = [
  { id: 'c1', name: 'MK Architects', email: 'hello@mkarchitects.com', plan: 'Pro', status: 'Active', websiteId: 'w1' },
  { id: 'c2', name: 'Bloom Studio', email: 'studio@bloom.co', plan: 'Starter', status: 'Active', websiteId: 'w2' },
  { id: 'c3', name: 'Cedar & Co', email: 'info@cedarco.com', plan: 'Pro', status: 'Pending', websiteId: 'w3' },
  { id: 'c4', name: 'Dune Interiors', email: 'contact@dune.io', plan: 'Starter', status: 'Active', websiteId: 'w4' },
]

export const initialWebsites: Website[] = [
  { id: 'w1', clientId: 'c1', name: 'MK Architects', url: 'https://mk-architects-weld.vercel.app', liveVersionId: 'v1', draftVersionId: null },
  { id: 'w2', clientId: 'c2', name: 'Bloom Studio', url: 'https://example.com', liveVersionId: 'v1', draftVersionId: null },
  { id: 'w3', clientId: 'c3', name: 'Cedar & Co', url: 'https://example.com', liveVersionId: 'v1', draftVersionId: null },
  { id: 'w4', clientId: 'c4', name: 'Dune Interiors', url: 'https://example.com', liveVersionId: 'v1', draftVersionId: null },
]

export const initialChangeRequests: ChangeRequest[] = []
