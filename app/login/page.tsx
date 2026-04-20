import Link from 'next/link'
import LoginForm from '@/components/ui/LoginForm'
import BirdLogo from '@/components/ui/BirdLogo'
import { LANDING_PHOTOS } from '@/lib/landingPhotos'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex" style={{ background: '#0e0b07' }}>

      {/* ── Left panel — photo ─────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-120 shrink-0 relative overflow-hidden"
        style={{ borderRight: '1px solid rgba(212,131,12,0.16)' }}
      >
        {/* Photo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LANDING_PHOTOS.loginPanel}
          alt="Autumn bird"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Warm overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(14,11,7,0.3) 0%, rgba(14,11,7,0.65) 60%, rgba(14,11,7,0.92) 100%)' }}
        />

        {/* Logo — links back to landing */}
        <Link href="/" className="relative p-12 flex items-center gap-3 w-fit" style={{ color: '#d4830c' }}>
          <BirdLogo size={26} />
          <span
            className="text-lg font-semibold"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#f5e8d0' }}
          >
            Lifer
          </span>
        </Link>

        {/* Testimonial */}
        <div className="relative p-12">
          <p
            className="text-xl font-light leading-relaxed mb-6"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'rgba(245,232,208,0.85)', fontStyle: 'italic' }}
          >
            &ldquo;Our website used to take weeks to update. Now it&rsquo;s hours. Lifer changed how we think about our online presence.&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: 'rgba(212,131,12,0.25)', border: '1px solid rgba(212,131,12,0.4)', color: '#d4830c' }}
            >
              M
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#f5e8d0' }}>Michael K.</p>
              <p className="text-xs" style={{ color: 'rgba(245,232,208,0.4)' }}>MK Architects</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ─────────────────────────────── */}
      <div className="flex flex-1 flex-col" style={{ background: '#0e0b07' }}>

        {/* Top bar */}
        <header className="flex items-center justify-between px-8 py-5">
          <Link href="/" className="flex items-center gap-2.5 lg:hidden" style={{ color: '#d4830c' }}>
            <BirdLogo size={22} />
            <span
              className="text-sm font-semibold"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#f5e8d0' }}
            >
              Lifer
            </span>
          </Link>
          <Link
            href="/"
            className="hidden lg:flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70"
            style={{ color: 'rgba(245,232,208,0.4)' }}
          >
            ← Back to home
          </Link>
          <span className="ml-auto text-sm" style={{ color: 'rgba(245,232,208,0.35)' }}>
            Don&apos;t have an account?{' '}
            <a href="/#contact" className="font-medium" style={{ color: '#d4830c' }}>
              Get started
            </a>
          </span>
        </header>

        {/* Centered form */}
        <div className="flex flex-1 items-center justify-center px-6 py-16">
          <div className="w-full max-w-sm">

            <div className="mb-8">
              <h1
                className="text-2xl font-bold tracking-tight mb-2"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#f5e8d0' }}
              >
                Welcome back
              </h1>
              <p className="text-sm" style={{ color: 'rgba(245,232,208,0.4)' }}>
                Sign in to your Lifer workspace
              </p>
            </div>

            <div
              className="px-8 py-8"
              style={{
                background: 'rgba(245,232,208,0.03)',
                borderRadius: '20px',
                border: '1px solid rgba(212,131,12,0.15)',
                boxShadow: '0 0 60px rgba(0,0,0,0.4)',
              }}
            >
              <LoginForm />
            </div>

            <p className="mt-6 text-center text-xs" style={{ color: 'rgba(245,232,208,0.2)' }}>
              By signing in you agree to our{' '}
              <span className="underline cursor-pointer" style={{ color: 'rgba(245,232,208,0.4)' }}>Terms</span>
              {' '}and{' '}
              <span className="underline cursor-pointer" style={{ color: 'rgba(245,232,208,0.4)' }}>Privacy Policy</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
