'use client'

import { useTransition } from 'react'
import { createBillingPortalSession } from '@/lib/actions'

export default function BillingPortalButton({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const result = await createBillingPortalSession(userId)
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
      style={{ background: '#d4830c', borderRadius: '999px', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 0 30px rgba(212,131,12,0.2)' }}
    >
      {pending ? 'Loading…' : 'Manage Billing →'}
    </button>
  )
}
