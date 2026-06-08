import { cancelBookingByToken } from '@/lib/booking-actions'

export const dynamic = 'force-dynamic'

export default async function CancelBookingPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const result = await cancelBookingByToken(token)

  const success = !result.error

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#0e0b07' }}
    >
      <div
        className="max-w-md w-full px-8 py-10 text-center flex flex-col items-center gap-4"
        style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {success ? (
          <>
            <div
              className="w-12 h-12 flex items-center justify-center rounded-full"
              style={{ background: 'rgba(77,158,58,0.15)', border: '1px solid rgba(77,158,58,0.3)' }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M5 11l4 4 8-8" stroke="#6dbf56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-white">Booking cancelled</h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Your booking has been successfully cancelled.
            </p>
          </>
        ) : (
          <>
            <div
              className="w-12 h-12 flex items-center justify-center rounded-full"
              style={{ background: 'rgba(192,57,27,0.12)', border: '1px solid rgba(192,57,27,0.3)' }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M7 7l8 8M15 7l-8 8" stroke="#e05a3a" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-white">Could not cancel</h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {result.error}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
