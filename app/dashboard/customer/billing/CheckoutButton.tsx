'use client'

import { useTransition } from 'react'
import { createCheckoutSession } from '@/lib/actions'

export default function CheckoutButton({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const result = await createCheckoutSession(userId)
      if (result.url) {
        window.location.href = result.url
      } else if (result.error) {
        alert(result.error)
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="w-full text-sm font-semibold py-3.5 transition-all hover:opacity-90 disabled:opacity-50"
      style={{ background: '#c8a96e', borderRadius: '999px', color: '#0e0b07', border: 'none', cursor: 'pointer', boxShadow: '0 0 30px rgba(200,169,110,0.2)' }}
    >
      {pending ? 'Redirecting…' : 'Start free 14-day trial →'}
    </button>
  )
}
