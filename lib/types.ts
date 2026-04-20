export type RequestStatus = 'pending' | 'draft' | 'approved' | 'deployed'

export interface Version {
  id: string
  headline: string
  subheading: string
  about: string
  services: string[]
  createdAt: string
}

export interface Client {
  id: string
  name: string
  email: string
  plan: 'Starter' | 'Pro'
  status: 'Active' | 'Pending'
  websiteId: string
}

export interface Website {
  id: string
  clientId: string
  name: string
  url: string
  liveVersionId: string
  draftVersionId: string | null
}

export interface ChangeRequest {
  id: string
  clientId: string
  websiteId: string
  message: string
  status: RequestStatus
  createdAt: string
}
