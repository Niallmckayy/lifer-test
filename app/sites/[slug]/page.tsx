import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ClientSiteTemplate from '@/components/site/ClientSiteTemplate'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ draft?: string }>
}

export default async function SitePage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { draft } = await searchParams

  const website = await prisma.website.findUnique({
    where: { slug },
    include: {
      liveVersion: true,
      draftVersion: true,
      client: true,
    },
  })

  if (!website) return notFound()

  const showDraft = draft === '1'

  // Draft is only accessible when authenticated as this client's user or an admin
  if (showDraft) {
    const session = await auth()
    const role = (session?.user as { role?: string })?.role
    const isAdmin = role === 'ADMIN'
    const isOwner = role === 'CUSTOMER' && session?.user?.id

    if (!isAdmin && !isOwner) return notFound()

    // HTML-pipeline draft — redirect to the raw HTML handler (auth re-checked there)
    if (website.draftHtmlContent) {
      redirect(`/preview/sites/${slug}?draft=1`)
    }

    if (!website.draftVersion) return notFound()
  }

  // Prioritise AI-generated HTML over template rendering
  if (!showDraft && website.htmlContent) {
    redirect(`/preview/sites/${slug}`)
  }

  const version = showDraft ? website.draftVersion : website.liveVersion
  if (!version) return notFound()

  const parsedVersion = {
    headline: version.headline,
    subheading: version.subheading,
    about: version.about,
    services: JSON.parse(version.services) as string[],
  }

  return (
    <ClientSiteTemplate
      version={parsedVersion}
      siteName={website.name}
      isDraft={showDraft}
    />
  )
}
