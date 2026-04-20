'use client'

import { useState, useRef, useEffect } from 'react'
import type { RefObject } from 'react'
import { submitChangeRequest } from '@/lib/actions'

type Message = { id: string; role: 'user' | 'assistant'; text: string }

const greeting: Message = {
  id: 'greeting',
  role: 'assistant',
  text: "Describe a change to your website and I'll generate a draft for review.",
}

interface Props {
  clientId: string
  websiteId: string
  atLimit?: boolean
  initialRequests?: { id: string; message: string; status: string; createdAt: string }[]
  clearRef?: RefObject<(() => void) | null>
}

export default function ChatPanel({ clientId, websiteId, atLimit = false, clearRef }: Props) {
  const [messages, setMessages] = useState<Message[]>([greeting])
  const [input, setInput] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (clearRef) clearRef.current = () => { setMessages([greeting]); setInput('') }
  }, [clearRef])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || isBusy || atLimit) return

    const userMsgId = `user-${Date.now()}`
    const asstMsgId = `asst-${Date.now()}`

    setMessages(prev => [
      ...prev,
      { id: userMsgId, role: 'user', text: trimmed },
      { id: asstMsgId, role: 'assistant', text: 'Processing request…' },
    ])
    setInput('')
    setIsBusy(true)

    try {
      const result = await submitChangeRequest(clientId, websiteId, trimmed)
      const reply = result.error
        ? result.error
        : 'Draft ready — switch to Draft Preview above to see your changes.'
      setMessages(prev => prev.map(m => m.id === asstMsgId ? { ...m, text: reply } : m))
    } catch {
      setMessages(prev =>
        prev.map(m => m.id === asstMsgId ? { ...m, text: 'Something went wrong. Please try again.' } : m),
      )
    } finally {
      setIsBusy(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const disabled = isBusy || atLimit

  return (
    <div className="flex flex-col h-full" style={{ background: 'transparent' }}>

      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3.5 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: 'linear-gradient(135deg, #6b7aff, #a78bfa)', boxShadow: '0 0 6px rgba(107,122,255,0.5)' }}
          />
          <span className="text-xs font-semibold text-white">Change Request</span>
        </div>
        {isBusy ? (
          <span className="text-xs font-medium animate-pulse" style={{ color: '#6b7aff' }}>processing…</span>
        ) : (
          messages.length > 1 && (
            <button
              onClick={() => { setMessages([greeting]); setInput('') }}
              className="text-xs transition-opacity hover:opacity-70"
              style={{ color: 'rgba(255,255,255,0.25)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Clear
            </button>
          )
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[85%] text-sm leading-relaxed px-4 py-2.5"
              style={
                msg.role === 'user'
                  ? {
                      background: 'linear-gradient(135deg, #6b7aff, #a78bfa)',
                      color: '#fff',
                      borderRadius: '14px 14px 4px 14px',
                      boxShadow: '0 4px 16px rgba(107,122,255,0.25)',
                    }
                  : isBusy && msg.text === 'Processing request…'
                  ? {
                      background: 'rgba(107,122,255,0.08)',
                      color: '#6b7aff',
                      border: '1px solid rgba(107,122,255,0.2)',
                      borderRadius: '14px 14px 14px 4px',
                    }
                  : {
                      background: 'rgba(255,255,255,0.05)',
                      color: 'rgba(255,255,255,0.8)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '14px 14px 14px 4px',
                    }
              }
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input dock */}
      <div className="px-4 py-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {atLimit ? (
          <div
            className="px-4 py-3 text-center text-xs rounded-xl"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}
          >
            Monthly limit reached. Contact us to upgrade.
          </div>
        ) : (
          <>
            <div className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                placeholder={isBusy ? 'Working on it…' : 'Describe the change you want…'}
                rows={2}
                className="flex-1 resize-none text-sm placeholder:text-gray-600 focus:outline-none transition-all disabled:cursor-not-allowed"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: 'rgba(255,255,255,0.85)',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(107,122,255,0.4)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
              />
              <button
                onClick={handleSend}
                disabled={disabled}
                className="text-white text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #6b7aff, #a78bfa)',
                  borderRadius: '999px',
                  padding: '10px 18px',
                  boxShadow: disabled ? 'none' : '0 0 16px rgba(107,122,255,0.3)',
                }}
              >
                Send
              </button>
            </div>
            <p className="mt-2 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>↵ send · shift+↵ new line</p>
          </>
        )}
      </div>
    </div>
  )
}
