import type { ContentBrief } from '../claude'

interface ThemeTokens {
  bg: string
  surface: string
  surface2: string
  text: string
  textMuted: string
  border: string
  radius: string
  heroOverlay: string
  navBg: string
  dark: boolean
}

function tokens(variant: ContentBrief['templateVariant']): ThemeTokens {
  switch (variant) {
    case 'minimal':
      return {
        bg: '#ffffff', surface: '#f8f8f6', surface2: '#f0efec',
        text: '#1a1a1a', textMuted: '#555', border: '#e5e4e0',
        radius: '4px', heroOverlay: 'rgba(0,0,0,0.35)',
        navBg: 'rgba(255,255,255,0.95)', dark: false,
      }
    case 'bold':
      return {
        bg: '#0f0f0f', surface: '#1a1a1a', surface2: '#242424',
        text: '#f5f5f5', textMuted: 'rgba(245,245,245,0.6)',
        border: 'rgba(255,255,255,0.1)', radius: '6px',
        heroOverlay: 'rgba(0,0,0,0.5)', navBg: 'rgba(15,15,15,0.92)', dark: true,
      }
    case 'agency':
      return {
        bg: '#06060f', surface: '#0e0e1a', surface2: '#161625',
        text: '#f0f0ff', textMuted: 'rgba(240,240,255,0.5)',
        border: 'rgba(255,255,255,0.08)', radius: '8px',
        heroOverlay: 'rgba(6,6,15,0.6)', navBg: 'rgba(6,6,15,0.9)', dark: true,
      }
    case 'warm':
      return {
        bg: '#faf8f4', surface: '#f3efe8', surface2: '#ece7dd',
        text: '#2c1f0e', textMuted: '#7a6652',
        border: '#ddd5c5', radius: '6px',
        heroOverlay: 'rgba(44,31,14,0.45)', navBg: 'rgba(250,248,244,0.95)', dark: false,
      }
  }
}

export function buildCSS(brief: ContentBrief): string {
  const t = tokens(brief.templateVariant)
  const hFont = brief.fontHeading.replace(/ /g, '+')
  const bFont = brief.fontBody.replace(/ /g, '+')
  const dFont = brief.fontDisplay?.replace(/ /g, '+')

  const isAgency  = brief.templateVariant === 'agency'
  const isBold    = brief.templateVariant === 'bold'
  const isMinimal = brief.templateVariant === 'minimal'
  const isWarm    = brief.templateVariant === 'warm'

  // Font import — include display font and full weight range (300–900) on heading font
  const fontImport = dFont
    ? `@import url('https://fonts.googleapis.com/css2?family=${hFont}:ital,wght@0,300;0,400;0,600;0,700;0,900;1,400&family=${bFont}:wght@400;500;600&family=${dFont}:wght@400;700&display=swap');`
    : `@import url('https://fonts.googleapis.com/css2?family=${hFont}:ital,wght@0,300;0,400;0,600;0,700;0,900;1,400&family=${bFont}:wght@400;500;600&display=swap');`

  return `
${fontImport}

:root {
  --primary:     ${brief.primaryColor};
  --accent:      ${brief.accentColor};
  --bg:          ${t.bg};
  --surface:     ${t.surface};
  --surface-2:   ${t.surface2};
  --text:        ${t.text};
  --muted:       ${t.textMuted};
  --border:      ${t.border};
  --radius:      ${t.radius};
  --nav-bg:      ${t.navBg};
  --hero-overlay:${t.heroOverlay};
  --h-font:      '${brief.fontHeading}', ${isMinimal || isWarm ? 'Georgia, serif' : 'system-ui, sans-serif'};
  --b-font:      '${brief.fontBody}', system-ui, sans-serif;
  --d-font:      ${dFont ? `'${brief.fontDisplay}', ` : ''}var(--h-font);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }
body { font-family: var(--b-font); background: var(--bg); color: var(--text); line-height: 1.65; }
img { display: block; max-width: 100%; }
a { color: inherit; text-decoration: none; }

h1,h2,h3,h4 { font-family: var(--h-font); line-height: 1.1; letter-spacing: -0.02em; }
h1 { font-size: clamp(2.6rem, 7vw, 5.5rem); font-weight: 700; }
h2 { font-size: clamp(1.9rem, 4vw, 3.2rem); font-weight: 600; }
h3 { font-size: clamp(1rem, 2vw, 1.25rem); font-weight: 600; }
p  { color: var(--muted); font-size: clamp(0.95rem, 1.4vw, 1.05rem); }

${brief.headingWeight === 'ultra' ? `
h1 { font-weight: 900; letter-spacing: -0.04em; }
h2 { font-weight: 800; letter-spacing: -0.03em; }
` : ''}
${brief.headingWeight === 'light' ? `
h1 { font-weight: 300; letter-spacing: 0.01em; }
h2 { font-weight: 300; letter-spacing: 0.005em; }
` : ''}

.container { max-width: 1160px; margin: 0 auto; padding: 0 1.5rem; }
.section    { padding: clamp(4rem, 8vw, 7rem) 0; }

/* ── Diagonal section dividers (bold/agency) ── */
${isAgency || isBold ? `
.section--angled { position: relative; }
.section--angled::before {
  content: ''; position: absolute; top: -2.5vw; left: 0; right: 0; height: 2.5vw;
  background: inherit; clip-path: polygon(0 100%, 100% 0, 100% 100%); pointer-events: none;
}
` : ''}

/* ── Nav ── */
.nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  background: var(--nav-bg);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
  transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.2s ease;
}
.nav--hero-top {
  background: transparent;
  border-bottom-color: transparent;
  backdrop-filter: none;
}
.nav.scrolled { box-shadow: 0 2px 20px rgba(0,0,0,0.12); }
.nav--hero-top.scrolled {
  background: var(--nav-bg);
  border-bottom-color: var(--border);
  backdrop-filter: blur(16px);
}
.nav__inner {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1rem 1.5rem; max-width: 1160px; margin: 0 auto;
}
.nav__logo { display: flex; align-items: center; gap: 0.6rem; }
.nav__logo-mark {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
  background: var(--primary); color: #fff;
  font-size: 0.72rem; font-weight: 800; letter-spacing: 0.05em;
  font-family: var(--h-font);
  ${isAgency ? `background: linear-gradient(135deg, var(--primary), var(--accent));` : ''}
}
.nav__logo-text {
  font-family: var(--h-font); font-size: 1.05rem; font-weight: 700;
  color: var(--text);
  ${isAgency ? `background: linear-gradient(135deg, var(--primary), var(--accent)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;` : ''}
}
.nav--hero-top .nav__logo-text { color: #fff; -webkit-text-fill-color: #fff; }
.nav--hero-top .nav__logo-mark { background: rgba(255,255,255,0.15); backdrop-filter: blur(4px); }
.nav__links { display: flex; align-items: center; gap: 2rem; }
.nav__link  {
  font-size: 0.875rem; font-weight: 500; color: var(--muted);
  transition: color 0.15s;
  position: relative;
}
.nav__link::after {
  content: ''; position: absolute; bottom: -2px; left: 50%; right: 50%;
  height: 1px; background: var(--primary);
  transition: left 0.22s ease, right 0.22s ease;
}
.nav__link:hover { color: var(--text); }
.nav__link:hover::after { left: 0; right: 0; }
.nav--hero-top .nav__link { color: rgba(255,255,255,0.75); }
.nav--hero-top .nav__link:hover { color: #fff; }
.nav--hero-top .nav__link::after { background: rgba(255,255,255,0.6); }
.nav__cta {
  font-size: 0.875rem; font-weight: 600; padding: 0.55rem 1.25rem;
  border-radius: var(--radius); transition: all 0.15s;
  ${t.dark
    ? `background: var(--primary); color: #fff;`
    : `background: var(--text); color: var(--bg);`
  }
}
.nav--hero-top .nav__cta { background: rgba(255,255,255,0.15); color: #fff; border: 1px solid rgba(255,255,255,0.3); backdrop-filter: blur(4px); }
.nav--hero-top .nav__cta:hover { background: var(--primary); border-color: var(--primary); }
.nav__cta:hover { opacity: 0.85; transform: translateY(-1px); }
@media (max-width: 640px) { .nav__links { display: none; } }

/* ── Hero shared ── */
.hero {
  position: relative; overflow: hidden;
  display: flex; align-items: center;
}
.hero__bg {
  position: absolute; inset: 0;
  background-size: cover; background-position: center;
  background-repeat: no-repeat;
  will-change: transform;
}
.hero__overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.72) 100%);
}
.hero__overlay--soft {
  background: linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.52) 100%);
}

/* ── Hero: cinematic ── */
.hero--cinematic {
  min-height: 100vh;
  align-items: flex-end;
  padding-bottom: clamp(3.5rem, 8vh, 6rem);
  padding-top: 80px;
}
.hero--cinematic .container { position: relative; z-index: 1; width: 100%; }
.hero--cinematic .hero__content { max-width: 820px; }
.hero--cinematic .hero__headline,
.hero--cinematic .hero__tagline { color: #fff; }
.hero--cinematic .hero__sub { color: rgba(255,255,255,0.82); }
.hero--cinematic .hero__tagline { color: rgba(255,255,255,0.7); }
${isBold || isAgency ? `.hero--cinematic .hero__bg { animation: heroZoom 12s ease-out forwards; }
@keyframes heroZoom { from { transform: scale(1.06); } to { transform: scale(1); } }` : ''}

/* Gradient text on dark cinematic hero headlines */
${isAgency || isBold ? `
.hero--cinematic .hero__headline,
.hero--no-image .hero__headline {
  background: linear-gradient(135deg, #ffffff 55%, color-mix(in srgb, var(--accent) 65%, #ffffff));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
` : ''}

/* heroTextPosition modifiers */
.hero__content--left-center  { align-self: center; }
.hero--cinematic.hero--text-pos-left-center { align-items: center; padding-bottom: 0; padding-top: 80px; }
.hero__content--center-bottom { text-align: center; margin-top: auto; width: 100%; max-width: 100%; }
.hero__content--center-bottom .hero__actions { justify-content: center; }
.hero__content--center-bottom .hero__sub { margin-left: auto; margin-right: auto; }

/* ── Hero: cinematic, no image ── */
.hero--no-image {
  min-height: ${isBold || isAgency ? '92vh' : '80vh'};
  align-items: center; padding-top: 80px;
  ${t.dark
    ? `background: linear-gradient(135deg, var(--bg) 0%, color-mix(in srgb, var(--primary) 12%, var(--bg)) 100%);`
    : `background: linear-gradient(135deg, var(--surface) 0%, color-mix(in srgb, var(--primary) 5%, var(--bg)) 100%);`
  }
}
.hero--no-image .container { position: relative; z-index: 1; }
${isAgency ? `.hero--no-image::before { content: ''; position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px); background-size: 60px 60px; pointer-events: none; }` : ''}

/* ── Hero: text-only fallback ── */
.hero--text-only {
  min-height: 78vh; align-items: center; padding-top: 80px;
  background: ${t.dark ? 'var(--bg)' : 'var(--surface)'};
}
.hero--text-only .container { position: relative; z-index: 1; }

/* ── Hero: centered ── */
.hero--centered {
  min-height: 88vh; align-items: center; padding-top: 80px;
  text-align: center;
}
.hero--centered .container { position: relative; z-index: 1; width: 100%; }
.hero--centered .hero__content--center { margin: 0 auto; max-width: 760px; }
.hero--centered .hero__headline,
.hero--centered .hero__tagline { color: #fff; }
.hero--centered .hero__sub { color: rgba(255,255,255,0.82); }
.hero--centered .hero__tagline { color: rgba(255,255,255,0.68); }

/* ── Hero: split ── */
.hero--split {
  display: grid; grid-template-columns: 2fr 3fr;
  min-height: 90vh; padding-top: 72px;
}
.hero__split-content {
  display: flex; flex-direction: column; justify-content: center;
  padding: clamp(3rem, 6vw, 6rem) clamp(1.5rem, 4vw, 4rem);
  position: relative; z-index: 1;
}
.hero__split-image { position: relative; overflow: hidden; }
.hero__split-image img {
  width: 100%; height: 100%; object-fit: cover;
  transition: transform 0.7s ease;
}
.hero--split:hover .hero__split-image img { transform: scale(1.03); }
.hero__split-fade {
  position: absolute; inset: 0;
  background: linear-gradient(to right, ${t.bg} 0%, transparent 18%);
  pointer-events: none;
}
@media (max-width: 768px) {
  .hero--split { grid-template-columns: 1fr; }
  .hero__split-image { height: 320px; order: -1; }
  .hero__split-fade { background: linear-gradient(to bottom, transparent 50%, ${t.bg} 100%); }
}

/* ── Hero content shared ── */
.hero__content { position: relative; z-index: 1; max-width: 680px; }
.hero__content--center { text-align: center; }
.hero__tagline {
  display: inline-block; margin-bottom: 1.25rem;
  font-size: 0.78rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--primary);
  ${isAgency || isBold
    ? `background: linear-gradient(135deg, var(--primary), var(--accent)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;`
    : ''
  }
}
.hero__headline { margin-bottom: 1.25rem; }
.hero__sub { margin-bottom: 2.25rem; max-width: 520px; font-size: clamp(1rem, 1.8vw, 1.15rem); }
.hero__actions { display: flex; gap: 1rem; flex-wrap: wrap; }
.hero__actions--center { justify-content: center; }

#services, #about, #process, #contact { scroll-margin-top: 72px; }

/* ── Buttons ── */
.btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.85rem 1.75rem; font-family: var(--b-font); font-size: 0.9rem; font-weight: 600; border-radius: var(--radius); cursor: pointer; border: none; transition: all 0.18s; text-decoration: none; }
.btn-primary {
  background: var(--primary); color: #fff;
  position: relative; overflow: hidden; z-index: 0;
}
.btn-primary::before {
  content: ''; position: absolute; inset: 0;
  background: color-mix(in srgb, var(--primary) 72%, #000);
  transform: translateX(-101%);
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: -1;
}
.btn-primary:hover::before { transform: translateX(0); }
.btn-primary:hover { opacity: 1; transform: translateY(-2px); box-shadow: 0 8px 24px color-mix(in srgb, var(--primary) 35%, transparent); }
.btn-ghost { background: transparent; color: var(--text); border: 1.5px solid var(--border); }
.btn-ghost:hover { border-color: var(--primary); color: var(--primary); }
.btn-ghost--light { background: transparent; color: #fff; border: 1.5px solid rgba(255,255,255,0.4); }
.btn-ghost--light:hover { border-color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.1); }
${isAgency ? `.btn-primary { background: linear-gradient(135deg, var(--primary), var(--accent)); }
.btn-primary::before { background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 75%, #000), color-mix(in srgb, var(--accent) 75%, #000)); }` : ''}

/* ── Services ── */
.services__header { text-align: center; max-width: 600px; margin: 0 auto 3.5rem; }
.services__header h2 { margin-bottom: 0.75rem; }
.services__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.5rem; }

/* Grid stagger — triggered when grid enters viewport */
.services__grid .service-card {
  opacity: 0; transform: translateY(24px);
  transition: opacity 0.55s ease, transform 0.55s ease;
}
.services__grid.in-view .service-card { opacity: 1; transform: translateY(0); }
.services__grid.in-view .service-card:nth-child(1) { transition-delay: 0.05s; }
.services__grid.in-view .service-card:nth-child(2) { transition-delay: 0.13s; }
.services__grid.in-view .service-card:nth-child(3) { transition-delay: 0.21s; }
.services__grid.in-view .service-card:nth-child(4) { transition-delay: 0.29s; }
.services__grid.in-view .service-card:nth-child(5) { transition-delay: 0.37s; }
.services__grid.in-view .service-card:nth-child(6) { transition-delay: 0.45s; }

.service-card {
  padding: 2rem 1.75rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: calc(var(--radius) * 2);
}
.service-card:hover {
  transform: translateY(-6px);
  box-shadow:
    0 4px 12px rgba(0,0,0,${t.dark ? '0.4' : '0.08'}),
    0 16px 40px rgba(0,0,0,${t.dark ? '0.3' : '0.06'}),
    0 0 0 1px color-mix(in srgb, var(--primary) 30%, transparent);
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}
.service-card h3 { margin-bottom: 0.6rem; }

/* minimal: editorial numbered */
${isMinimal ? `
.service-card { border-left: 3px solid var(--primary); border-top: none; border-right: none; border-bottom: none; border-radius: 0 4px 4px 0; background: transparent; padding-left: 1.5rem; }
.service-card:hover { background: var(--surface); box-shadow: none; transform: translateX(4px); }
.service-card__num { display: block; font-family: var(--h-font); font-size: 0.72rem; font-weight: 700; letter-spacing: 0.12em; color: var(--primary); margin-bottom: 0.75rem; opacity: 0.7; }
` : ''}

/* bold: dark card, primary top border */
${isBold ? `
.service-card { background: var(--surface-2); border-color: var(--border); border-top: 3px solid var(--primary); }
.service-card:hover { background: var(--surface); }
.service-card__dot { width: 36px; height: 36px; border-radius: 50%; margin-bottom: 1.25rem; background: linear-gradient(135deg, var(--primary), var(--accent)); display: flex; align-items: center; justify-content: center; transition: transform 0.3s ease; }
.service-card:hover .service-card__dot { transform: rotate(15deg) scale(1.1); }
` : ''}

/* agency: glassmorphism */
${isAgency ? `
.service-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); backdrop-filter: blur(12px); border-radius: 12px; }
.service-card:hover { border-color: color-mix(in srgb, var(--primary) 50%, transparent); box-shadow: 0 0 0 1px color-mix(in srgb, var(--primary) 25%, transparent), 0 12px 32px rgba(0,0,0,0.3); transform: translateY(-6px); }
.service-card__icon { width: 40px; height: 40px; border-radius: 10px; margin-bottom: 1.25rem; background: linear-gradient(135deg, var(--primary), var(--accent)); display: flex; align-items: center; justify-content: center; color: #fff; }
` : ''}

/* warm: soft rounded with pip */
${isWarm ? `
.service-card { border-radius: 16px; background: var(--surface); border: 1px solid var(--border); }
.service-card__pip { width: 8px; height: 8px; border-radius: 50%; background: var(--primary); margin-bottom: 1.25rem; }
` : ''}

/* ── Process ── */
.process { background: var(--surface); }
${isAgency ? `.process { background: var(--surface-2); }` : ''}
${isMinimal ? `.process { background: var(--bg); }` : ''}
.process__header { text-align: center; max-width: 600px; margin: 0 auto 3.5rem; }
.process__label {
  font-size: 0.78rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--primary); margin-bottom: 0.75rem; display: block;
}
.process__header h2 { margin-bottom: 0; }
.process__steps {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 2.5rem;
  position: relative;
}
.process__steps::after {
  content: '';
  position: absolute; top: 2rem; left: calc(16.67% + 1.25rem); right: calc(16.67% + 1.25rem);
  height: 1px; background: var(--border);
  pointer-events: none;
}
.process__step { position: relative; text-align: center; padding: 0 1rem; }
.process__num {
  font-family: var(--d-font); font-size: 3.5rem; font-weight: 800; line-height: 1;
  color: var(--primary); opacity: 0.14; margin-bottom: 1rem; display: block;
  ${isAgency || isBold ? `background: linear-gradient(135deg, var(--primary), var(--accent)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; opacity: 0.22;` : ''}
}
.process__step h3 { margin-bottom: 0.6rem; }
@media (max-width: 640px) {
  .process__steps { grid-template-columns: 1fr; gap: 2rem; }
  .process__steps::after { display: none; }
  .process__step { text-align: left; padding: 0; }
  .process__num { font-size: 2.5rem; margin-bottom: 0.5rem; }
}

/* ── About ── */
.about__inner { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(3rem, 6vw, 6rem); align-items: center; }
.about__inner--no-image { grid-template-columns: 1fr; max-width: 720px; }
.about__label { font-size: 0.78rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--primary); margin-bottom: 1rem; display: block; }
.about__text h2 { margin-bottom: 1.25rem; }
.about__text p  { font-size: 1.05rem; line-height: 1.8; }
.about__image {
  position: relative; border-radius: calc(var(--radius) * 3); overflow: hidden;
  aspect-ratio: 4/3;
}
.about__image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
.about__image:hover img { transform: scale(1.04); }

/* clip-path reveal for about image */
.about__image[data-animate] {
  opacity: 1; transform: none;
  clip-path: inset(0 100% 0 0);
  transition: clip-path 0.85s cubic-bezier(0.4, 0, 0.2, 1);
}
.about__image[data-animate].in-view { clip-path: inset(0 0% 0 0); }

.about__image--portrait {
  aspect-ratio: 3/4;
  ${isMinimal || isWarm ? `box-shadow: 6px 8px 32px rgba(0,0,0,0.12); transform: rotate(-1deg); transition: transform 0.35s ease;` : ''}
}
.about__image--portrait:hover { ${isMinimal || isWarm ? 'transform: rotate(0deg);' : ''} }
${isMinimal ? `.about { background: var(--surface); }` : ''}
${isWarm    ? `.about { background: var(--surface); }` : ''}
@media (max-width: 768px) { .about__inner { grid-template-columns: 1fr; } .about__image--portrait { aspect-ratio: 4/3; transform: none !important; } }

/* ── Gallery ── */
.gallery { overflow: hidden; }
${isAgency || isBold ? `.gallery { background: var(--surface-2); }` : ''}
.gallery__header { text-align: center; max-width: 600px; margin: 0 auto 3rem; }
.gallery__grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;
}
.gallery__pair { display: flex; flex-direction: column; gap: 1rem; }
.gallery__item {
  overflow: hidden; border-radius: var(--radius);
  position: relative;
}
.gallery__item--tall { aspect-ratio: 3/4; }
.gallery__pair .gallery__item { flex: 1; min-height: 200px; }
.gallery__item img {
  width: 100%; height: 100%; object-fit: cover;
  transition: transform 0.6s ease;
}
.gallery__item:hover img { transform: scale(1.04); }

/* clip-path reveal for gallery items */
.gallery__item[data-animate] {
  opacity: 1; transform: none;
  clip-path: inset(0 100% 0 0);
  transition: clip-path 0.85s cubic-bezier(0.4, 0, 0.2, 1);
}
.gallery__item[data-animate].in-view { clip-path: inset(0 0% 0 0); }
.gallery__item[data-animate][data-delay="1"] { transition-delay: 0.15s; }
.gallery__item[data-animate][data-delay="2"] { transition-delay: 0.3s; }

/* Variant-specific gallery */
${isWarm ? `
.gallery__item { border-radius: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.1); }
.gallery__pair .gallery__item:last-child { margin-top: -2rem; position: relative; z-index: 1; }
` : ''}
${isMinimal ? `
.gallery__grid { gap: 2rem; }
.gallery__pair .gallery__item:last-child { margin-top: 4rem; }
` : ''}

@media (max-width: 640px) { .gallery__grid { grid-template-columns: 1fr; } .gallery__item--tall { aspect-ratio: 4/3; } .gallery__pair .gallery__item:last-child { margin-top: 0; } }

/* ── Testimonials ── */
.testimonials { background: var(--bg); }
${isMinimal || isWarm ? `.testimonials { background: var(--surface); }` : ''}
${isAgency ? `.testimonials { background: var(--surface-2); border-top: 1px solid var(--border); }` : ''}
.testimonials__header { text-align: center; max-width: 600px; margin: 0 auto 3.5rem; }
.testimonials__header h2 { margin-bottom: 0; }

/* minimal — two-column blockquote layout */
.testimonials__grid--minimal {
  display: grid; grid-template-columns: 3fr 2fr; gap: 3.5rem; align-items: start;
}
.testimonial-block { padding: 0; }
.testimonial-block--feature .testimonial-block__quote {
  font-family: var(--h-font);
  font-size: clamp(1.2rem, 2.8vw, 1.75rem);
  font-style: italic; line-height: 1.5;
  color: var(--text); margin-bottom: 1.25rem;
}
.testimonial-block--feature .testimonial-block__quote::before { content: '\\201C'; }
.testimonial-block--feature .testimonial-block__quote::after  { content: '\\201D'; }
.testimonial-block--secondary .testimonial-block__quote {
  font-size: clamp(0.95rem, 1.8vw, 1.05rem);
  border-left: 3px solid var(--primary); padding-left: 1.25rem;
  font-style: normal; color: var(--muted); margin-bottom: 1rem;
}
.testimonial-block__author { font-size: 0.875rem; font-weight: 600; color: var(--primary); }
.testimonial-block__role   { font-size: 0.8rem; color: var(--muted); }
@media (max-width: 768px) { .testimonials__grid--minimal { grid-template-columns: 1fr; gap: 2.5rem; } }

/* agency — glassmorphism card grid */
.testimonials__grid--agency {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;
}
.testimonial-card {
  padding: 1.75rem;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px; transition: border-color 0.2s;
}
.testimonial-card:hover { border-color: color-mix(in srgb, var(--primary) 40%, transparent); }
.testimonial-card__stars { color: var(--accent); font-size: 0.85rem; letter-spacing: 0.06em; margin-bottom: 1rem; }
.testimonial-card__quote { font-size: 0.975rem; line-height: 1.7; color: var(--text); margin-bottom: 1.25rem; }
.testimonial-card__author { font-size: 0.875rem; font-weight: 600; color: var(--text); display: block; }
.testimonial-card__role   { font-size: 0.8rem; color: var(--muted); display: block; margin-top: 0.1rem; }

/* bold — first testimonial dominant, rest secondary */
.testimonials__grid--bold { display: flex; flex-direction: column; gap: 2.5rem; max-width: 820px; margin: 0 auto; }
.testimonial-bold--feature .testimonial-block__quote {
  font-family: var(--h-font); font-size: clamp(1.4rem, 3vw, 2rem);
  font-style: italic; line-height: 1.45; color: var(--text); margin-bottom: 1.25rem;
}
.testimonial-bold--feature .testimonial-block__quote::before { content: '\\201C'; }
.testimonial-bold--feature .testimonial-block__quote::after  { content: '\\201D'; }
.testimonial-bold--secondary { padding-left: 1.5rem; border-left: 2px solid var(--border); }
.testimonial-bold--secondary .testimonial-block__quote { font-size: 1rem; color: var(--muted); margin-bottom: 0.75rem; }

/* warm — soft rounded card grid */
.testimonials__grid--warm {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;
}
.testimonial-warm {
  padding: 2rem; background: var(--bg);
  border: 1px solid var(--border); border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.05);
}
.testimonial-warm__pip { width: 24px; height: 3px; background: var(--primary); border-radius: 2px; margin-bottom: 1.25rem; }
.testimonial-warm__quote { font-size: 0.975rem; line-height: 1.75; color: var(--text); margin-bottom: 1.25rem; }
.testimonial-warm__author { font-size: 0.875rem; font-weight: 600; color: var(--text); display: block; }
.testimonial-warm__role   { font-size: 0.8rem; color: var(--muted); display: block; margin-top: 0.1rem; }

/* ── Stats ── */
.stats { background: var(--surface); }
${isAgency ? `.stats { background: linear-gradient(135deg, var(--surface), var(--surface-2)); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }` : ''}
.stats__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; text-align: center; }
.stat__value { font-family: var(--d-font); font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 700; color: var(--primary); display: block; }
.stat__label { font-size: 0.875rem; color: var(--muted); margin-top: 0.25rem; }
@media (max-width: 480px) { .stats__grid { grid-template-columns: 1fr; gap: 1.5rem; } }

/* ── CTA ── */
.cta {
  text-align: center;
  ${t.dark
    ? `background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 20%, var(--bg)), color-mix(in srgb, var(--accent) 15%, var(--bg)));`
    : `background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 8%, var(--bg)), color-mix(in srgb, var(--accent) 6%, var(--bg)));`
  }
  border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
}
.cta__inner { max-width: 620px; margin: 0 auto; }
.cta h2 { margin-bottom: 1rem; }
.cta p  { margin-bottom: 2.25rem; font-size: 1.05rem; }

/* ── Footer ── */
.footer {
  background: ${t.dark ? 'var(--surface)' : 'var(--text)'};
  color: ${t.dark ? 'var(--text)' : 'var(--bg)'};
  padding: 4rem 0 2rem;
}
.footer__inner { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 3rem; margin-bottom: 3rem; }
.footer__brand { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.75rem; }
.footer__brand-mark {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 6px; flex-shrink: 0;
  background: var(--primary); color: #fff;
  font-size: 0.68rem; font-weight: 800; letter-spacing: 0.04em;
  font-family: var(--h-font);
}
.footer__brand > span:last-child { font-family: var(--h-font); font-size: 1.1rem; font-weight: 700; }
.footer__tagline { font-size: 0.875rem; opacity: 0.5; }
.footer__heading { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.4; margin-bottom: 1rem; }
.footer__link-list { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; }
.footer__link-list a { font-size: 0.875rem; opacity: 0.6; transition: opacity 0.15s; }
.footer__link-list a:hover { opacity: 1; }
.footer__bottom { border-top: 1px solid ${t.dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)'}; padding-top: 1.5rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; opacity: 0.4; }
@media (max-width: 640px) { .footer__inner { grid-template-columns: 1fr; gap: 2rem; } .footer__bottom { flex-direction: column; gap: 0.5rem; text-align: center; } }

/* ── Animations ── */
[data-animate] { opacity: 0; transform: translateY(28px); transition: opacity 0.65s ease, transform 0.65s ease; }
[data-animate].in-view { opacity: 1; transform: translateY(0); }
[data-animate][data-delay="1"] { transition-delay: 0.1s; }
[data-animate][data-delay="2"] { transition-delay: 0.2s; }
[data-animate][data-delay="3"] { transition-delay: 0.3s; }
[data-animate][data-delay="4"] { transition-delay: 0.4s; }
[data-animate][data-delay="5"] { transition-delay: 0.5s; }

/* ── Hero entrance (data-animate-hero) ── */
[data-animate-hero] > * { opacity: 0; animation: heroIn 0.75s ease forwards; }
[data-animate-hero] > *:nth-child(1) { animation-delay: 0.15s; }
[data-animate-hero] > *:nth-child(2) { animation-delay: 0.3s; }
[data-animate-hero] > *:nth-child(3) { animation-delay: 0.45s; }
[data-animate-hero] > *:nth-child(4) { animation-delay: 0.6s; }
@keyframes heroIn { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }

/* ── Mobile hamburger ── */
.nav__hamburger { display: none; flex-direction: column; justify-content: space-between; width: 24px; height: 18px; cursor: pointer; background: none; border: none; padding: 0; }
.nav__hamburger span { display: block; height: 2px; background: var(--text); border-radius: 2px; transition: all 0.2s; }
.nav--hero-top .nav__hamburger span { background: #fff; }
.nav__hamburger.open span:nth-child(1) { transform: translateY(8px) rotate(45deg); }
.nav__hamburger.open span:nth-child(2) { opacity: 0; }
.nav__hamburger.open span:nth-child(3) { transform: translateY(-8px) rotate(-45deg); }
@media (max-width: 640px) {
  .nav__hamburger { display: flex; }
  .nav__links { display: none; position: fixed; top: 57px; left: 0; right: 0; flex-direction: column; gap: 0; background: var(--nav-bg); backdrop-filter: blur(16px); border-bottom: 1px solid var(--border); padding: 1rem 1.5rem; }
  .nav__links.open { display: flex; }
}
`.trim()
}
