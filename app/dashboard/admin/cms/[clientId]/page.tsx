import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CmsSetupForm } from './CmsSetupForm'

export default async function AdminCmsSetupPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') redirect('/login')

  const { clientId } = await params

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      website: { include: { siteContent: true } },
    },
  })

  if (!client) redirect('/dashboard/admin')

  const website = client.website

  return (
    <div className="min-h-screen px-6 py-8 max-w-4xl mx-auto" style={{ background: '#0e0b07' }}>
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard/admin"
          className="text-xs font-medium transition-opacity hover:opacity-70"
          style={{ color: 'rgba(245,232,208,0.4)' }}
        >
          ← Admin
        </Link>
        <span style={{ color: 'rgba(245,232,208,0.15)' }}>/</span>
        <span className="text-xs" style={{ color: 'rgba(245,232,208,0.4)' }}>CMS Setup</span>
      </div>

      <div className="mb-8">
        <h1
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#f5e8d0' }}
        >
          CMS Setup — {client.name}
        </h1>
        <p className="text-sm" style={{ color: 'rgba(245,232,208,0.35)' }}>
          Configure the content schema and initial content for this client&apos;s website.
        </p>
      </div>

      {!website ? (
        <div
          className="px-6 py-8 text-center"
          style={{ background: 'rgba(245,232,208,0.03)', border: '1px solid rgba(245,232,208,0.07)', borderRadius: '16px' }}
        >
          <p className="text-sm" style={{ color: 'rgba(245,232,208,0.4)' }}>
            This client has no website yet. Create one first.
          </p>
        </div>
      ) : (
        <div
          className="px-6 py-6"
          style={{ background: 'rgba(245,232,208,0.02)', border: '1px solid rgba(245,232,208,0.07)', borderRadius: '16px' }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm font-semibold" style={{ color: '#f5e8d0' }}>{website.name}</p>
              <p className="text-xs mt-0.5 font-mono" style={{ color: 'rgba(245,232,208,0.25)' }}>
                slug: {website.slug}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {website.cmsSchema ? (
                <span
                  className="text-xs font-medium px-2.5 py-1"
                  style={{ background: 'rgba(77,158,58,0.12)', color: '#6dbf56', borderRadius: '999px' }}
                >
                  CMS active
                </span>
              ) : (
                <span
                  className="text-xs font-medium px-2.5 py-1"
                  style={{ background: 'rgba(245,232,208,0.06)', color: 'rgba(245,232,208,0.35)', borderRadius: '999px' }}
                >
                  Not configured
                </span>
              )}
            </div>
          </div>

          <CmsSetupForm
            websiteId={website.id}
            existingSchema={website.cmsSchema ?? null}
            existingContent={website.siteContent?.content ?? null}
            existingRevalidateHook={website.revalidateHook ?? null}
          />
        </div>
      )}
    </div>
  )
}
