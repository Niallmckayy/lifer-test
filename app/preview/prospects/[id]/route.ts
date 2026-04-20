import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const prospect = await prisma.prospect.findUnique({ where: { id } })

  if (!prospect?.htmlContent) {
    return new NextResponse('Not found', { status: 404 })
  }

  return new NextResponse(prospect.htmlContent, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
