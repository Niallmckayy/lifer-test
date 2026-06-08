'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import BirdLogo from '@/components/ui/BirdLogo'
import { LANDING_PHOTOS } from '@/lib/landingPhotos'

const features = [
  {
    title: 'Bespoke, not templated',
    body: 'Every site is crafted from scratch to reflect your brand — not adapted from a theme.',
  },
  {
    title: 'Plain-language requests',
    body: 'No emails, no tickets. Describe what you want in plain English and we handle the rest.',
  },
  {
    title: 'Same-day updates',
    body: 'Changes go live fast. Every update reviewed by our team before it ships.',
  },
  {
    title: 'Simple monthly billing',
    body: 'One flat plan. Cancel anytime. No setup costs, no lock-ins, no surprises.',
  },
  {
    title: 'AI-assisted on every change',
    body: 'Our platform drafts and quality-checks automatically before any deployment.',
  },
  {
    title: 'Preview before it goes live',
    body: 'See every change in a live preview environment before it reaches your audience.',
  },
]

const portfolio = [
  { name: 'MK Architects',   category: 'Architecture',     idx: 0 },
  { name: 'Bloom & Co',      category: 'Restaurant',       idx: 1 },
  { name: 'Cedar Legal',     category: 'Legal',            idx: 2 },
  { name: 'Dusk Fitness',    category: 'Fitness',          idx: 3 },
  { name: 'Aria Studio',     category: 'Technology',       idx: 4 },
  { name: 'Forma Retail',    category: 'Retail',           idx: 5 },
]

const steps = [
  { n: '01', title: 'We build your website', body: 'A bespoke, high-performance site crafted to reflect your brand — delivered fast, no templates.' },
  { n: '02', title: 'You request changes', body: 'Need an update? Log in and describe it in plain language. No emails, no tickets, no waiting.' },
  { n: '03', title: 'We review and deploy', body: 'Every change is AI-drafted, reviewed by our team, and deployed live — usually the same day.' },
]

const ACCENT     = '#d4830c'
const ACCENT_2   = '#e8a020'
const BG         = '#0e0b07'
const SURFACE    = '#17120c'
const SURFACE_2  = '#1f1912'
const TEXT       = '#f5e8d0'
const MUTED      = 'rgba(245,232,208,0.45)'
const BORDER     = 'rgba(212,131,12,0.16)'

const navLinks = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Portfolio',    href: '#portfolio' },
  { label: 'Services',     href: '#services' },
]

export default function Home() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div style={{ background: BG, minHeight: '100vh', color: TEXT, fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Nav ────────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 transition-all duration-300"
        style={{
          background: scrolled ? 'rgba(14,11,7,0.88)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? `1px solid ${BORDER}` : '1px solid transparent',
        }}
      >
        <Link href="/" className="flex items-center gap-3" style={{ color: ACCENT }}>
          <BirdLogo size={28} />
          <span
            className="text-xl font-semibold tracking-tight transition-colors duration-300"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              color: scrolled ? TEXT : '#1a120a',
            }}
          >
            Lifer
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <a
              key={link.href}
              href={link.href}
              className="text-base transition-colors duration-300"
              style={{ color: scrolled ? MUTED : 'rgba(26,18,10,0.75)' }}
              onMouseEnter={e => (e.currentTarget.style.color = scrolled ? TEXT : '#1a120a')}
              onMouseLeave={e => (e.currentTarget.style.color = scrolled ? MUTED : 'rgba(26,18,10,0.75)')}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-base transition-colors duration-300"
            style={{ color: scrolled ? MUTED : 'rgba(26,18,10,0.75)' }}
          >
            Sign in
          </Link>
          <a
            href="/try"
            className="text-base font-semibold px-6 py-2.5 transition-all hover:opacity-90"
            style={{ background: ACCENT, borderRadius: '999px', color: '#fff' }}
          >
            Try it out →
          </a>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section
        className="relative flex items-end overflow-hidden"
        style={{ minHeight: '100vh' }}
      >
        {/* Photo background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url('/images/hero.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 40%',
          }}
        />
        {/* Warm dark overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(14,11,7,0.35) 0%, rgba(14,11,7,0.55) 50%, rgba(14,11,7,0.92) 100%)' }}
        />

        {/* Content */}
        <div className="relative w-full max-w-6xl mx-auto px-8 pb-24 pt-32">

          <h1
            className="font-bold leading-[1.05] mb-6"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(3rem, 8vw, 6.5rem)',
              color: TEXT,
              maxWidth: '780px',
            }}
          >
            Great websites,{' '}
            <em style={{ color: ACCENT_2, fontStyle: 'italic' }}>spotted.</em>
          </h1>

          <p
            className="text-base leading-relaxed mb-10"
            style={{ color: 'rgba(245,232,208,0.65)', maxWidth: '520px' }}
          >
            See your business website come to life in seconds — no account, no credit card.
            Love it? Sign up and we&apos;ll keep it updated through a simple chat interface.
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            <a
              href="/try"
              className="text-sm font-semibold px-7 py-3.5 transition-all hover:opacity-90"
              style={{ background: ACCENT, borderRadius: '999px', color: '#fff', boxShadow: `0 0 40px rgba(212,131,12,0.4)` }}
            >
              Try it out — it&apos;s free →
            </a>
            <Link
              href="/book"
              className="text-sm font-medium px-7 py-3.5 transition-all"
              style={{ color: 'rgba(245,232,208,0.7)', border: '1px solid rgba(245,232,208,0.2)', borderRadius: '999px' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,232,208,0.4)'; e.currentTarget.style.color = TEXT }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(245,232,208,0.2)'; e.currentTarget.style.color = 'rgba(245,232,208,0.7)' }}
            >
              Book a consultation
            </Link>
          </div>
        </div>

        {/* Scroll chevron */}
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce"
          style={{ color: 'rgba(245,232,208,0.3)' }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────── */}
      <section id="how-it-works" className="px-8 py-28 max-w-6xl mx-auto">
        <div className="mb-16 text-center">
          <p className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: ACCENT }}>
            How it works
          </p>
          <h2
            className="font-bold tracking-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(2rem, 4vw, 3rem)', color: TEXT }}
          >
            Three steps to your new website
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map(step => (
            <div
              key={step.n}
              className="relative px-8 py-10 overflow-hidden"
              style={{ borderRadius: '20px', border: `1px solid ${BORDER}`, background: SURFACE }}
            >
              <div
                className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
                style={{ background: 'radial-gradient(circle at top right, rgba(212,131,12,0.08), transparent 70%)' }}
              />
              <span
                className="block text-5xl font-light mb-8 tabular-nums"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'rgba(212,131,12,0.22)' }}
              >
                {step.n}
              </span>
              <h3 className="text-base font-semibold mb-3" style={{ color: TEXT, fontFamily: "'Playfair Display', Georgia, serif" }}>
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Portfolio ──────────────────────────────────────── */}
      <section id="portfolio" className="px-8 py-28" style={{ background: SURFACE }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 text-center">
            <p className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: ACCENT }}>
              Selected work
            </p>
            <h2
              className="font-bold tracking-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(2rem, 4vw, 3rem)', color: TEXT }}
            >
              Built for businesses who care about craft
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolio.map(item => (
              <div
                key={item.name}
                className="group cursor-default overflow-hidden transition-all duration-300 hover:-translate-y-1"
                style={{ borderRadius: '16px', border: `1px solid ${BORDER}`, background: SURFACE_2 }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = `rgba(212,131,12,0.4)`)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
              >
                <div
                  className="h-44 overflow-hidden"
                  style={{ borderBottom: `1px solid ${BORDER}` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={LANDING_PHOTOS.portfolio[item.idx]}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="px-5 py-4 flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: TEXT, fontFamily: "'Playfair Display', Georgia, serif" }}>{item.name}</span>
                  <span
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(212,131,12,0.1)', color: ACCENT }}
                  >
                    {item.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section id="services" className="px-8 py-28 max-w-6xl mx-auto">
        <div className="mb-16 text-center">
          <p className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: ACCENT }}>
            What you get
          </p>
          <h2
            className="font-bold tracking-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(2rem, 4vw, 3rem)', color: TEXT }}
          >
            Everything you need, nothing you don&apos;t
          </h2>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-px"
          style={{ background: BORDER, borderRadius: '20px', overflow: 'hidden' }}
        >
          {features.map((f, i) => (
            <div
              key={i}
              className="px-8 py-8 transition-colors group"
              style={{ background: SURFACE }}
              onMouseEnter={e => (e.currentTarget.style.background = SURFACE_2)}
              onMouseLeave={e => (e.currentTarget.style.background = SURFACE)}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mb-5"
                style={{ background: 'rgba(212,131,12,0.12)', border: `1px solid rgba(212,131,12,0.25)` }}
              >
                <span className="text-xs font-bold" style={{ color: ACCENT }}>{i + 1}</span>
              </div>
              <h3 className="text-sm font-semibold mb-2.5 leading-snug" style={{ color: TEXT, fontFamily: "'Playfair Display', Georgia, serif" }}>
                {f.title}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: MUTED }}>
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Consultation CTA ───────────────────────────────── */}
      <section className="px-8 py-28" style={{ background: SURFACE }}>
        <div
          className="max-w-3xl mx-auto text-center px-8 py-16 relative overflow-hidden"
          style={{ borderRadius: '24px', border: `1px solid ${BORDER}`, background: BG }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, rgba(212,131,12,0.07) 0%, transparent 70%)' }}
          />
          <p className="text-xs uppercase tracking-widest font-semibold mb-4 relative" style={{ color: ACCENT }}>
            Get started
          </p>
          <h2
            className="font-bold tracking-tight mb-4 relative"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', color: TEXT }}
          >
            Ready to talk about your website?
          </h2>
          <p className="text-sm leading-relaxed mb-8 relative" style={{ color: MUTED, maxWidth: '420px', margin: '0 auto 2rem' }}>
            Book a free consultation and we&apos;ll discuss what you need, answer your questions, and show you how Lifer works.
          </p>
          <Link
            href="/book"
            className="inline-block text-sm font-semibold px-8 py-4 transition-all hover:opacity-90 relative"
            style={{ background: ACCENT, borderRadius: '999px', color: '#fff', boxShadow: `0 0 40px rgba(212,131,12,0.3)` }}
          >
            Book a free consultation →
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer
        className="px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ borderTop: `1px solid ${BORDER}`, background: BG }}
      >
        <div className="flex items-center gap-2.5" style={{ color: ACCENT }}>
          <BirdLogo size={18} />
          <span className="text-sm font-semibold" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: TEXT }}>
            Lifer
          </span>
        </div>
        <span className="text-xs" style={{ color: 'rgba(245,232,208,0.2)' }}>
          © {new Date().getFullYear()} Lifer. All rights reserved.
        </span>
        <nav className="flex items-center gap-6">
          <Link href="/login" className="text-xs" style={{ color: 'rgba(245,232,208,0.3)' }}>Log in</Link>
        </nav>
      </footer>
    </div>
  )
}
