'use client'

import { useTransition } from 'react'
import { deleteClient } from '@/lib/actions'

export default function DeleteClientButton({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm(`Delete "${clientName}" and all their data? This cannot be undone.`)) return
    startTransition(async () => {
      const result = await deleteClient(clientId)
      if (result.error) alert(result.error)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="text-xs font-medium transition-opacity hover:opacity-70 disabled:opacity-30"
      style={{ color: '#e05a3a', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
    >
      {pending ? 'Deleting…' : 'Delete'}
    </button>
  )
}
