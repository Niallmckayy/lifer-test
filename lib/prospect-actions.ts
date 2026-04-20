'use server'

import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { generateProspectHtml } from '@/lib/claude'
import { searchUnsplash, industryHeroQuery } from '@/lib/unsplash'
// import { createRepository, pushStaticSite } from '@/lib/github'
// import { createVercelProject, waitForProductionDeployment } from '@/lib/vercel'

function generatePassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}


export async function createAndGenerateProspect(
  formData: FormData,
): Promise<{ prospectId?: string; error?: string }> {
  const businessName = (formData.get('businessName') as string)?.trim()
  const industry     = (formData.get('industry') as string)?.trim()
  const description  = (formData.get('description') as string)?.trim()
  const slugRaw      = (formData.get('slug') as string)?.trim()
  const prospectEmail = (formData.get('prospectEmail') as string)?.trim() || null
  const tone         = (formData.get('tone') as string)?.trim() || undefined

  if (!businessName || !industry || !description) {
    return { error: 'Business name, industry, and description are required.' }
  }

  const slug = slugRaw || toSlug(businessName)

  const existing = await prisma.prospect.findUnique({ where: { slug } })
  if (existing) return { error: 'That slug is already taken — try a different one.' }

  const prospect = await prisma.prospect.create({
    data: { businessName, industry, description, slug, status: 'GENERATING', prospectEmail },
  })

  try {
    // Fetch images in parallel — targeted queries per type
    const [heroPhotos, aboutPhotos, galleryPhotos] = await Promise.all([
      searchUnsplash(industryHeroQuery(industry), 3, 'landscape'),
      searchUnsplash(`${industry} team professional`, 2, 'squarish'),
      searchUnsplash(`${industry} work detail`, 2, 'landscape'),
    ])

    const heroImageUrl     = heroPhotos[Math.floor(Math.random() * heroPhotos.length)]?.fullUrl ?? heroPhotos[0]?.url ?? null
    const aboutImageUrl    = aboutPhotos[0]?.url ?? null
    const galleryImageUrls = galleryPhotos.map(p => p.url)

    // Generate HTML via Claude — this is the only blocking step
    const { html: htmlContent, brief } = await generateProspectHtml({
      businessName,
      industry,
      description,
      heroImageUrl,
      galleryImageUrls,
      aboutImageUrl,
      tone,
    })

    // Mark READY immediately — site is previewable via /preview/prospects/[id]
    await prisma.prospect.update({
      where: { id: prospect.id },
      data: { htmlContent, contentBrief: JSON.stringify(brief), status: 'READY' },
    })

    revalidatePath('/dashboard/admin/prospects')
    revalidatePath('/dashboard/admin')

    // GitHub + Vercel deployment disabled
    // void deployProspectToGithubAndVercel(prospect.id, slug, businessName, htmlContent).catch(console.error)

    return { prospectId: prospect.id }

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Prospect generation error:', message)
    await prisma.prospect.update({
      where: { id: prospect.id },
      data: { status: 'ERROR' },
    }).catch(console.error)
    revalidatePath('/dashboard/admin/prospects')
    return { error: `Generation failed: ${message}` }
  }
}

export async function regenerateProspect(
  prospectId: string,
): Promise<{ error?: string }> {
  const prospect = await prisma.prospect.findUnique({ where: { id: prospectId } })
  if (!prospect) return { error: 'Prospect not found.' }

  await prisma.prospect.update({ where: { id: prospectId }, data: { status: 'GENERATING' } })
  revalidatePath('/dashboard/admin/prospects')

  try {
    const [heroPhotos, aboutPhotos, galleryPhotos] = await Promise.all([
      searchUnsplash(industryHeroQuery(prospect.industry), 3, 'landscape'),
      searchUnsplash(`${prospect.industry} team professional`, 2, 'squarish'),
      searchUnsplash(`${prospect.industry} work detail`, 2, 'landscape'),
    ])

    const heroImageUrl  = heroPhotos[Math.floor(Math.random() * heroPhotos.length)]?.fullUrl ?? heroPhotos[0]?.url ?? null
    const aboutImageUrl = aboutPhotos[0]?.url ?? null

    const { html: htmlContent, brief } = await generateProspectHtml({
      businessName:     prospect.businessName,
      industry:         prospect.industry,
      description:      prospect.description,
      heroImageUrl,
      galleryImageUrls: galleryPhotos.map(p => p.url),
      aboutImageUrl,
    })

    // GitHub + Vercel deployment disabled
    await prisma.prospect.update({ where: { id: prospectId }, data: { htmlContent, contentBrief: JSON.stringify(brief) } })
    revalidatePath('/dashboard/admin/prospects')
    return {}

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Regeneration error:', message)
    await prisma.prospect.update({ where: { id: prospectId }, data: { status: 'ERROR' } }).catch(console.error)
    revalidatePath('/dashboard/admin/prospects')
    return { error: `Regeneration failed: ${message}` }
  }
}

export async function convertProspectToClient(
  prospectId: string,
  email: string,
  plan: string,
): Promise<{ tempPassword?: string; clientId?: string; error?: string }> {
  const prospect = await prisma.prospect.findUnique({ where: { id: prospectId } })
  if (!prospect) return { error: 'Prospect not found.' }
  if (prospect.status === 'CONVERTED') return { error: 'Already converted.' }

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) return { error: 'A user with that email already exists.' }

  const tempPassword    = generatePassword()
  const hashedPassword  = await bcrypt.hash(tempPassword, 10)
  const websiteSlug     = prospect.slug
  const websiteName     = prospect.businessName

  const existingSlug = await prisma.website.findUnique({ where: { slug: websiteSlug } })
  if (existingSlug) return { error: 'A website with that slug already exists.' }

  let clientId: string

  await prisma.$transaction(async tx => {
    const user = await tx.user.create({
      data: { email, password: hashedPassword, role: 'CUSTOMER' },
    })

    const client = await tx.client.create({
      data: {
        name: prospect.businessName,
        plan,
        status: 'Active',
        requestLimit: 10,
        userId: user.id,
        convertedFromProspect: { connect: { id: prospectId } },
      },
    })

    clientId = client.id

    const website = await tx.website.create({
      data: {
        name: websiteName,
        slug: websiteSlug,
        clientId: client.id,
        previewUrl:   prospect.deploymentUrl,
        githubRepo:   prospect.githubRepo,
        htmlContent:  prospect.htmlContent,
        contentBrief: prospect.contentBrief,
      },
    })

    const version = await tx.version.create({
      data: {
        headline:   `Welcome to ${prospect.businessName}`,
        subheading: 'We deliver exceptional work for every client.',
        about:      prospect.description,
        services:   JSON.stringify(['Service 1', 'Service 2', 'Service 3', 'Service 4']),
        websiteId:  website.id,
      },
    })

    await tx.website.update({
      where: { id: website.id },
      data: { liveVersionId: version.id },
    })

    await tx.prospect.update({
      where: { id: prospectId },
      data: { status: 'CONVERTED', convertedToClientId: client.id },
    })
  })

  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/admin/prospects')

  return { tempPassword, clientId: clientId! }
}

export async function createPublicProspect(
  formData: FormData,
): Promise<{ prospectId?: string; error?: string }> {
  const businessName = (formData.get('businessName') as string)?.trim()
  const industry     = (formData.get('industry') as string)?.trim()
  const description  = (formData.get('description') as string)?.trim()
  const tone         = (formData.get('tone') as string)?.trim() || undefined

  if (!businessName || !industry || !description) {
    return { error: 'Business name, industry, and description are required.' }
  }

  const slug = toSlug(businessName) + '-' + Math.random().toString(36).slice(2, 6)

  const prospect = await prisma.prospect.create({
    data: { businessName, industry, description, slug, status: 'PREVIEW', prospectEmail: null },
  })

  try {
    const [heroPhotos, aboutPhotos, galleryPhotos] = await Promise.all([
      searchUnsplash(industryHeroQuery(industry), 3, 'landscape'),
      searchUnsplash(`${industry} team professional`, 2, 'squarish'),
      searchUnsplash(`${industry} work detail`, 2, 'landscape'),
    ])

    const heroImageUrl  = heroPhotos[Math.floor(Math.random() * heroPhotos.length)]?.fullUrl ?? heroPhotos[0]?.url ?? null
    const aboutImageUrl = aboutPhotos[0]?.url ?? null

    const { html: htmlContent, brief } = await generateProspectHtml({
      businessName,
      industry,
      description,
      heroImageUrl,
      galleryImageUrls: galleryPhotos.map(p => p.url),
      aboutImageUrl,
      tone,
    })

    await prisma.prospect.update({
      where: { id: prospect.id },
      data: { htmlContent, contentBrief: JSON.stringify(brief), status: 'PREVIEW' },
    })

    revalidatePath('/dashboard/admin/prospects')
    revalidatePath('/dashboard/admin')

    return { prospectId: prospect.id }

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Public prospect generation error:', message)
    await prisma.prospect.update({
      where: { id: prospect.id },
      data: { status: 'ERROR' },
    }).catch(console.error)
    return { error: `Generation failed: ${message}` }
  }
}

export async function claimProspect(
  prospectId: string,
  email: string,
  password: string,
): Promise<{ success?: boolean; error?: string }> {
  const prospect = await prisma.prospect.findUnique({ where: { id: prospectId } })
  if (!prospect) return { error: 'Prospect not found.' }
  if (prospect.status === 'CONVERTED') return { error: 'This site has already been claimed.' }
  if (prospect.status !== 'PREVIEW' && prospect.status !== 'READY') {
    return { error: 'This site is not available to claim yet.' }
  }

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) return { error: 'An account with that email already exists. Try signing in instead.' }

  const hashedPassword = await bcrypt.hash(password, 10)
  const websiteSlug    = prospect.slug

  const existingSlug = await prisma.website.findUnique({ where: { slug: websiteSlug } })
  if (existingSlug) return { error: 'A website with that slug already exists.' }

  await prisma.$transaction(async tx => {
    const user = await tx.user.create({
      data: { email, password: hashedPassword, role: 'CUSTOMER' },
    })

    const client = await tx.client.create({
      data: {
        name:   prospect.businessName,
        plan:   'starter',
        status: 'Active',
        requestLimit: 10,
        userId: user.id,
        convertedFromProspect: { connect: { id: prospectId } },
      },
    })

    const website = await tx.website.create({
      data: {
        name:         prospect.businessName,
        slug:         websiteSlug,
        clientId:     client.id,
        htmlContent:  prospect.htmlContent,
        contentBrief: prospect.contentBrief,
      },
    })

    const version = await tx.version.create({
      data: {
        headline:   `Welcome to ${prospect.businessName}`,
        subheading: 'We deliver exceptional work for every client.',
        about:      prospect.description,
        services:   JSON.stringify(['Service 1', 'Service 2', 'Service 3', 'Service 4']),
        websiteId:  website.id,
      },
    })

    await tx.website.update({
      where: { id: website.id },
      data: { liveVersionId: version.id },
    })

    await tx.prospect.update({
      where: { id: prospectId },
      data: { status: 'CONVERTED', convertedToClientId: client.id, prospectEmail: email },
    })
  })

  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/admin/prospects')

  return { success: true }
}

export async function archiveProspect(prospectId: string): Promise<void> {
  await prisma.prospect.update({ where: { id: prospectId }, data: { status: 'ARCHIVED' } })
  revalidatePath('/dashboard/admin/prospects')
}

export async function deleteProspect(prospectId: string): Promise<void> {
  await prisma.prospect.delete({ where: { id: prospectId } })
  revalidatePath('/dashboard/admin/prospects')
  revalidatePath('/dashboard/admin')
}

export async function updateProspectNotes(prospectId: string, notes: string): Promise<void> {
  await prisma.prospect.update({ where: { id: prospectId }, data: { notes } })
  revalidatePath('/dashboard/admin/prospects')
}

export async function getProspectsDashboardData() {
  const now        = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const prospects = await prisma.prospect.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const total     = prospects.length
  const ready     = prospects.filter(p => p.status === 'READY').length
  const converted = prospects.filter(p => p.status === 'CONVERTED').length
  const thisMonth = prospects.filter(p => new Date(p.createdAt) >= monthStart).length

  return { prospects, analytics: { total, ready, converted, thisMonth } }
}
