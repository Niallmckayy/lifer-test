import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ContentEditor } from '@/components/cms/ContentEditor'
import type { CmsSchema, CmsContent } from '@/types/cms'

export default async function ContentPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      client: {
        include: {
          website: { include: { siteContent: true } },
        },
      },
    },
  })

  const website = user?.client?.website

  if (!website) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: '#0e0b07' }}>
        <div className="text-center">
          <p className="text-sm font-medium" style={{ color: 'rgba(245,232,208,0.4)' }}>No website found.</p>
        </div>
      </div>
    )
  }

  if (!website.cmsSchema) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: '#0e0b07' }}>
        <div
          className="max-w-sm text-center px-8 py-10"
          style={{
            background: 'rgba(245,232,208,0.03)',
            border: '1px solid rgba(245,232,208,0.07)',
            borderRadius: '16px',
          }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(212,131,12,0.1)' }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M4 7h14M4 11h10M4 15h7" stroke="#d4830c" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <h2
            className="text-base font-semibold mb-2"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#f5e8d0' }}
          >
            CMS not configured yet
          </h2>
          <p className="text-sm" style={{ color: 'rgba(245,232,208,0.35)' }}>
            Your content editor is being set up. Contact support to enable it for your site.
          </p>
        </div>
      </div>
    )
  }

  const schema = JSON.parse(website.cmsSchema) as CmsSchema
  const liveContent = website.siteContent?.content
    ? (JSON.parse(website.siteContent.content) as CmsContent)
    : ({} as CmsContent)
  const draftContent = website.siteContent?.draft
    ? (JSON.parse(website.siteContent.draft) as CmsContent)
    : null

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#0e0b07' }}>
      <ContentEditor
        websiteId={website.id}
        schema={schema}
        initialContent={liveContent}
        initialDraft={draftContent}
      />
    </div>
  )
}
