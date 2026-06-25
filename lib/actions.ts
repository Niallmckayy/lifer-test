'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { generateContentUpdate, generateUpdatedBrief, ContentBrief } from '@/lib/claude'
import { sendDraftReadyEmail, sendDeployedEmail, sendGoLiveEmail } from '@/lib/email'
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

  if (website?.htmlContent) {
    // ── Path C: imported HTML — direct AI modification ──────
    // Takes priority: if the site has stored HTML, always patch it directly.
    let draftHtml: string
    try {
      const { generateHtmlModification } = await import('./claude')
      draftHtml = await generateHtmlModification(website.htmlContent, message)
    } catch (err) {
      console.error('HTML modification error:', err)
      await prisma.changeRequest.update({ where: { id: request.id }, data: { status: 'PENDING' } })
      revalidatePath('/dashboard/customer')
      return { requestId: request.id, error: 'AI generation failed — your request has been saved and will be reviewed manually.' }
    }

    await prisma.website.update({
      where: { id: websiteId },
      data: { draftHtmlContent: draftHtml },
    })

    await prisma.changeRequest.update({
      where: { id: request.id },
      data: { status: 'DRAFT' },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    const clientEmail = website.client?.user?.email
    if (clientEmail) {
      void sendDraftReadyEmail(
        clientEmail,
        website.client!.name,
        `${appUrl}/dashboard/customer`,
      ).catch(console.error)
    }

  } else if (website && websiteContentBrief) {
    // ── Path A: HTML pipeline (prospect-claimed sites) ──────
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
    htmlContent:       string | null
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
// ── Reset client password (admin) ────────────────────────
export async function resetClientPassword(
  clientId: string,
): Promise<{ tempPassword?: string; error?: string }> {
  const client = await prisma.client.findUnique({ where: { id: clientId }, include: { user: true } })
  if (!client) return { error: 'Client not found.' }

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const tempPassword = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  const hashed = await bcrypt.hash(tempPassword, 10)

  await prisma.user.update({ where: { id: client.userId }, data: { password: hashed } })
  return { tempPassword }
}

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
      await tx.analyticsEvent.deleteMany({ where: { websiteId: client.website.id } })
      await tx.siteContent.deleteMany({ where: { websiteId: client.website.id } })
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

// ── Image re-hosting helpers ──────────────────────────────

function extractImageUrls(html: string): string[] {
  const urls = new Set<string>()
  for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) {
    if (m[1] && !m[1].startsWith('data:')) urls.add(m[1])
  }
  for (const m of html.matchAll(/url\(["']?([^"')]+)["']?\)/gi)) {
    if (m[1] && !m[1].startsWith('data:') && /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(m[1])) {
      urls.add(m[1])
    }
  }
  return [...urls]
}

async function rehostImagesToBlob(html: string): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return html
  const { put } = await import('@vercel/blob')
  const urls = extractImageUrls(html)
  const replacements = new Map<string, string>()

  await Promise.allSettled(urls.map(async (url) => {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(15_000),
      })
      if (!res.ok) return
      const contentType = res.headers.get('content-type') ?? 'image/jpeg'
      if (!contentType.startsWith('image/')) return
      const buffer = await res.arrayBuffer()
      const ext = contentType.split('/')[1]?.split(';')[0] ?? 'jpg'
      const filename = `imported/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const blob = await put(filename, buffer, { access: 'public', contentType })
      replacements.set(url, blob.url)
    } catch {
      // Skip failed images — keep original URL
    }
  }))

  let updated = html
  for (const [original, replacement] of replacements) {
    updated = updated.replaceAll(original, replacement)
  }
  return updated
}

// ── Import existing site HTML (admin) ────────────────────
export async function importClientSite(
  websiteId: string,
  input: { url?: string; html?: string },
): Promise<{ error?: string }> {
  if (!input.url && !input.html) return { error: 'Provide a URL or HTML.' }

  let html: string

  if (input.url) {
    let res: Response
    try {
      res = await fetch(input.url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    } catch {
      return { error: 'Could not fetch that URL. Check it is publicly accessible.' }
    }
    if (!res.ok) return { error: `Fetch failed: HTTP ${res.status}` }
    const raw = await res.text()

    // Strip all <script> tags — the original site's JS router (e.g. Next.js) calls
    // history.replaceState with its own origin, which throws a SecurityError when
    // the HTML is served from a different domain. CSS is kept; interactivity is not needed.
    const stripped = raw.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')

    // Inject <base> tag so the browser resolves ALL relative URLs (images, CSS, fonts)
    // against the source domain — more robust than regex-replacing every path.
    const origin = new URL(input.url).origin
    const baseTag = `<base href="${origin}/">`
    html = stripped.includes('<base ')
      ? stripped
      : stripped.replace(/(<head[^>]*>)/i, `$1${baseTag}`)
  } else {
    html = input.html!
  }

  const website = await prisma.website.findUnique({ where: { id: websiteId }, select: { name: true } })

  await prisma.website.update({
    where: { id: websiteId },
    data: {
      htmlContent:    html,
      contentBrief:   null,
      liveVersionId:  null,
      draftVersionId: null,
    },
  })

  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/customer')

  // Fire-and-forget: re-host images to Vercel Blob + extract content brief
  void (async () => {
    const [rehostedHtml, { extractContentBriefFromHtml }] = await Promise.all([
      rehostImagesToBlob(html),
      import('./claude'),
    ])

    const brief = await extractContentBriefFromHtml(rehostedHtml, website?.name ?? '')

    await prisma.website.update({
      where: { id: websiteId },
      data: {
        htmlContent:  rehostedHtml,
        contentBrief: JSON.stringify(brief),
      },
    })

    revalidatePath('/dashboard/admin')
    revalidatePath('/dashboard/customer')
  })().catch(console.error)

  return {}
}

// ── Apply direct (no-AI) content edits (customer) ────────
export async function applyDirectEdit(
  websiteId: string,
  updatedBrief: ContentBrief,
): Promise<{ error?: string }> {
  const website = await prisma.website.findUnique({ where: { id: websiteId } })
  if (!website) return { error: 'Website not found.' }

  const htmlContent = (website as { htmlContent?: string | null }).htmlContent

  let draftHtml: string

  if (htmlContent) {
    // Imported site — swap changed strings directly in the HTML.
    // The stored contentBrief has the original extracted values; compare with
    // updatedBrief to find what changed, then do plain string replacement.
    // This is instant vs. 2+ minutes for a full Claude round-trip.
    const currentBriefRaw = (website as { contentBrief?: string | null }).contentBrief
    const currentBrief: ContentBrief | null = currentBriefRaw ? JSON.parse(currentBriefRaw) as ContentBrief : null

    // Source HTML is the current draft (if one exists) or the live imported HTML
    const currentHtmlRaw = (website as { draftHtmlContent?: string | null }).draftHtmlContent
    const sourceHtml = currentHtmlRaw ?? htmlContent

    // Build replacement pairs [oldText, newText] for every changed scalar field
    const pairs: [string, string][] = []

    function maybeReplace(oldVal: string | undefined | null, newVal: string | undefined | null) {
      if (oldVal && newVal && oldVal !== newVal) pairs.push([oldVal, newVal])
    }

    maybeReplace(currentBrief?.headline,         updatedBrief.headline)
    maybeReplace(currentBrief?.tagline,          updatedBrief.tagline)
    maybeReplace(currentBrief?.subheadline,      updatedBrief.subheadline)
    maybeReplace(currentBrief?.ctaText,          updatedBrief.ctaText)
    maybeReplace(currentBrief?.about,            updatedBrief.about)
    maybeReplace(currentBrief?.finalCtaHeadline, updatedBrief.finalCtaHeadline)
    maybeReplace(currentBrief?.finalCtaSubtext,  updatedBrief.finalCtaSubtext)
    maybeReplace(currentBrief?.email,            updatedBrief.email)
    maybeReplace(currentBrief?.location,         updatedBrief.location)
    maybeReplace(currentBrief?.heroAlt,          updatedBrief.heroAlt)

    // Service name + description pairs
    updatedBrief.services.forEach((svc, i) => {
      const old = currentBrief?.services?.[i]
      maybeReplace(old?.name,        svc.name)
      maybeReplace(old?.description, svc.description)
    })

    // Stat + testimonial pairs
    updatedBrief.stats?.forEach((stat, i) => {
      const old = currentBrief?.stats?.[i]
      maybeReplace(old?.value, stat.value)
      maybeReplace(old?.label, stat.label)
    })
    updatedBrief.testimonials?.forEach((t, i) => {
      const old = currentBrief?.testimonials?.[i]
      maybeReplace(old?.quote,  t.quote)
      maybeReplace(old?.author, t.author)
      maybeReplace(old?.role,   t.role)
    })

    if (pairs.length === 0) {
      return { error: 'No changes detected — edit one or more fields and save again.' }
    }

    draftHtml = pairs.reduce((acc, [from, to]) => acc.replaceAll(from, to), sourceHtml)

    if (draftHtml === sourceHtml) {
      // Replacement ran but found no matches — extracted text doesn't exactly match HTML
      // (e.g. text is split across inline elements like <strong>). Fall back to AI Chat:
      // ask the customer to submit the change as a chat request instead.
      return { error: 'The original text could not be located in the HTML — the site may use formatted text. Use AI Chat to request this change instead.' }
    }
  } else {
    // Template-generated site — regenerate from brief
    const { assembleProspectSite } = await import('./templates/index')
    draftHtml = assembleProspectSite(
      updatedBrief,
      website.name,
      updatedBrief.heroImageUrl ?? null,
      updatedBrief.galleryImageUrl ? [updatedBrief.galleryImageUrl] : [],
    )
  }

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
      include: { website: true, user: true, _count: { select: { bookingResources: { where: { active: true } } } } },
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
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

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
          siteContent: { select: { updatedAt: true } },
        },
      },
    },
  })

  if (!client) return null

  const websiteId = client.website?.id

  const [upcomingBookings, analyticsEvents] = await Promise.all([
    prisma.booking.findMany({
      where: { clientId: client.id, startsAt: { gte: now }, status: 'CONFIRMED' },
      orderBy: { startsAt: 'asc' },
      take: 3,
      include: { resource: { select: { name: true } } },
    }),
    websiteId
      ? prisma.analyticsEvent.findMany({
          where: { websiteId, type: 'pageview', createdAt: { gte: weekAgo } },
          select: { sessionId: true, createdAt: true },
        })
      : Promise.resolve([]),
  ])

  const uniqueVisitors = new Set(analyticsEvents.map(e => e.sessionId)).size

  // Daily visit counts for sparkline (last 7 days)
  const dailyMap = new Map<string, Set<string>>()
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekAgo)
    d.setDate(d.getDate() + i)
    dailyMap.set(d.toISOString().slice(0, 10), new Set())
  }
  for (const e of analyticsEvents) {
    const day = e.createdAt.toISOString().slice(0, 10)
    if (dailyMap.has(day)) dailyMap.get(day)!.add(e.sessionId)
  }
  const dailyVisits = Array.from(dailyMap.entries()).map(([date, sessions]) => ({
    date,
    count: sessions.size,
  }))

  return {
    client: {
      id:                 client.id,
      name:               client.name,
      plan:               client.plan,
      status:             client.status,
      stripeCustomerId:   (client as { stripeCustomerId?: string | null }).stripeCustomerId ?? null,
      subscriptionStatus: (client as { subscriptionStatus?: string | null }).subscriptionStatus ?? null,
    },
    website: client.website,
    upcomingBookings,
    uniqueVisitors,
    dailyVisits,
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

// ── Create Stripe checkout session (customer subscribes) ─
export async function createCheckoutSession(
  userId: string,
): Promise<{ url?: string; error?: string }> {
  const client = await prisma.client.findUnique({ where: { userId } })
  if (!client) return { error: 'No billing account found.' }

  const c = client as { stripeCustomerId?: string | null; id: string }

  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', { apiVersion: '2026-03-25.dahlia' })

    let customerId = c.stripeCustomerId
    if (!customerId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      })
      const customer = await stripe.customers.create({
        email: user?.email ?? undefined,
        name:  user?.name  ?? undefined,
        metadata: { clientId: c.id },
      })
      customerId = customer.id
      await prisma.client.update({ where: { id: c.id }, data: { stripeCustomerId: customerId } })
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_STARTER ?? '', quantity: 1 }],
      subscription_data: { trial_period_days: 14 },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/customer/billing/success`,
      cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/customer/billing`,
    })

    return { url: session.url ?? '' }
  } catch (err) {
    console.error('Checkout session error:', err)
    return { error: 'Failed to create checkout session.' }
  }
}

// ── Send go-live invite email (admin action) ──────────────
export async function sendGoLiveInvite(
  clientId: string,
): Promise<{ error?: string }> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { user: true },
  })
  if (!client) return { error: 'Client not found.' }

  const billingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/customer/billing`
  try {
    await sendGoLiveEmail(client.user.email, client.user.name ?? 'there', billingUrl)
    return {}
  } catch (err) {
    console.error('Go-live invite error:', err)
    return { error: 'Failed to send invite email.' }
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

// ── Admin booking profile (auto-create) ──────────────────

export async function getOrCreateAdminBookingProfile(): Promise<{
  clientId: string
  slug:     string
  error?:   string
}> {
  const { auth } = await import('./auth')
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
    return { clientId: '', slug: '', error: 'Unauthorised.' }
  }

  const adminUserId = (session.user as { id: string }).id

  let client = await prisma.client.findUnique({
    where:   { userId: adminUserId },
    include: { website: { select: { id: true, slug: true } } },
  })

  if (!client) {
    const baseSlug = 'my-booking'
    const taken = await prisma.website.findUnique({ where: { slug: baseSlug } })
    const slug  = taken ? `my-booking-${Date.now()}` : baseSlug

    client = await prisma.client.create({
      data: {
        name:         'My Booking Page',
        userId:       adminUserId,
        plan:         'Admin',
        requestLimit: 999,
        website: { create: { name: 'My Booking Page', slug } },
      },
      include: { website: { select: { id: true, slug: true } } },
    })
  } else if (!client.website) {
    const baseSlug = 'my-booking'
    const taken = await prisma.website.findUnique({ where: { slug: baseSlug } })
    const slug  = taken ? `my-booking-${Date.now()}` : baseSlug

    await prisma.website.create({
      data: { name: 'My Booking Page', slug, clientId: client.id },
    })

    client = await prisma.client.findUnique({
      where:   { userId: adminUserId },
      include: { website: { select: { id: true, slug: true } } },
    })!
  }

  return { clientId: client!.id, slug: client!.website?.slug ?? '' }
}

// ── Calendar connection ───────────────────────────────────

export async function getCalendarConnection(clientId: string) {
  const { auth } = await import('./auth')
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorised.' }
  const isAdmin = (session.user as { role?: string }).role === 'ADMIN'
  if (!isAdmin) {
    const client = await prisma.client.findUnique({ where: { userId: (session.user as { id: string }).id } })
    if (!client || client.id !== clientId) return { error: 'Unauthorised.' }
  }
  const conn = await prisma.calendarConnection.findUnique({
    where:  { clientId },
    select: { provider: true, calendarId: true, createdAt: true },
  })
  return { connection: conn ?? null }
}

export async function disconnectCalendar(clientId: string): Promise<{ error?: string }> {
  const { auth } = await import('./auth')
  const session = await auth()
  if (!session?.user) return { error: 'Unauthorised.' }
  const isAdmin = (session.user as { role?: string }).role === 'ADMIN'
  if (!isAdmin) {
    const client = await prisma.client.findUnique({ where: { userId: (session.user as { id: string }).id } })
    if (!client || client.id !== clientId) return { error: 'Unauthorised.' }
  }
  await prisma.calendarConnection.deleteMany({ where: { clientId } })
  revalidatePath('/dashboard/customer/bookings')
  return {}
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
