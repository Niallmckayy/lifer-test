import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import NewClientForm from './NewClientForm'
import BirdLogo from '@/components/ui/BirdLogo'

export default async function NewClientPage() {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen" style={{ background: '#0e0b07' }}>

      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-3.5"
        style={{ background: 'rgba(14,11,7,0.92)', borderBottom: '1px solid rgba(212,131,12,0.14)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5" style={{ color: '#d4830c' }}>
            <BirdLogo size={20} />
            <span className="text-sm font-semibold" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#f5e8d0' }}>
              Lifer
            </span>
          </Link>
          <span className="block w-px h-4" style={{ background: 'rgba(245,232,208,0.1)' }} />
          <Link
            href="/dashboard/admin"
            className="text-xs font-medium transition-opacity hover:opacity-70"
            style={{ color: 'rgba(245,232,208,0.4)' }}
          >
            ← Admin
          </Link>
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(245,232,208,0.6)' }}>
            New Client
          </span>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-10">
        <div
          className="px-8 py-8"
          style={{
            background: '#17120c',
            borderRadius: '16px',
            border: '1px solid rgba(212,131,12,0.16)',
          }}
        >
          <h1
            className="text-lg font-semibold mb-1"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#f5e8d0' }}
          >
            Create a client
          </h1>
          <p className="text-sm mb-8" style={{ color: 'rgba(245,232,208,0.4)' }}>
            This creates a login account, client record, and initial website.
          </p>
          <NewClientForm />
        </div>
      </main>
    </div>
  )
}
