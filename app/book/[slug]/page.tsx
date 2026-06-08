import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { parseTheme, buildCssVars } from '@/lib/booking-theme'
import BookingFlow from './BookingFlow'

export const dynamic = 'force-dynamic'

export default async function PublicBookingPage({
  params,
  searchParams,
}: {
  params:       Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { slug } = await params
  const sp       = await searchParams

  const website = await prisma.website.findUnique({
    where: { slug },
    include: {
      client: {
        select: {
          id:           true,
          name:         true,
          bookingTheme: true,
          bookingResources: {
            where:   { active: true },
            include: { availability: { orderBy: { dayOfWeek: 'asc' } } },
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  })

  if (!website?.client) notFound()

  const client = website.client

  // Build theme — URL params override DB when ?preview=1
  let theme = parseTheme(client.bookingTheme)
  if (sp['preview'] === '1') {
    const p = (k: string) => { const v = sp[k]; return typeof v === 'string' ? v : undefined }
    const primaryColor    = p('primaryColor')    ? decodeURIComponent(p('primaryColor')!)    : undefined
    const backgroundColor = p('bg')              ? decodeURIComponent(p('bg')!)              : undefined
    const mode            = p('mode') === 'light' ? 'light' as const : p('mode') === 'dark' ? 'dark' as const : undefined
    const borderRadius    = p('radius')           ? parseInt(p('radius')!)                    : undefined
    theme = {
      ...theme,
      ...(primaryColor    ? { primaryColor }    : {}),
      ...(backgroundColor ? { backgroundColor } : {}),
      ...(mode            ? { mode }            : {}),
      ...(borderRadius && !isNaN(borderRadius) ? { borderRadius } : {}),
    }
  }

  const cssVars = buildCssVars(theme)

  if (client.bookingResources.length === 0) {
    return (
      <>
        <style>{cssVars}</style>
        <div
          className="min-h-screen flex items-center justify-center px-4"
          style={{ background: 'var(--bp-bg)' }}
        >
          <p className="text-sm" style={{ color: 'var(--bp-text-muted)' }}>
            No booking services are available at this time.
          </p>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{cssVars}</style>
      <div className="min-h-screen" style={{ background: 'var(--bp-bg)' }}>
        <BookingFlow
          clientId={client.id}
          clientName={client.name}
          resources={client.bookingResources.map(r => ({
            id:           r.id,
            name:         r.name,
            description:  r.description,
            slotDuration: r.slotDuration,
            bufferTime:   r.bufferTime,
            maxCapacity:  r.maxCapacity,
            timezone:     r.timezone,
            color:        r.color,
            meetingType:  r.meetingType,
            location:     r.location,
            availability: r.availability.map(a => ({
              dayOfWeek: a.dayOfWeek,
              startTime: a.startTime,
              endTime:   a.endTime,
            })),
          }))}
        />
      </div>
    </>
  )
}
