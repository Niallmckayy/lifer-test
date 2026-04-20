import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, createdAt: true },
  })
  if (!user) redirect('/login')

  const memberSince = user.createdAt.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="flex-1 overflow-auto px-8 py-8" style={{ background: '#0e0b07' }}>
      <div className="max-w-xl mx-auto flex flex-col gap-6">

        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#f5e8d0' }}
          >
            Settings
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(245,232,208,0.35)' }}>
            Manage your account details.
          </p>
        </div>

        <SettingsClient
          userId={session.user.id}
          email={user.email}
          memberSince={memberSince}
        />

      </div>
    </div>
  )
}
