'use server'

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'

function generatePassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function createClient(
  formData: FormData,
): Promise<{ error?: string; tempPassword?: string }> {
  const name       = formData.get('name') as string
  const email      = formData.get('email') as string
  const plan       = formData.get('plan') as string
  const websiteName = formData.get('websiteName') as string
  const slug       = formData.get('slug') as string

  if (!name || !email || !plan || !websiteName || !slug) {
    return { error: 'All fields are required.' }
  }

  // Check for duplicate email or slug
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: 'A user with that email already exists.' }

  const existingSlug = await prisma.website.findUnique({ where: { slug } })
  if (existingSlug) return { error: 'That slug is already taken.' }

  const tempPassword = generatePassword()
  const hashedPassword = await bcrypt.hash(tempPassword, 10)

  const initialServices = JSON.stringify(['Service 1', 'Service 2', 'Service 3'])

  // Create user → client → website → initial version in one transaction
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'CUSTOMER',
      },
    })

    const client = await tx.client.create({
      data: {
        name,
        plan,
        status: 'Active',
        requestLimit: 10,
        userId: user.id,
      },
    })

    const website = await tx.website.create({
      data: {
        name: websiteName,
        slug,
        clientId: client.id,
      },
    })

    const version = await tx.version.create({
      data: {
        headline: `Welcome to ${name}`,
        subheading: 'We deliver exceptional work for every client.',
        about: `${name} is a design-led studio committed to craft and quality.`,
        services: initialServices,
        websiteId: website.id,
      },
    })

    await tx.website.update({
      where: { id: website.id },
      data: { liveVersionId: version.id },
    })
  })

  revalidatePath('/dashboard/admin')
  return { tempPassword }
}
