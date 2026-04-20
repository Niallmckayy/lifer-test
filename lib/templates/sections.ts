import type { ContentBrief } from '../claude'

/** Escape HTML entities to prevent broken markup from user content */
function e(str: string): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function navHTML(brief: ContentBrief, businessName: string, hasHeroImage = false): string {
  const links = brief.navLinks.map(l => `<a href="#" class="nav__link">${e(l)}</a>`).join('\n      ')
  const transparentClass = hasHeroImage ? ' nav--hero-top' : ''
  return `
<nav class="nav${transparentClass}">
  <div class="nav__inner">
    <a href="#" class="nav__logo">
      <span class="nav__logo-mark">${e((brief.logoMark ?? businessName.slice(0, 2)).toUpperCase())}</span>
      <span class="nav__logo-text">${e(businessName)}</span>
    </a>
    <div class="nav__links">
      ${links}
      <a href="#contact" class="nav__cta">${e(brief.ctaText)}</a>
    </div>
    <button class="nav__hamburger" aria-label="Toggle menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
  </div>
</nav>`
}

export function heroHTML(
  brief: ContentBrief,
  businessName: string,
  heroImageUrl: string | null,
): string {
  const style    = brief.heroStyle ?? 'cinematic'
  const hasImage = !!heroImageUrl

  // Determine content position modifier class
  const pos = brief.heroTextPosition ?? 'left-bottom'
  const posClass = pos === 'left-center'   ? ' hero__content--left-center'
                 : pos === 'center-bottom' ? ' hero__content--center-bottom'
                 : pos === 'center'        ? ' hero__content--center'
                 : '' // left-bottom = default

  // Ghost button variant — light on dark hero backgrounds, regular otherwise
  const ghostVariant = hasImage ? 'btn-ghost--light' : 'btn-ghost'

  // ── Cinematic: full 100vh, full-bleed image, 3-stop gradient overlay ──
  if (style === 'cinematic' && hasImage) {
    return `
<section class="hero hero--cinematic${pos === 'left-center' ? ' hero--text-pos-left-center' : ''}">
  <div class="hero__bg" style="background-image:url('${e(heroImageUrl!)}')"></div>
  <div class="hero__overlay"></div>
  <div class="container">
    <div class="hero__content${posClass}" data-animate-hero>
      <span class="hero__tagline">${e(brief.tagline)}</span>
      <h1 class="hero__headline">${e(brief.headline)}</h1>
      <p class="hero__sub">${e(brief.subheadline)}</p>
      <div class="hero__actions${pos === 'center-bottom' ? ' hero__actions--center' : ''}">
        <a href="#contact" class="btn btn-primary">${e(brief.ctaText)}</a>
        <a href="#services" class="btn ${ghostVariant}">See services</a>
      </div>
    </div>
  </div>
</section>`
  }

  // ── Cinematic without image: large dark text-only hero ──
  if (style === 'cinematic' && !hasImage) {
    return `
<section class="hero hero--cinematic hero--no-image">
  <div class="container">
    <div class="hero__content${posClass}" data-animate-hero>
      <span class="hero__tagline">${e(brief.tagline)}</span>
      <h1 class="hero__headline">${e(brief.headline)}</h1>
      <p class="hero__sub">${e(brief.subheadline)}</p>
      <div class="hero__actions">
        <a href="#contact" class="btn btn-primary">${e(brief.ctaText)}</a>
        <a href="#services" class="btn btn-ghost">See services</a>
      </div>
    </div>
  </div>
</section>`
  }

  // ── Centered: atmospheric image, text centered ──
  if (style === 'centered' && hasImage) {
    return `
<section class="hero hero--centered">
  <div class="hero__bg" style="background-image:url('${e(heroImageUrl!)}')"></div>
  <div class="hero__overlay hero__overlay--soft"></div>
  <div class="container">
    <div class="hero__content hero__content--center" data-animate-hero>
      <span class="hero__tagline">${e(brief.tagline)}</span>
      <h1 class="hero__headline">${e(brief.headline)}</h1>
      <p class="hero__sub">${e(brief.subheadline)}</p>
      <div class="hero__actions hero__actions--center">
        <a href="#contact" class="btn btn-primary">${e(brief.ctaText)}</a>
        <a href="#about" class="btn ${ghostVariant}">Our story</a>
      </div>
    </div>
  </div>
</section>`
  }

  // ── Split: text left, image right (60%) ──
  if (style === 'split' && hasImage) {
    return `
<section class="hero hero--split">
  <div class="hero__split-content" data-animate-hero>
    <span class="hero__tagline">${e(brief.tagline)}</span>
    <h1 class="hero__headline">${e(brief.headline)}</h1>
    <p class="hero__sub">${e(brief.subheadline)}</p>
    <div class="hero__actions">
      <a href="#contact" class="btn btn-primary">${e(brief.ctaText)}</a>
      <a href="#about" class="btn btn-ghost">Learn more</a>
    </div>
  </div>
  <div class="hero__split-image">
    <img src="${e(heroImageUrl!)}" alt="${e(brief.heroAlt)}" loading="eager" />
    <div class="hero__split-fade"></div>
  </div>
</section>`
  }

  // ── Fallback: centered text-only ──
  return `
<section class="hero hero--text-only">
  <div class="container">
    <div class="hero__content hero__content--center" data-animate-hero>
      <span class="hero__tagline">${e(brief.tagline)}</span>
      <h1 class="hero__headline">${e(brief.headline)}</h1>
      <p class="hero__sub">${e(brief.subheadline)}</p>
      <div class="hero__actions hero__actions--center">
        <a href="#contact" class="btn btn-primary">${e(brief.ctaText)}</a>
        <a href="#services" class="btn btn-ghost">See services</a>
      </div>
    </div>
  </div>
</section>`
}

export function servicesHTML(brief: ContentBrief): string {
  const variant = brief.templateVariant

  const cards = brief.services.map((s, i) => {
    const num = String(i + 1).padStart(2, '0')

    if (variant === 'minimal') {
      return `
    <div class="service-card">
      <span class="service-card__num">${num}</span>
      <h3>${e(s.name)}</h3>
      <p>${e(s.description)}</p>
    </div>`
    }

    if (variant === 'agency') {
      return `
    <div class="service-card">
      <div class="service-card__icon">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="${['M3 9h12M9 3l6 6-6 6', 'M9 3v12M3 9h12', 'M4 4l10 10M14 4L4 14', 'M9 2l1.8 5.4H17l-4.9 3.6 1.8 5.4L9 13l-4.9 3.4 1.8-5.4L1 7.4h6.2z'][i % 4]}" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h3>${e(s.name)}</h3>
      <p>${e(s.description)}</p>
    </div>`
    }

    if (variant === 'warm') {
      return `
    <div class="service-card">
      <div class="service-card__pip"></div>
      <h3>${e(s.name)}</h3>
      <p>${e(s.description)}</p>
    </div>`
    }

    // bold
    return `
    <div class="service-card">
      <div class="service-card__dot">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="${['M2 7h10M7 2l5 5-5 5', 'M7 2v10M2 7h10', 'M2 2l10 10M12 2L2 12', 'M7 1l1.5 4.5H14l-4 3 1.5 4.5L7 11l-4.5 2.5L4 9 0 6h5.5z'][i % 4]}" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h3>${e(s.name)}</h3>
      <p>${e(s.description)}</p>
    </div>`
  }).join('\n')

  return `
<section id="services" class="section">
  <div class="container">
    <div class="services__header" data-animate>
      <h2>What We Do</h2>
      <p>Comprehensive solutions tailored to your needs.</p>
    </div>
    <div class="services__grid" data-animate-grid>
      ${cards}
    </div>
  </div>
</section>`
}

export function processHTML(brief: ContentBrief): string {
  if (!brief.process || brief.process.length === 0) return ''

  const isAngledVariant = brief.templateVariant === 'agency' || brief.templateVariant === 'bold'

  const steps = brief.process.map((p, i) => `
    <div class="process__step" data-animate data-delay="${i + 1}">
      <div class="process__num">${e(p.step)}</div>
      <h3>${e(p.title)}</h3>
      <p>${e(p.body)}</p>
    </div>`).join('\n')

  return `
<section id="process" class="process section${isAngledVariant ? ' section--angled' : ''}">
  <div class="container">
    <div class="process__header" data-animate>
      <p class="process__label">How It Works</p>
      <h2>Simple steps, exceptional results.</h2>
    </div>
    <div class="process__steps">
      ${steps}
    </div>
  </div>
</section>`
}

export function aboutHTML(
  brief: ContentBrief,
  businessName: string,
  imageUrl: string | null,
): string {
  const isWarm    = brief.templateVariant === 'warm'
  const isMinimal = brief.templateVariant === 'minimal'
  const portraitClass = (isWarm || isMinimal) ? ' about__image--portrait' : ''

  const imageBlock = imageUrl
    ? `<div class="about__image${portraitClass}" data-animate data-delay="2"><img src="${e(imageUrl)}" alt="${e(businessName)} team" loading="lazy" /></div>`
    : ''

  return `
<section id="about" class="about section">
  <div class="container">
    <div class="about__inner${imageUrl ? '' : ' about__inner--no-image'}">
      <div class="about__text" data-animate>
        <span class="about__label">About Us</span>
        <h2>${e(businessName)}</h2>
        <p>${e(brief.about)}</p>
      </div>
      ${imageBlock}
    </div>
  </div>
</section>`
}

export function galleryHTML(brief: ContentBrief, galleryImageUrls: string[]): string {
  if (!brief.galleryEnabled || galleryImageUrls.length < 2) return ''

  const [img1, img2, img3] = galleryImageUrls
  const isAngledVariant = brief.templateVariant === 'agency' || brief.templateVariant === 'bold'

  const thirdItem = img3
    ? `<div class="gallery__item" data-animate data-delay="2">
          <img src="${e(img3)}" alt="Gallery image" loading="lazy" />
        </div>`
    : ''

  return `
<section class="gallery section${isAngledVariant ? ' section--angled' : ''}">
  <div class="container">
    <div class="gallery__grid">
      <div class="gallery__item gallery__item--tall" data-animate>
        <img src="${e(img1)}" alt="Gallery image" loading="lazy" />
      </div>
      <div class="gallery__pair">
        <div class="gallery__item" data-animate data-delay="1">
          <img src="${e(img2)}" alt="Gallery image" loading="lazy" />
        </div>
        ${thirdItem}
      </div>
    </div>
  </div>
</section>`
}

export function testimonialsHTML(brief: ContentBrief): string {
  const items = Array.isArray(brief.testimonials) ? brief.testimonials : []
  if (items.length === 0) return ''

  const variant = brief.templateVariant

  if (variant === 'minimal') {
    const [first, ...rest] = items
    const secondaries = rest.map((t, i) => `
      <div class="testimonial-block testimonial-block--secondary" data-animate data-delay="${i + 2}">
        <p class="testimonial-block__quote">${e(t.quote)}</p>
        <span class="testimonial-block__author">${e(t.author)}</span>
        <span class="testimonial-block__role"> — ${e(t.role)}</span>
      </div>`).join('\n')

    return `
<section class="testimonials section">
  <div class="container">
    <div class="testimonials__grid--minimal">
      <div class="testimonial-block testimonial-block--feature" data-animate>
        <p class="testimonial-block__quote">${e(first.quote)}</p>
        <div style="margin-top:1.25rem">
          <span class="testimonial-block__author">${e(first.author)}</span>
          <span class="testimonial-block__role"> — ${e(first.role)}</span>
        </div>
      </div>
      <div>
        ${secondaries}
      </div>
    </div>
  </div>
</section>`
  }

  if (variant === 'agency') {
    const cards = items.map((t, i) => `
      <div class="testimonial-card" data-animate data-delay="${i + 1}">
        <div class="testimonial-card__stars">★★★★★</div>
        <p class="testimonial-card__quote">${e(t.quote)}</p>
        <span class="testimonial-card__author">${e(t.author)}</span>
        <span class="testimonial-card__role">${e(t.role)}</span>
      </div>`).join('\n')

    return `
<section class="testimonials section">
  <div class="container">
    <div class="testimonials__header" data-animate>
      <h2>What Clients Say</h2>
    </div>
    <div class="testimonials__grid--agency">
      ${cards}
    </div>
  </div>
</section>`
  }

  if (variant === 'bold') {
    const [first, ...rest] = items
    const secondaries = rest.map((t, i) => `
      <div class="testimonial-bold--secondary" data-animate data-delay="${i + 2}">
        <p class="testimonial-block__quote">${e(t.quote)}</p>
        <div style="margin-top:0.75rem">
          <span class="testimonial-block__author">${e(t.author)}</span>
          <span class="testimonial-block__role"> — ${e(t.role)}</span>
        </div>
      </div>`).join('\n')

    return `
<section class="testimonials section">
  <div class="container">
    <div class="testimonials__grid--bold">
      <div class="testimonial-bold--feature" data-animate>
        <p class="testimonial-block__quote">${e(first.quote)}</p>
        <div style="margin-top:1.25rem">
          <span class="testimonial-block__author">${e(first.author)}</span>
          <span class="testimonial-block__role"> — ${e(first.role)}</span>
        </div>
      </div>
      ${secondaries}
    </div>
  </div>
</section>`
  }

  // warm
  const cards = items.map((t, i) => `
    <div class="testimonial-warm" data-animate data-delay="${i + 1}">
      <div class="testimonial-warm__pip"></div>
      <p class="testimonial-warm__quote">${e(t.quote)}</p>
      <span class="testimonial-warm__author">${e(t.author)}</span>
      <span class="testimonial-warm__role">${e(t.role)}</span>
    </div>`).join('\n')

  return `
<section class="testimonials section">
  <div class="container">
    <div class="testimonials__grid--warm">
      ${cards}
    </div>
  </div>
</section>`
}

export function statsHTML(brief: ContentBrief): string {
  const statItems = brief.stats.map((s, i) => {
    const match = s.value.match(/^(\d+)(.*)/)
    const valueEl = match
      ? `<span class="stat__value" data-count="${match[1]}" data-suffix="${e(match[2])}">0</span>`
      : `<span class="stat__value">${e(s.value)}</span>`
    return `
    <div data-animate data-delay="${i + 1}">
      ${valueEl}
      <span class="stat__label">${e(s.label)}</span>
    </div>`
  }).join('\n')

  const isAngledVariant = brief.templateVariant === 'agency' || brief.templateVariant === 'bold'

  return `
<section class="stats section${isAngledVariant ? ' section--angled' : ''}">
  <div class="container">
    <div class="stats__grid">
      ${statItems}
    </div>
  </div>
</section>`
}

export function ctaHTML(brief: ContentBrief): string {
  return `
<section id="contact" class="cta section">
  <div class="container">
    <div class="cta__inner" data-animate>
      <h2>${e(brief.finalCtaHeadline)}</h2>
      <p>${e(brief.finalCtaSubtext)}</p>
      <a href="mailto:${e(brief.email)}" class="btn btn-primary" style="font-size:1rem;padding:1rem 2.25rem">
        ${e(brief.ctaText)} →
      </a>
    </div>
  </div>
</section>`
}

export function footerHTML(brief: ContentBrief, businessName: string): string {
  const links = brief.navLinks.map(l => `<li><a href="#">${e(l)}</a></li>`).join('\n        ')
  const year  = new Date().getFullYear()

  return `
<footer class="footer">
  <div class="container">
    <div class="footer__inner">
      <div>
        <div class="footer__brand">
          <span class="footer__brand-mark">${e((brief.logoMark ?? businessName.slice(0, 2)).toUpperCase())}</span>
          <span>${e(businessName)}</span>
        </div>
        <div class="footer__tagline">${e(brief.tagline)}</div>
      </div>
      <div>
        <div class="footer__heading">Navigation</div>
        <ul class="footer__link-list">
          ${links}
        </ul>
      </div>
      <div>
        <div class="footer__heading">Contact</div>
        <ul class="footer__link-list">
          <li><a href="mailto:${e(brief.email)}">${e(brief.email)}</a></li>
          ${brief.location ? `<li><span>${e(brief.location)}</span></li>` : ''}
        </ul>
      </div>
    </div>
    <div class="footer__bottom">
      <span>© ${year} ${e(businessName)}. All rights reserved.</span>
      <span>Built with Lifer</span>
    </div>
  </div>
</footer>`
}
