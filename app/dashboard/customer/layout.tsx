import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import CustomerSidebar from './CustomerSidebar'
import TrialBanner from './TrialBanner'
import { prisma } from '@/lib/prisma'

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const [user, client] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } }),
    prisma.client.findUnique({ where: { userId: session.user.id }, select: { subscriptionStatus: true } as Record<string, unknown> }),
  ])

  const isTrialing = (client as { subscriptionStatus?: string | null } | null)?.subscriptionStatus === 'trialing'

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0e0b07' }}>
      <CustomerSidebar email={user?.email ?? ''} />
      <main className="flex-1 flex flex-col overflow-y-auto">
        {isTrialing && <TrialBanner />}
        {children}
      </main>
    </div>
  )
}
