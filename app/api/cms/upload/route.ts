import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const websiteId = formData.get('websiteId') as string | null

  if (!file || !websiteId) {
    return Response.json({ error: 'Missing file or websiteId' }, { status: 400 })
  }

  // Verify the session user owns this website (or is admin)
  if (session.user.role !== 'ADMIN') {
    const website = await prisma.website.findUnique({
      where: { id: websiteId },
      include: { client: { include: { user: true } } },
    })
    if (website?.client.user.email !== session.user.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }
  }

  const blob = await put(`cms/${websiteId}/${Date.now()}-${file.name}`, file, {
    access: 'public',
  })

  return Response.json({ url: blob.url })
}
