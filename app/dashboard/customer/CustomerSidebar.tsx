'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import BirdLogo from '@/components/ui/BirdLogo'
import SignOutButton from '@/components/ui/SignOutButton'

const navItems = [
  {
    label: 'Overview',
    href: '/dashboard/customer',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 6.5L8 2l6 4.5V14a1 1 0 01-1 1H3a1 1 0 01-1-1V6.5z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Bookings',
    href: '/dashboard/customer/bookings',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1.5" y="2.5" width="13" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
        <path d="M1.5 6.5h13" stroke="currentColor" strokeWidth="1.25" />
        <path d="M5 1.5v2M11 1.5v2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        <rect x="4" y="9" width="2" height="2" rx=".4" fill="currentColor" />
        <rect x="7" y="9" width="2" height="2" rx=".4" fill="currentColor" />
        <rect x="10" y="9" width="2" height="2" rx=".4" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: 'Content',
    href: '/dashboard/customer/content',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2.5 4.5h11M2.5 7.5h8M2.5 10.5h6" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        <rect x="1.5" y="1.5" width="13" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
      </svg>
    ),
  },
  {
    label: 'Analytics',
    href: '/dashboard/customer/analytics',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 12L6 7.5L9.5 10L14 4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 4h-3M14 4v3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Billing',
    href: '/dashboard/customer/billing',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
        <path d="M1.5 6.5h13" stroke="currentColor" strokeWidth="1.25" />
        <rect x="3" y="9" width="3" height="1.5" rx=".5" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    href: '/dashboard/customer/settings',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.25" />
        <path d="M8 1.5v1M8 13.5v1M1.5 8h1M13.5 8h1M3.4 3.4l.7.7M11.9 11.9l.7.7M12.6 3.4l-.7.7M4.1 11.9l-.7.7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </svg>
    ),
  },
]

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard/customer') return pathname === '/dashboard/customer'
    return pathname.startsWith(href)
  }

  return (
    <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
      {navItems.map(item => {
        const active = isActive(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all${active ? '' : ' nav-item'}`}
            style={{
              borderRadius: '10px',
              background: active ? 'rgba(212,131,12,0.12)' : 'transparent',
              color: active ? '#e8a020' : 'rgba(245,232,208,0.4)',
            }}
          >
            <span style={{ color: active ? '#d4830c' : 'rgba(245,232,208,0.3)' }}>
              {item.icon}
            </span>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export default function CustomerSidebar({ email }: { email: string }) {
  const [open, setOpen] = useState(false)

  const logoBlock = (
    <div className="px-5 py-5 flex items-center gap-2.5" style={{ borderBottom: '1px solid rgba(245,232,208,0.06)' }}>
      <span style={{ color: '#d4830c' }}><BirdLogo size={20} /></span>
      <span
        className="text-base font-semibold"
        style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#f5e8d0' }}
      >
        Lifer
      </span>
    </div>
  )

  const bottomBlock = (
    <div
      className="px-5 py-4 flex flex-col gap-2"
      style={{ borderTop: '1px solid rgba(245,232,208,0.06)' }}
    >
      <span className="text-xs truncate" style={{ color: 'rgba(245,232,208,0.25)' }}>{email}</span>
      <SignOutButton
        className="text-xs font-medium text-left transition-opacity hover:opacity-70"
        style={{ color: 'rgba(245,232,208,0.35)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      />
    </div>
  )

  return (
    <>
      {/* ── Desktop sidebar ───────────────────────────────────── */}
      <aside
        className="hidden md:flex w-60 shrink-0 flex-col h-full"
        style={{ background: '#141008', borderRight: '1px solid rgba(212,131,12,0.1)' }}
      >
        {logoBlock}
        <NavLinks />
        {bottomBlock}
      </aside>

      {/* ── Mobile top bar ────────────────────────────────────── */}
      <div
        className="flex md:hidden items-center justify-between px-4 shrink-0"
        style={{
          height: 52,
          background: '#141008',
          borderBottom: '1px solid rgba(212,131,12,0.1)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <span style={{ color: '#d4830c' }}><BirdLogo size={18} /></span>
          <span
            className="text-base font-semibold"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#f5e8d0' }}
          >
            Lifer
          </span>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          style={{ color: 'rgba(245,232,208,0.5)', background: 'none', border: 'none', cursor: 'pointer', padding: 6, lineHeight: 0 }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* ── Mobile drawer overlay ─────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={() => setOpen(false)}
          />
          <aside
            className="relative flex flex-col h-full w-64 shrink-0"
            style={{ background: '#141008', borderRight: '1px solid rgba(212,131,12,0.1)' }}
          >
            <div
              className="px-5 py-5 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(245,232,208,0.06)' }}
            >
              <div className="flex items-center gap-2.5">
                <span style={{ color: '#d4830c' }}><BirdLogo size={20} /></span>
                <span
                  className="text-base font-semibold"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#f5e8d0' }}
                >
                  Lifer
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                style={{ color: 'rgba(245,232,208,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 0 }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
            {bottomBlock}
          </aside>
        </div>
      )}
    </>
  )
}
