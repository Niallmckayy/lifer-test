'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
    label: 'My Project',
    href: '/dashboard/customer/project',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1.5" y="2.5" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
        <path d="M1.5 5.5h13" stroke="currentColor" strokeWidth="1.25" />
        <circle cx="4" cy="4" r=".75" fill="currentColor" />
        <circle cx="6.5" cy="4" r=".75" fill="currentColor" />
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

export default function CustomerSidebar({ email }: { email: string }) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard/customer') return pathname === '/dashboard/customer'
    return pathname.startsWith(href)
  }

  return (
    <aside
      className="w-60 shrink-0 flex flex-col h-full"
      style={{ background: '#141008', borderRight: '1px solid rgba(212,131,12,0.1)' }}
    >
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2.5" style={{ borderBottom: '1px solid rgba(245,232,208,0.06)' }}>
        <span style={{ color: '#d4830c' }}><BirdLogo size={20} /></span>
        <span
          className="text-base font-semibold"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#f5e8d0' }}
        >
          Lifer
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
        {navItems.map(item => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all"
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

      {/* Bottom: email + signout */}
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
    </aside>
  )
}
