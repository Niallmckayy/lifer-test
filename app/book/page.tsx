import { prisma } from '@/lib/prisma'
import BookingFlow from './[slug]/BookingFlow'

export const dynamic = 'force-dynamic'

export default async function BookPage() {
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    include: {
      client: {
        include: {
          bookingResources: {
            where:   { active: true },
            include: { availability: { orderBy: { dayOfWeek: 'asc' } } },
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  })

  const client = adminUser?.client

  if (!client || client.bookingResources.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0e0b07' }}>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
          No booking sessions available at this time.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#0e0b07' }}>
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
          availability: r.availability.map(a => ({
            dayOfWeek: a.dayOfWeek,
            startTime: a.startTime,
            endTime:   a.endTime,
          })),
        }))}
      />
    </div>
  )
}
