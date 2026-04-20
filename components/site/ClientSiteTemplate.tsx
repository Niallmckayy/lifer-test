interface Version {
  headline: string
  subheading: string
  about: string
  services: string[]
}

interface Props {
  version: Version
  siteName: string
  isDraft: boolean
}

export default function ClientSiteTemplate({ version, siteName, isDraft }: Props) {
  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f', color: '#fff' }}>

      {/* Draft banner */}
      {isDraft && (
        <div
          className="sticky top-0 z-50 flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold"
          style={{
            background: 'rgba(107,122,255,0.1)',
            borderBottom: '1px solid rgba(107,122,255,0.2)',
            color: '#a78bfa',
            backdropFilter: 'blur(10px)',
          }}
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#6b7aff' }} />
          Draft Preview · Not Live · Only visible to you
        </div>
      )}

      {/* Nav */}
      <nav
        className="flex items-center justify-between px-10 py-6"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <span className="text-sm font-semibold tracking-tight">{siteName}</span>
        <div className="flex items-center gap-10">
          {['Work', 'Studio', 'Contact'].map(link => (
            <span key={link} className="text-xs uppercase tracking-widest cursor-default" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {link}
            </span>
          ))}
        </div>
      </nav>

      {/* Hero */}
      <section
        className="relative px-10 py-32 overflow-hidden"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 20% 50%, rgba(107,122,255,0.06) 0%, transparent 70%)' }}
        />
        <p className="text-xs uppercase tracking-widest mb-8 font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Architecture Studio · London
        </p>
        <h1
          className="font-light leading-tight mb-8 max-w-2xl"
          style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            color: isDraft ? '#a78bfa' : '#fff',
          }}
        >
          {version.headline}
        </h1>
        <p className="leading-relaxed max-w-lg mb-14 text-base" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {version.subheading}
        </p>
        <div className="flex items-center gap-4">
          <span
            className="text-xs uppercase tracking-widest px-8 py-4 cursor-default transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)', borderRadius: '2px' }}
          >
            View Work
          </span>
          <span className="text-xs uppercase tracking-widest px-8 py-4 cursor-default" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Contact
          </span>
        </div>
      </section>

      {/* Services */}
      <section
        className="px-10 py-24"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p className="text-xs uppercase tracking-widest mb-12 font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Services
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: 'rgba(255,255,255,0.06)' }}>
          {version.services.map(s => (
            <div
              key={s}
              className="px-6 py-6 text-sm"
              style={{ background: '#0a0a0f', color: 'rgba(255,255,255,0.6)' }}
            >
              {s}
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section
        className="px-10 py-24"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <p className="text-xs uppercase tracking-widest mb-10 font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Studio
        </p>
        <p className="leading-relaxed max-w-2xl text-base" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {version.about}
        </p>
      </section>

      {/* Contact */}
      <section className="px-10 py-24 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 50% 60% at 80% 50%, rgba(107,122,255,0.05) 0%, transparent 70%)' }}
        />
        <p className="text-xs uppercase tracking-widest mb-10 font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Contact
        </p>
        <h2 className="text-4xl font-light mb-10" style={{ color: '#fff' }}>Get in touch.</h2>
        <div className="flex flex-col gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <span>hello@{siteName.toLowerCase().replace(/\s+/g, '')}.com</span>
          <span>+44 20 1234 5678</span>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-10 py-6 flex items-center justify-between"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>{siteName}</span>
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>© {new Date().getFullYear()}</span>
      </footer>
    </div>
  )
}
