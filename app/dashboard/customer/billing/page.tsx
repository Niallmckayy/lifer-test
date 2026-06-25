import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getBillingData } from '@/lib/actions'
import BillingPortalButton from './BillingPortalButton'
import CheckoutButton from './CheckoutButton'

const statusStyle: Record<string, { bg: string; color: string }> = {
  active:   { bg: 'rgba(77,158,58,0.12)',   color: '#6dbf56' },
  trialing: { bg: 'rgba(212,131,12,0.12)',  color: '#e8a020' },
  past_due: { bg: 'rgba(192,57,27,0.12)',   color: '#e05a3a' },
  canceled: { bg: 'rgba(245,232,208,0.06)', color: 'rgba(245,232,208,0.3)' },
}

export default async function BillingPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const billing = await getBillingData(session.user.id)
  if (!billing) redirect('/login')

  const s = statusStyle[billing.subscriptionStatus ?? ''] ?? statusStyle.active

  return (
    <div className="flex-1 overflow-auto px-8 py-8" style={{ background: '#0e0b07' }}>
      <div className="max-w-xl mx-auto flex flex-col gap-6">

        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#f5e8d0' }}
          >
            Billing
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(245,232,208,0.35)' }}>
            Manage your plan and payment details.
          </p>
        </div>

        {/* Plan card */}
        <div
          className="px-6 py-5 flex flex-col gap-4"
          style={{
            background: 'rgba(245,232,208,0.03)',
            borderRadius: '16px',
            border: '1px solid rgba(245,232,208,0.07)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'rgba(245,232,208,0.3)' }}>Plan</p>
              <p className="text-lg font-semibold" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#f5e8d0' }}>
                {billing.plan}
              </p>
            </div>
            {billing.subscriptionStatus && (
              <span
                className="text-xs font-semibold px-3 py-1 capitalize"
                style={{ background: s.bg, color: s.color, borderRadius: '999px' }}
              >
                {billing.subscriptionStatus.replace('_', ' ')}
              </span>
            )}
          </div>

          <div style={{ borderTop: '1px solid rgba(245,232,208,0.06)', paddingTop: '1rem' }}>
            <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'rgba(245,232,208,0.3)' }}>
              Current period ends
            </p>
            <p className="text-sm" style={{ color: 'rgba(245,232,208,0.6)' }}>
              {billing.currentPeriodEnd
                ? billing.currentPeriodEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                : '—'}
            </p>
          </div>
        </div>

        {/* Manage billing */}
        {billing.stripeCustomerId ? (
          <BillingPortalButton userId={session.user.id} />
        ) : (
          <CheckoutButton userId={session.user.id} />
        )}

      </div>
    </div>
  )
}
