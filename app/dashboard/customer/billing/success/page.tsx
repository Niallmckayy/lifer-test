import Link from 'next/link'

export default function BillingSuccessPage() {
  return (
    <div className="flex-1 flex items-center justify-center" style={{ background: '#0e0b07' }}>
      <div className="text-center flex flex-col gap-4 max-w-sm px-6">
        <p
          className="text-2xl font-bold"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#f5e8d0' }}
        >
          Trial started
        </p>
        <p className="text-sm" style={{ color: 'rgba(245,232,208,0.5)' }}>
          Your 14-day free trial is active. You won&apos;t be charged until it ends.
        </p>
        <Link
          href="/dashboard/customer/billing"
          className="text-sm font-semibold underline"
          style={{ color: '#c8a96e' }}
        >
          Back to billing
        </Link>
      </div>
    </div>
  )
}
