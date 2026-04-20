import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getCustomerDashboardData } from '@/lib/actions'
import CustomerDashboardClient from './CustomerDashboardClient'

export default async function CustomerProjectPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const client = await getCustomerDashboardData(session.user.id)
  if (!client) redirect('/login')

  const website = client.website
  if (!website) redirect('/dashboard/customer')

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const usedThisMonth = client.requests.filter(
    r => new Date(r.createdAt) >= monthStart
  ).length

  const activeDraftRequest = client.requests.find(r => r.status === 'DRAFT') ?? null

  return (
    <CustomerDashboardClient
      clientId={client.id}
      clientName={client.name}
      websiteId={website.id}
      websiteSlug={website.slug}
      websiteName={website.name}
      websiteUrl={website.previewUrl ?? `/sites/${website.slug}`}
      previewUrl={website.previewUrl}
      hasDraft={!!website.draftVersionId || !!website.draftHtmlContent}
      draftRequestId={activeDraftRequest?.id ?? null}
      draftHasGithub={!!(activeDraftRequest?.githubBranch)}
      draftPreviewUrl={activeDraftRequest?.draftPreviewUrl ?? null}
      draftPrUrl={activeDraftRequest?.githubPrUrl ?? null}
      contentBrief={website.contentBrief ?? null}
      draftContentBrief={website.draftContentBrief ?? null}
      usedRequests={usedThisMonth}
      requestLimit={client.requestLimit}
      recentRequests={client.requests.map(r => ({
        id: r.id,
        message: r.message,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      }))}
    />
  )
}
