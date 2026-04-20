'use client'

import { useState, useTransition } from 'react'
import { updateClientBilling } from '@/lib/actions'

interface Props {
  clientId: string
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  plan: string
  requestLimit: number
  subscriptionStatus: string | null
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  active:   { bg: 'rgba(34,197,94,0.1)',          color: '#4ade80' },
  past_due: { bg: 'rgba(245,158,11,0.1)',          color: '#fbbf24' },
  canceled: { bg: 'rgba(255,255,255,0.06)',        color: 'rgba(255,255,255,0.35)' },
}

export default function AdminBillingForm({
  clientId,
  stripeCustomerId,
  stripeSubscriptionId,
  plan,
  requestLimit,
  subscriptionStatus,
}: Props) {
  const [open, setOpen]       = useState(false)
  const [cid, setCid]         = useState(stripeCustomerId ?? '')
  const [sid, setSid]         = useState(stripeSubscriptionId ?? '')
  const [lim, setLim]         = useState(String(requestLimit))
  const [pl, setPl]           = useState(plan)
  const [isPending, startTransition] = useTransition()

  const statusKey = subscriptionStatus ?? 'active'
  const statusStyle = STATUS_STYLE[statusKey] ?? STATUS_STYLE.active

  function save() {
    startTransition(async () => {
      await updateClientBilling(clientId, {
        stripeCustomerId:     cid || undefined,
        stripeSubscriptionId: sid || undefined,
        plan: pl,
        requestLimit: parseInt(lim, 10) || requestLimit,
      })
      setOpen(false)
    })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    padding: '7px 10px',
    fontSize: '12px',
    color: '#fff',
    outline: 'none',
    fontFamily: 'monospace',
  }

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className="text-xs font-medium transition-opacity hover:opacity-70"
        style={{ color: '#d4830c', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        {open ? 'close' : 'edit billing'}
      </button>

      {!open && (
        <div className="flex items-center gap-2 mt-1">
          <span
            className="inline-block text-xs font-semibold px-2 py-0.5"
            style={{ ...statusStyle, borderRadius: '999px' }}
          >
            {statusKey}
          </span>
          {stripeCustomerId && (
            <span className="text-xs font-mono" style={{ color: '#aaa' }}>
              {stripeCustomerId.slice(0, 14)}…
            </span>
          )}
        </div>
      )}

      {open && (
        <div className="mt-3 flex flex-col gap-2.5 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Plan</label>
            <select value={pl} onChange={e => setPl(e.target.value)} style={{ ...inputStyle, fontFamily: 'inherit' }}>
              <option value="Starter">Starter</option>
              <option value="Growth">Growth</option>
              <option value="Studio">Studio</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Request limit / month</label>
            <input value={lim} onChange={e => setLim(e.target.value)} type="number" style={inputStyle} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Stripe customer ID</label>
            <input value={cid} onChange={e => setCid(e.target.value)} placeholder="cus_..." style={inputStyle} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Stripe subscription ID</label>
            <input value={sid} onChange={e => setSid(e.target.value)} placeholder="sub_..." style={inputStyle} />
          </div>
          <button
            onClick={save}
            disabled={isPending}
            className="text-xs font-semibold text-white py-2 transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ background: '#d4830c', borderRadius: '8px' }}
          >
            {isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}
    </div>
  )
}
