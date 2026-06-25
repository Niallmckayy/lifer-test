import Link from 'next/link'

export default function TrialBanner() {
  return (
    <div
      className="flex items-center justify-between gap-4 px-5 py-2.5 text-xs"
      style={{
        background: 'rgba(200,169,110,0.1)',
        borderBottom: '1px solid rgba(200,169,110,0.15)',
        color: '#c8a96e',
      }}
    >
      <span>Your free trial is active — you won&apos;t be charged until it ends.</span>
      <Link
        href="/dashboard/customer/billing"
        className="font-semibold shrink-0 hover:opacity-70 transition-opacity"
        style={{ color: '#c8a96e' }}
      >
        Manage billing →
      </Link>
    </div>
  )
}
