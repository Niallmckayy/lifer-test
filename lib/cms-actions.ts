'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import type { CmsSchema, CmsContent } from '@/types/cms'

// ── Save draft content (customer) ────────────────────────
export async function saveCmsDraft(
  websiteId: string,
  content: CmsContent,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session) return { success: false, error: 'Unauthorized' }

  const website = await prisma.website.findUnique({
    where: { id: websiteId },
    include: { client: { include: { user: true } } },
  })

  if (!website) return { success: false, error: 'Website not found' }
  if (website.client.user.email !== session.user?.email && session.user?.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized' }
  }

  await prisma.siteContent.upsert({
    where: { websiteId },
    create: { websiteId, content: '{}', draft: JSON.stringify(content) },
    update: { draft: JSON.stringify(content) },
  })

  revalidatePath('/dashboard/customer/content')
  return { success: true }
}

// ── Publish draft → live (customer / admin) ──────────────
export async function publishCmsContent(
  websiteId: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session) return { success: false, error: 'Unauthorized' }

  const website = await prisma.website.findUnique({
    where: { id: websiteId },
    include: {
      siteContent: true,
      client: { include: { user: true } },
    },
  })

  if (!website) return { success: false, error: 'Website not found' }
  if (website.client.user.email !== session.user?.email && session.user?.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized' }
  }

  const draft = website.siteContent?.draft
  if (!draft) return { success: false, error: 'No draft to publish' }

  await prisma.siteContent.update({
    where: { websiteId },
    data: { content: draft, draft: null },
  })

  if (website.revalidateHook) {
    void fetch(website.revalidateHook, { method: 'POST' }).catch(console.error)
  }

  revalidatePath('/dashboard/customer/content')
  return { success: true }
}

// ── Initialize CMS for a website (admin only) ───────────
export async function initializeSiteContent(
  websiteId: string,
  schema: CmsSchema,
  initialContent: CmsContent,
  revalidateHook?: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return { success: false, error: 'Admin only' }

  await prisma.$transaction([
    prisma.website.update({
      where: { id: websiteId },
      data: {
        cmsSchema: JSON.stringify(schema),
        ...(revalidateHook ? { revalidateHook } : {}),
      },
    }),
    prisma.siteContent.upsert({
      where: { websiteId },
      create: { websiteId, content: JSON.stringify(initialContent) },
      update: { content: JSON.stringify(initialContent) },
    }),
  ])

  revalidatePath('/dashboard/admin')
  return { success: true }
}

// ── Update schema only (admin) ───────────────────────────
export async function updateCmsSchema(
  websiteId: string,
  schema: CmsSchema,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return { success: false, error: 'Admin only' }

  await prisma.website.update({
    where: { id: websiteId },
    data: { cmsSchema: JSON.stringify(schema) },
  })

  revalidatePath('/dashboard/admin')
  return { success: true }
}
