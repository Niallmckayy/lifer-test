import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const draft = request.nextUrl.searchParams.get('draft') === '1'

  const website = await prisma.website.findUnique({
    where: { slug },
    include: { client: { include: { user: true } } },
  })

  if (!website) return new NextResponse('Not found', { status: 404 })

  if (draft) {
    // Auth-gated: must be the site owner or an admin
    const session = await auth()
    const role = (session?.user as { role?: string })?.role
    const isAdmin = role === 'ADMIN'
    const isOwner = role === 'CUSTOMER' && session?.user?.email === website.client?.user?.email

    if (!isAdmin && !isOwner) {
      return new NextResponse('Unauthorised', { status: 401 })
    }

    if (!website.draftHtmlContent) {
      return new NextResponse('No draft available', { status: 404 })
    }

    return new NextResponse(website.draftHtmlContent, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  if (!website.htmlContent) {
    return new NextResponse('Not found', { status: 404 })
  }

  return new NextResponse(website.htmlContent, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
