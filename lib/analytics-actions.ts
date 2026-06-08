'use server'

import { prisma } from '@/lib/prisma'

export type DailyCount = { date: string; count: number }
export type PageCount  = { page: string; count: number }
export type RefCount   = { referrer: string; count: number }

export type AnalyticsData = {
  totalVisits:   number
  totalPageviews: number
  avgDuration:   number
  bookingClicks: number
  bookingRate:   number
  dailyVisits:   DailyCount[]
  topPages:      PageCount[]
  topReferrers:  RefCount[]
}

export async function getWebsiteAnalytics(
  websiteId: string,
  days: number = 30,
): Promise<AnalyticsData> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const events = await prisma.analyticsEvent.findMany({
    where: { websiteId, createdAt: { gte: since } },
    select: { type: true, page: true, sessionId: true, duration: true, referrer: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  const pageviews  = events.filter(e => e.type === 'pageview')
  const durations  = events.filter(e => e.type === 'duration' && e.duration != null)
  const bookings   = events.filter(e => e.type === 'booking_click')

  const uniqueSessions = new Set(pageviews.map(e => e.sessionId))
  const totalVisits    = uniqueSessions.size
  const totalPageviews = pageviews.length
  const avgDuration    = durations.length
    ? Math.round(durations.reduce((s, e) => s + (e.duration ?? 0), 0) / durations.length)
    : 0
  const bookingClicks  = bookings.length
  const bookingRate    = totalVisits > 0 ? Math.round((bookingClicks / totalVisits) * 100) : 0

  // Daily visits (unique sessions per day)
  const dailyMap = new Map<string, Set<string>>()
  for (let i = 0; i < days; i++) {
    const d = new Date(since)
    d.setDate(d.getDate() + i)
    dailyMap.set(d.toISOString().slice(0, 10), new Set())
  }
  for (const e of pageviews) {
    const day = e.createdAt.toISOString().slice(0, 10)
    if (dailyMap.has(day)) dailyMap.get(day)!.add(e.sessionId)
  }
  const dailyVisits: DailyCount[] = Array.from(dailyMap.entries()).map(([date, sessions]) => ({
    date,
    count: sessions.size,
  }))

  // Top pages
  const pageMap = new Map<string, number>()
  for (const e of pageviews) pageMap.set(e.page, (pageMap.get(e.page) ?? 0) + 1)
  const topPages: PageCount[] = Array.from(pageMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([page, count]) => ({ page, count }))

  // Top referrers
  const refMap = new Map<string, number>()
  for (const e of pageviews) {
    if (e.referrer) refMap.set(e.referrer, (refMap.get(e.referrer) ?? 0) + 1)
  }
  const topReferrers: RefCount[] = Array.from(refMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([referrer, count]) => ({ referrer, count }))

  return { totalVisits, totalPageviews, avgDuration, bookingClicks, bookingRate, dailyVisits, topPages, topReferrers }
}
