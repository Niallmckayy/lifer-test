import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import CustomerSidebar from './CustomerSidebar'
import { prisma } from '@/lib/prisma'

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  })

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0e0b07' }}>
      <CustomerSidebar email={user?.email ?? ''} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
