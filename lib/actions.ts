'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { generateContentUpdate, generateUpdatedBrief, ContentBrief } from '@/lib/claude'
import { sendDraftReadyEmail, sendDeployedEmail } from '@/lib/email'
import { createBranch, commitContent, createPullRequest as ghCreatePR, mergePullRequest as ghMergePR } from '@/lib/github'
import { waitForPreviewDeployment } from '@/lib/vercel'

// ── Submit a change request (customer) ───────────────────
export async function submitChangeRequest(
  clientId: string,
  websiteId: string,
  message: string,
): Promise<{ requestId: string; error?: string }> {
  const request = await prisma.changeRequest.create({
    data: { message, status: 'PENDING', clientId, websiteId },
  })

  const website = await prisma.website.findUnique({
    where: { id: websiteId },
    include: {
      liveVersion: true,
      client: { include: { user: true } },
    },
  })

  const websiteContentBrief = (website as { contentBrief?: string | null } | null)?.contentBrief

  if (website && websiteContentBrief) {
    // ── HTML pipeline (prospect-claimed sites) ──────────────
    let updatedBrief: ContentBrief
    try {
      const currentBrief = JSON.parse(websiteContentBrief) as ContentBrief
      updatedBrief = await generateUpdatedBrief(currentBrief, message)
    } catch (err) {
      console.error('Brief update error:', err)
      await prisma.changeRequest.update({ where: { id: request.id }, data: { status: 'PENDING' } })
      revalidatePath('/dashboard/customer')
      return { requestId: request.id, error: 'AI generation failed — your request has been saved and will be reviewed manually.' }
    }

    const { assembleProspectSite } = await import('./templates/index')
    const draftHtml = assembleProspectSite(
      updatedBrief,
      website.name,
      updatedBrief.heroImageUrl ?? null,
      updatedBrief.galleryImageUrl ? [updatedBrief.galleryImageUrl] : [],
    )

    await prisma.website.update({
      where: { id: websiteId },
      data: { draftHtmlContent: draftHtml, draftContentBrief: JSON.stringify(updatedBrief) },
    })

    await prisma.changeRequest.update({
      where: { id: request.id },
      data: { status: 'DRAFT' },
    })

    // Fire-and-forget email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    const clientEmail = website.client?.user?.email
    if (clientEmail) {
      void sendDraftReadyEmail(
        clientEmail,
        website.client!.name,
        `${appUrl}/dashboard/customer`,
      ).catch(console.error)
    }

  } else if (website?.liveVersion) {
    // ── Version/GitHub/Vercel pipeline (existing Vercel clients) ──
    const current = {
      headline:   website.liveVersion.headline,
      subheading: website.liveVersion.subheading,
      about:      website.liveVersion.about,
      services:   JSON.parse(website.liveVersion.services) as string[],
    }

    let draft
    try {
      draft = await generateContentUpdate(current, message)
    } catch (err) {
      console.error('Claude API error:', err)
      await prisma.changeRequest.update({
        where: { id: request.id },
        data: { status: 'PENDING' },
      })
      revalidatePath('/dashboard/customer')
      return { requestId: request.id, error: 'AI generation failed — your request has been saved and will be reviewed manually.' }
    }

    const newVersion = await prisma.version.create({
      data: {
        headline:   draft.headline,
        subheading: draft.subheading,
        about:      draft.about,
        services:   JSON.stringify(draft.services),
        websiteId,
      },
    })

    await prisma.website.update({
      where: { id: websiteId },
      data: { draftVersionId: newVersion.id },
    })

    // ── GitHub branch + Vercel preview (when repo is configured) ──
    let githubBranch: string | null = null
    let draftPreviewUrl: string | null = null

    const githubRepo = (website as { githubRepo?: string | null }).githubRepo
    const vercelProjectId = (website as { vercelProjectId?: string | null }).vercelProjectId
    const vercelTeamId = (website as { vercelTeamId?: string | null }).vercelTeamId

    if (githubRepo) {
      try {
        githubBranch = `draft/${request.id}`
        await createBranch(githubRepo, githubBranch)
        await commitContent(githubRepo, githubBranch, draft)

        if (vercelProjectId) {
          void waitForPreviewDeployment(vercelProjectId, githubBranch, vercelTeamId).then(url => {
            if (url) {
              void prisma.changeRequest.update({
                where: { id: request.id },
                data: { draftPreviewUrl: url },
              }).catch(console.error)
            }
          }).catch(console.error)
        }
      } catch (err) {
        console.error('GitHub branch creation error:', err)
        githubBranch = null
      }
    }

    await prisma.changeRequest.update({
      where: { id: request.id },
      data: {
        status: 'DRAFT',
        ...(githubBranch ? { githubBranch } : {}),
        ...(draftPreviewUrl ? { draftPreviewUrl } : {}),
      },
    })

    // Fire-and-forget email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    const clientEmail = website.client?.user?.email
    if (clientEmail) {
      void sendDraftReadyEmail(
        clientEmail,
        website.client!.name,
        `${appUrl}/dashboard/customer`,
      ).catch(console.error)
    }
  }

  revalidatePath('/dashboard/customer')
  revalidatePath('/dashboard/admin')

  return { requestId: request.id }
}

// ── Customer: create PR when draft looks good ─────────────
export async function submitPullRequest(requestId: string): Promise<{ prUrl?: string; error?: string }> {
  const request = await prisma.changeRequest.findUnique({
    where: { id: requestId },
    include: { client: { include: { website: true } } },
  })

  if (!request) return { error: 'Request not found.' }

  const githubBranch = (request as { githubBranch?: string | null }).githubBranch
  const githubRepo = (request.client.website as { githubRepo?: string | null } | null)?.githubRepo

  if (!githubRepo || !githubBranch) {
    return { error: 'No GitHub repo or branch configured for this website.' }
  }

  try {
    const { number, url } = await ghCreatePR(githubRepo, githubBranch, request.message)
    await prisma.changeRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED', githubPrNumber: number, githubPrUrl: url },
    })
    revalidatePath('/dashboard/admin')
    revalidatePath('/dashboard/customer')
    return { prUrl: url }
  } catch (err) {
    console.error('GitHub PR creation error:', err)
    return { error: 'Failed to create pull request. Please try again.' }
  }
}

// ── Admin: merge PR + mark deployed ──────────────────────
export async function mergeRequest(requestId: string) {
  const request = await prisma.changeRequest.findUnique({
    where: { id: requestId },
    include: {
      client: {
        include: { website: true, user: true },
      },
    },
  })
  if (!request) return

  const githubPrNumber = (request as { githubPrNumber?: number | null }).githubPrNumber
  const githubRepo = (request.client.website as { githubRepo?: string | null } | null)?.githubRepo

  if (githubRepo && githubPrNumber) {
    try {
      await ghMergePR(githubRepo, githubPrNumber)
    } catch (err) {
      console.error('GitHub merge error:', err)
    }
  }

  // Update DB — Vercel production deploy triggers automatically via GitHub webhook
  const website = request.client.website
  if (website) {
    const fresh = await prisma.website.findUnique({ where: { id: website.id }, select: { draftHtmlContent: true, draftContentBrief: true } })
    await prisma.website.update({
      where: { id: website.id },
      data: {
        liveVersionId:     website.draftVersionId ?? undefined,
        draftVersionId:    null,
        htmlContent:       fresh?.draftHtmlContent ?? null,
        contentBrief:      fresh?.draftContentBrief ?? (website as unknown as { contentBrief?: string | null }).contentBrief ?? null,
        draftHtmlContent:  null,
        draftContentBrief: null,
      },
    })
  }

  await prisma.changeRequest.update({
    where: { id: requestId },
    data: { status: 'DEPLOYED' },
  })

  // Fire-and-forget email
  const clientEmail = request.client.user?.email
  if (clientEmail && website) {
    const liveUrl = (website as { previewUrl?: string | null }).previewUrl
      ?? `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/sites/${website.slug}`
    void sendDeployedEmail(clientEmail, request.client.name, liveUrl).catch(console.error)
  }

  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/customer')
  if (website) revalidatePath(`/sites/${website.slug}`)
}

// ── Deny a request (admin) ───────────────────────────────
export async function denyRequest(requestId: string) {
  const request = await prisma.changeRequest.findUnique({
    where: { id: requestId },
    include: { client: { include: { website: true } } },
  })
  if (request?.client.website) {
    await prisma.website.update({
      where: { id: request.client.website.id },
      data: { draftVersionId: null, draftContentBrief: null },
    })
  }
  await prisma.changeRequest.update({
    where: { id: requestId },
    data: { status: 'DENIED' },
  })
  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/customer')
}

// ── Approve a request (admin) ─────────────────────────────
export async function approveRequest(requestId: string) {
  await prisma.changeRequest.update({
    where: { id: requestId },
    data: { status: 'APPROVED' },
  })
  revalidatePath('/dashboard/admin')
}

// ── Deploy a request (admin) ──────────────────────────────
export async function deployRequest(requestId: string) {
  const request = await prisma.changeRequest.findUnique({
    where: { id: requestId },
    include: {
      client: {
        include: {
          website: true,
          user: true,
        },
      },
    },
  })
  if (!request?.client.website) return

  const website = request.client.website

  const fresh = await prisma.website.findUnique({ where: { id: website.id }, select: { draftHtmlContent: true, draftContentBrief: true } })
  await prisma.website.update({
    where: { id: website.id },
    data: {
      liveVersionId:     website.draftVersionId ?? undefined,
      draftVersionId:    null,
      htmlContent:       fresh?.draftHtmlContent ?? null,
      contentBrief:      fresh?.draftContentBrief ?? (website as unknown as { contentBrief?: string | null }).contentBrief ?? null,
      draftHtmlContent:  null,
      draftContentBrief: null,
    },
  })

  await prisma.changeRequest.update({
    where: { id: requestId },
    data: { status: 'DEPLOYED' },
  })

  // Fire-and-forget email
  const clientEmail = request.client.user?.email
  if (clientEmail) {
    const liveUrl = (website as { previewUrl?: string | null }).previewUrl
      ?? `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/sites/${website.slug}`
    void sendDeployedEmail(clientEmail, request.client.name, liveUrl).catch(console.error)
  }

  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/customer')
  revalidatePath(`/sites/${website.slug}`)
}

// ── Customer dashboard data shape ────────────────────────
export type CustomerDashboardData = {
  id: string
  name: string
  plan: string
  status: string
  requestLimit: number
  userId: string
  createdAt: Date
  website: {
    id: string
    name: string
    slug: string
    clientId: string
    liveVersionId:    string | null
    draftVersionId:   string | null
    draftHtmlContent:  string | null
    contentBrief:      string | null
    draftContentBrief: string | null
    previewUrl:        string | null
    createdAt: Date
    liveVersion: {
      id: string
      headline: string
      subheading: string
      about: string
      services: string
      websiteId: string
      createdAt: Date
    } | null
    draftVersion: {
      id: string
      headline: string
      subheading: string
      about: string
      services: string
      websiteId: string
      createdAt: Date
    } | null
  } | null
  requests: Array<{
    id: string
    message: string
    status: string
    clientId: string
    websiteId: string
    githubBranch: string | null
    githubPrNumber: number | null
    githubPrUrl: string | null
    draftPreviewUrl: string | null
    createdAt: Date
  }>
} | null

// ── Fetch customer dashboard data ─────────────────────────
export async function getCustomerDashboardData(userId: string): Promise<CustomerDashboardData> {
  const client = await prisma.client.findUnique({
    where: { userId },
    include: {
      website: {
        include: {
          liveVersion: true,
          draftVersion: true,
        },
      },
      requests: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })
  return client as CustomerDashboardData
}

// ── Delete a change request (admin) ──────────────────────
export async function deleteChangeRequest(requestId: string) {
  await prisma.changeRequest.delete({ where: { id: requestId } })
  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/customer')
}

// ── Delete a client + all related data (admin) ───────────
export async function deleteClient(clientId: string): Promise<{ error?: string }> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      website: { include: { versions: true } },
      requests: true,
      user: true,
    },
  })
  if (!client) return { error: 'Client not found.' }

  await prisma.$transaction(async tx => {
    // Clear FK pointers on Website before deleting Versions
    if (client.website) {
      await tx.website.update({
        where: { id: client.website.id },
        data: { liveVersionId: null, draftVersionId: null },
      })
      await tx.changeRequest.deleteMany({ where: { websiteId: client.website.id } })
      await tx.version.deleteMany({ where: { websiteId: client.website.id } })
      await tx.website.delete({ where: { id: client.website.id } })
    }
    // Clear prospect back-reference so the prospect record isn't deleted
    await tx.prospect.updateMany({
      where: { convertedToClientId: clientId },
      data: { convertedToClientId: null, status: 'ARCHIVED' },
    })
    await tx.client.delete({ where: { id: clientId } })
    await tx.user.delete({ where: { id: client.userId } })
  })

  revalidatePath('/dashboard/admin')
  return {}
}

// ── Apply direct (no-AI) content edits (customer) ────────
export async function applyDirectEdit(
  websiteId: string,
  updatedBrief: ContentBrief,
): Promise<{ error?: string }> {
  const website = await prisma.website.findUnique({ where: { id: websiteId } })
  if (!website) return { error: 'Website not found.' }

  const { assembleProspectSite } = await import('./templates/index')
  const draftHtml = assembleProspectSite(
    updatedBrief,
    website.name,
    updatedBrief.heroImageUrl ?? null,
    updatedBrief.galleryImageUrl ? [updatedBrief.galleryImageUrl] : [],
  )

  await prisma.website.update({
    where: { id: websiteId },
    data: { draftHtmlContent: draftHtml, draftContentBrief: JSON.stringify(updatedBrief) },
  })

  revalidatePath('/dashboard/customer')
  return {}
}

// ── Reset draft (customer) ────────────────────────────────
export async function resetDraft(websiteId: string) {
  await prisma.website.update({
    where: { id: websiteId },
    data: { draftVersionId: null, draftHtmlContent: null, draftContentBrief: null },
  })
  revalidatePath('/dashboard/customer')
  revalidatePath('/dashboard/admin')
}

// ── Update client billing fields (admin) ─────────────────
export async function updateClientBilling(
  clientId: string,
  data: {
    stripeCustomerId?: string
    stripeSubscriptionId?: string
    plan?: string
    requestLimit?: number
  },
) {
  await prisma.client.update({
    where: { id: clientId },
    data,
  })
  revalidatePath('/dashboard/admin')
}

// ── Update website deployment fields (admin) ─────────────
export async function updateWebsiteDeployment(
  websiteId: string,
  data: {
    githubRepo?: string
    githubBranch?: string
    vercelProjectId?: string
    vercelTeamId?: string
    previewUrl?: string
  },
) {
  await prisma.website.update({
    where: { id: websiteId },
    data,
  })
  revalidatePath('/dashboard/admin')
}

// ── Fetch admin dashboard data ────────────────────────────
export async function getAdminDashboardData() {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [clients, changeRequests, readyProspects] = await Promise.all([
    prisma.client.findMany({
      include: { website: true, user: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.changeRequest.findMany({
      include: { client: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.prospect.count({ where: { status: 'READY' } }),
  ])

  // Analytics counts
  const requestsThisMonth  = changeRequests.filter(r => new Date(r.createdAt) >= monthStart).length
  const deploymentsThisMonth = changeRequests.filter(
    r => r.status === 'DEPLOYED' && new Date(r.createdAt) >= monthStart,
  ).length
  const draftsPending = changeRequests.filter(r => r.status === 'DRAFT').length
  const activeThisMonth = new Set(
    changeRequests
      .filter(r => new Date(r.createdAt) >= monthStart)
      .map(r => r.clientId),
  ).size

  return {
    clients,
    changeRequests,
    analytics: {
      totalClients:        clients.length,
      activeThisMonth,
      requestsThisMonth,
      draftsPending,
      deploymentsThisMonth,
      readyProspects,
    },
  }
}

// ── Customer overview (lightweight) ──────────────────────
export async function getCustomerOverviewData(userId: string) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const client = await prisma.client.findUnique({
    where: { userId },
    include: {
      website: {
        select: {
          id: true,
          name: true,
          slug: true,
          previewUrl: true,
          draftVersionId: true,
          draftHtmlContent: true,
        },
      },
      requests: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, message: true, status: true, createdAt: true },
      },
    },
  })

  if (!client) return null

  const monthlyUsage = await prisma.changeRequest.count({
    where: { clientId: client.id, createdAt: { gte: monthStart } },
  })

  return {
    client: {
      id:                 client.id,
      name:               client.name,
      plan:               client.plan,
      status:             client.status,
      requestLimit:       client.requestLimit,
      stripeCustomerId:   (client as { stripeCustomerId?: string | null }).stripeCustomerId ?? null,
      subscriptionStatus: (client as { subscriptionStatus?: string | null }).subscriptionStatus ?? null,
    },
    website: client.website,
    recentRequests: client.requests,
    monthlyUsage,
  }
}

// ── Billing data for customer ─────────────────────────────
export async function getBillingData(userId: string) {
  const client = await prisma.client.findUnique({ where: { userId } })
  if (!client) return null

  const c = client as {
    plan: string
    stripeCustomerId?: string | null
    stripeSubscriptionId?: string | null
    subscriptionStatus?: string | null
  }

  let currentPeriodEnd: Date | null = null

  if (c.stripeCustomerId && c.stripeSubscriptionId) {
    try {
      const Stripe = (await import('stripe')).default
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2026-03-25.dahlia' })
      const sub = await stripe.subscriptions.retrieve(c.stripeSubscriptionId)
      currentPeriodEnd = new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000)
    } catch {
      // Stripe not configured or call failed — continue without period end
    }
  }

  return {
    plan:               c.plan,
    subscriptionStatus: c.subscriptionStatus ?? null,
    stripeCustomerId:   c.stripeCustomerId ?? null,
    currentPeriodEnd,
  }
}

// ── Create Stripe billing portal session ─────────────────
export async function createBillingPortalSession(
  userId: string,
): Promise<{ url?: string; error?: string }> {
  const client = await prisma.client.findUnique({ where: { userId } })
  const stripeCustomerId = (client as { stripeCustomerId?: string | null } | null)?.stripeCustomerId

  if (!stripeCustomerId) return { error: 'No billing account linked.' }

  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2026-03-25.dahlia' })
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/customer/billing`,
    })
    return { url: session.url }
  } catch (err) {
    console.error('Billing portal error:', err)
    return { error: 'Failed to open billing portal.' }
  }
}

// ── Unsplash photo search (for image picker) ─────────────
export async function searchPhotos(
  query: string,
  count = 9,
): Promise<Array<{ url: string; thumbUrl: string; credit: string }>> {
  if (!query.trim()) return []
  const { searchUnsplash } = await import('./unsplash')
  const photos = await searchUnsplash(query.trim(), count, 'landscape')
  return photos.map(p => ({ url: p.url, thumbUrl: p.thumbUrl, credit: p.credit }))
}

// ── Update password (customer) ────────────────────────────
export async function updatePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  const bcrypt = await import('bcryptjs')
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { success: false, error: 'User not found.' }

  const valid = await bcrypt.compare(currentPassword, user.password)
  if (!valid) return { success: false, error: 'Incorrect current password.' }

  const hashed = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } })
  return { success: true }
}
