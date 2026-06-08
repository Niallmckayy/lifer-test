'use client'

import { useState, useTransition } from 'react'
import { disconnectCalendar } from '@/lib/actions'

interface Props {
  clientId:   string
  connection: { provider: string; calendarId: string; createdAt: Date } | null
  googleConfigured:  boolean
  outlookConfigured: boolean
}

const PROVIDER_LABELS: Record<string, string> = {
  google:  'Google Calendar',
  outlook: 'Outlook Calendar',
}

const PROVIDER_ICONS: Record<string, string> = {
  google:  'G',
  outlook: 'O',
}

export default function CalendarConnect({ clientId, connection, googleConfigured, outlookConfigured }: Props) {
  const [error, setError]          = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleDisconnect() {
    setError(null)
    startTransition(async () => {
      const result = await disconnectCalendar(clientId)
      if (result?.error) setError(result.error)
    })
  }

  const hasAnyProvider = googleConfigured || outlookConfigured

  return (
    <section>
      <h2 className="text-sm font-semibold text-white mb-3">Calendar sync</h2>
      <div
        className="p-4 rounded-xl flex flex-col gap-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {connection ? (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold"
                style={{ background: 'rgba(77,158,58,0.15)', color: '#6dbf56', border: '1px solid rgba(77,158,58,0.25)' }}
              >
                {PROVIDER_ICONS[connection.provider] ?? '?'}
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {PROVIDER_LABELS[connection.provider] ?? connection.provider} connected
                </p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  New bookings will appear in your calendar automatically.
                </p>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              disabled={pending}
              className="text-xs px-3 py-1.5 transition-opacity hover:opacity-70 shrink-0"
              style={{ background: 'rgba(192,57,27,0.1)', color: '#e05a3a', borderRadius: '8px', border: '1px solid rgba(192,57,27,0.2)' }}
            >
              {pending ? 'Disconnecting…' : 'Disconnect'}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Connect a calendar and new bookings will be added automatically. When a booking is cancelled, the event is removed.
            </p>
            {!hasAnyProvider && (
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Calendar OAuth is not configured on this server. Add <code style={{ color: '#e8a020' }}>GOOGLE_CLIENT_ID</code> or <code style={{ color: '#e8a020' }}>MICROSOFT_CLIENT_ID</code> to enable it.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {googleConfigured && (
                <a
                  href="/api/calendar/google"
                  className="flex items-center gap-2 text-xs font-medium px-4 py-2.5 transition-opacity hover:opacity-80"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <span
                    className="w-5 h-5 flex items-center justify-center rounded text-xs font-bold"
                    style={{ background: '#4285F4', color: '#fff' }}
                  >G</span>
                  Connect Google Calendar
                </a>
              )}
              {outlookConfigured && (
                <a
                  href="/api/calendar/outlook"
                  className="flex items-center gap-2 text-xs font-medium px-4 py-2.5 transition-opacity hover:opacity-80"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <span
                    className="w-5 h-5 flex items-center justify-center rounded text-xs font-bold"
                    style={{ background: '#0078D4', color: '#fff' }}
                  >O</span>
                  Connect Outlook Calendar
                </a>
              )}
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs" style={{ color: '#e05a3a' }}>{error}</p>
        )}
      </div>
    </section>
  )
}
