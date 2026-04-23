import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' })
}

// Groq — used for lower-stakes updates (change requests). Fast and free.
function getGroq() {
  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY ?? '',
    baseURL: 'https://api.groq.com/openai/v1',
  })
}

interface ContentVersion {
  headline: string
  subheading: string
  about: string
  services: string[]
}

function buildPrompt(current: ContentVersion, request: string): string {
  return `You are a website content editor for a high-end design studio.

Current website content:
---
Headline: ${current.headline}
Subheading: ${current.subheading}
About: ${current.about}
Services: ${current.services.join(', ')}
---

The client has requested: "${request}"

Return ONLY a valid JSON object with these exact keys:
  headline    (string)
  subheading  (string)
  about       (string)
  services    (array of strings, 4–6 items)

Do not change sections that were not mentioned in the request.
Do not include any text outside the JSON object.`
}

export async function generateContentUpdate(
  current: ContentVersion,
  request: string,
): Promise<ContentVersion> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set')
  }

  const attempt = async (): Promise<ContentVersion> => {
    const res = await getGroq().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: buildPrompt(current, request) }],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    })

    const text = res.choices[0]?.message?.content ?? ''
    const parsed = JSON.parse(text) as ContentVersion

    if (
      typeof parsed.headline !== 'string' ||
      typeof parsed.subheading !== 'string' ||
      typeof parsed.about !== 'string' ||
      !Array.isArray(parsed.services)
    ) {
      throw new Error('Malformed response')
    }

    return parsed
  }

  try {
    return await attempt()
  } catch (firstError) {
    if (firstError instanceof SyntaxError || (firstError as Error).message === 'Malformed response') {
      return await attempt()
    }
    throw firstError
  }
}

// ── ContentBrief — the structured brief Claude generates ──────────────────────

export interface ContentBrief {
  templateVariant:  'minimal' | 'bold' | 'agency' | 'warm'
  heroStyle:        'cinematic' | 'split' | 'centered'
  heroTextPosition: 'left-bottom' | 'left-center' | 'center-bottom' | 'center'
  headingWeight:    'ultra' | 'bold' | 'light'
  brandVoice:       'authoritative' | 'approachable' | 'aspirational' | 'disruptive'
  galleryEnabled:   boolean
  primaryColor:     string
  accentColor:      string
  fontHeading:      string
  fontBody:         string
  fontDisplay?:     string
  logoMark:         string
  headline:         string
  tagline:          string
  subheadline:      string
  navLinks:         string[]
  ctaText:          string
  heroAlt:          string
  services:         Array<{ name: string; description: string }>
  about:            string
  process:          Array<{ step: string; title: string; body: string }>
  stats:            Array<{ value: string; label: string }>
  testimonials:     Array<{ quote: string; author: string; role: string }>
  finalCtaHeadline: string
  finalCtaSubtext:  string
  email:            string
  location:         string
  // Populated post-AI-generation from Unsplash — not AI-generated
  heroImageUrl?:    string
  galleryImageUrl?: string
  aboutImageUrl?:   string
}

function buildBriefPrompt(
  businessName: string,
  industry: string,
  description: string,
  tone?: string,
): string {
  return `You are a senior brand strategist and creative director at a world-class web design agency. Your job is to generate a complete, opinionated website content brief for a real business. Every choice should feel deliberate and specific to this brand — not generic.

Business Name: ${businessName}
Industry: ${industry}
Description: ${description}${tone ? `\nTone preference: ${tone}` : ''}

Make careful, considered choices for every field. Think about what would make this specific business feel premium and trustworthy.

Return ONLY a valid JSON object with EXACTLY these keys — no prose before or after:

{
  "templateVariant": "minimal" | "bold" | "agency" | "warm",
  "heroStyle": "cinematic" | "split" | "centered",
  "heroTextPosition": "left-bottom" | "left-center" | "center-bottom" | "center",
  "headingWeight": "ultra" | "bold" | "light",
  "brandVoice": "authoritative" | "approachable" | "aspirational" | "disruptive",
  "galleryEnabled": boolean,
  "primaryColor": string,
  "accentColor": string,
  "fontHeading": string,
  "fontBody": string,
  "fontDisplay": string | null,
  "logoMark": string,
  "headline": string,
  "tagline": string,
  "subheadline": string,
  "navLinks": string[],
  "ctaText": string,
  "heroAlt": string,
  "services": [{ "name": string, "description": string }],
  "about": string,
  "process": [{ "step": string, "title": string, "body": string }],
  "stats": [{ "value": string, "label": string }],
  "testimonials": [{ "quote": string, "author": string, "role": string }],
  "finalCtaHeadline": string,
  "finalCtaSubtext": string,
  "email": string,
  "location": string
}

FIELD RULES:

templateVariant — choose based on industry personality:
  "minimal"  → legal, finance, consulting, architecture, medical, accountancy
  "bold"     → fitness, gym, sport, construction, trades, security
  "agency"   → technology, SaaS, marketing, creative, design, software
  "warm"     → restaurant, hospitality, café, retail, wellness, beauty, events

heroStyle — choose based on what looks best for this brand:
  "cinematic" → bold/agency variants, dramatic industries (fitness, tech, construction)
  "split"     → minimal/warm variants when a strong image + readable text both matter
  "centered"  → restaurant, wellness, retail — centered text over atmospheric image

heroTextPosition — where the copy block sits over the hero:
  "left-bottom"   → dramatic cinematic. Copy anchored bottom-left. Use for bold/agency cinematic.
  "left-center"   → editorial, mid-height. Use for split hero and landscape-heavy cinematic.
  "center-bottom" → atmospheric, text rises from bottom center. Use for centered heroStyle.
  "center"        → classic centered. Use for restaurant/wellness/centered heroStyle.
  RULE: if heroStyle is "centered" → always use "center" or "center-bottom".
  RULE: if heroStyle is "split" → always use "left-center".

headingWeight — drives the visual weight of h1/h2 across the site:
  "ultra"  → font-weight 900, very tight letter-spacing (-0.04em). Use for bold/agency + fitness/construction.
  "bold"   → font-weight 700, standard tight spacing (-0.02em). The default for most.
  "light"  → font-weight 300, wide spacing (0.01em). Use for luxury, architecture, minimal, wellness.

brandVoice — the editorial voice that drives ALL copy choices:
  "authoritative"  → confident, declarative, no hedging. "We deliver." not "We try to deliver."
  "approachable"   → warm, conversational, uses "you" and "we" naturally. Inviting.
  "aspirational"   → evocative, emotionally elevated. Paint a picture of transformation.
  "disruptive"     → direct, punchy, challenges convention. Short sentences. Strong opinions.${tone ? `
  The user explicitly chose tone "${tone}" — map this:
    professional → authoritative, warm → approachable, bold → disruptive, premium → aspirational` : ''}

galleryEnabled — set true ONLY for visual industries:
  true for: architecture, interior design, photography, restaurant, retail, beauty, events, construction
  false for: legal, medical, finance, consulting, SaaS/tech, accounting

primaryColor — think like a brand designer, not a developer:
  Architecture/Minimal: warm off-black (#1c1917), deep slate (#1e293b), or warm taupe (#8b7355)
  Legal/Finance: deep navy (#1a2744), dark forest (#1a3a2a), or deep charcoal (#1c1c1e)
  Fitness/Bold: near-black (#0a0a0a) with electric accent — OR deep crimson (#8b1a1a)
  Agency/Tech: near-black (#06060f) — the primary IS the dark base; accent does the color work
  Restaurant/Warm: rich terracotta (#b85c38), deep olive (#4a5240), or warm burgundy (#6b2d3e)
  Wellness/Spa: sage green (#6b8f71), dusty rose (#c4957a), or warm stone (#9e8872)
  AVOID: generic corporate blue (#2563eb), generic green (#16a34a), default orange (#f97316)

accentColor — must create contrast with primary:
  Complementary (opposite on color wheel), analogous (adjacent, more vibrant), or
  neutral accent: warm gold (#c9a84c), cream (#f5e8d0), electric white-blue (#e0e7ff)

fontHeading — pick the pairing that fits this specific brand character:
  Architecture:  "Cormorant Garamond"   (refined editorial serif)
  Legal/Finance: "Playfair Display"     (authoritative serif)
  Fitness/Bold:  "Syne"                 (strong geometric sans)
  Agency/Tech:   "Space Grotesk"        (distinctive geometric)
  Restaurant:    "Fraunces"             (expressive optical serif)
  Wellness:      "DM Serif Display"     (soft, approachable serif)
  Construction:  "Outfit"               (confident modern sans)
  Consulting:    "Libre Baskerville"    (trustworthy serif)
  Other sans options: "Manrope", "Inter", "Bebas Neue" (display only)
  Other serif options: "Libre Baskerville", "DM Serif Display"

fontBody — a highly legible Google Font for body text:
  "Inter", "DM Sans", "Plus Jakarta Sans", "Lato", "Nunito Sans"
  Pair with fontHeading: use a contrasting type classification (serif heading → sans body, vice versa)

fontDisplay — optional THIRD font for purely decorative oversized use (process numbers, stat values):
  ONLY set when it adds clear visual character. Use null for most brands.
  Fitness/construction: "Bebas Neue"
  Luxury/architecture (if fontHeading is sans): "Cormorant Garamond"
  Agency/tech: "Syne" (only if not already fontHeading)
  Warm/artisan: "Fraunces" (only if not already fontHeading)
  Omit (null) if fontHeading is already a display or decorative font.

logoMark — 2 uppercase letters from the business name initials (e.g. "MK" for "MK Architects")

headline — study these patterns, choose the right voice for this brand's brandVoice:
  Authoritative + specific: "London's Leading Commercial Architects"
  Aspirational + transformation: "Where Great Ideas Become Great Spaces"
  Disruptive + direct: "No Fluff. Just Results."
  Approachable + outcome: "We Help Small Businesses Look Like Big Ones"
  Minimal/poetic: "Space. Light. Intention."
  Bold imperative: "Build Something That Lasts"
  AVOID: "Welcome to [Business Name]", "Your Partner in [Industry]",
         "Delivering Excellence Since [Year]", any generic industry clichés,
         any headline over 9 words that isn't a complete sentence.

tagline — 3–5 word company descriptor (e.g. "Premium Interior Architecture", "Fitness for High Performers")
subheadline — 1–2 sentences expanding on the headline. Specific and compelling. Max 25 words.
navLinks — exactly 4 items: adjust labels to fit the industry (e.g. "Work", "Studio", "Process", "Contact")
ctaText — action-oriented button text, 2–4 words (e.g. "Start Your Project", "Book a Consult", "Reserve a Table")
heroAlt — descriptive alt text for the hero image

services — 4–6 items. Each name: specific benefit-led (not generic). Descriptions: 1 sentence, 12–20 words.
  AVOID generic names like "Consulting", "Strategy", "Support" — be specific to this business.

about — 2–3 sentences. No clichés ("passionate team", "dedicated to excellence").
  Write like a real brand — specific, confident, human. What makes this business distinct?

process — exactly 3 steps showing how the business works. Steps labelled "01", "02", "03".
  Each: title (3–5 words), body (1 sentence, 10–18 words).
  Make steps feel natural to the industry.

stats — exactly 3 stats. Make them credible and specific.
  RULES: Always include units: "12 Years" beats "12". Use £/$M+ for project values.
  Never use "100%" satisfaction — no one believes it.
  Pick stats a real business would track: "98% Client Retention", "£2M+ Delivered", "40+ Projects"

testimonials — array of 2–3 testimonials. Each from a distinct-sounding person.
  - Vary quote lengths: one short+punchy (~15 words), one detailed (~30 words)
  - Roles must be specific: "Founder, Meridian Capital" not just "Client"
  - Quotes must be about outcomes: "We signed three new enterprise clients in the first month"
  - NO sycophantic openers: never start with "I was so impressed...", "Amazing team...", etc.
  - Author names should sound plausible for the business locale

finalCtaHeadline — 4–7 words, action-oriented (e.g. "Ready to Transform Your Space?")
finalCtaSubtext — 1 sentence reinforcing the CTA, 10–18 words

email — derive from business name (e.g. hello@mkarchitects.com). Use hello@, studio@, or info@ prefix.
location — city and country (e.g. "London, UK" or "New York, USA")

Never use Lorem Ipsum, placeholder text, or generic filler content.`
}

async function generateContentBrief(
  businessName: string,
  industry: string,
  description: string,
  tone?: string,
): Promise<ContentBrief> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set')

  const attempt = async (): Promise<ContentBrief> => {
    const anthropic = getAnthropic()
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      messages: [{ role: 'user', content: buildBriefPrompt(businessName, industry, description, tone) }],
    })

    const text = (msg.content[0] as { type: 'text'; text: string }).text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    const parsed = JSON.parse(jsonMatch[0]) as ContentBrief

    if (!parsed.headline || !parsed.primaryColor || !Array.isArray(parsed.services)) {
      throw new Error('Malformed brief response')
    }

    // Backward compat + defaults for any fields Claude may omit
    parsed.heroStyle        = parsed.heroStyle        ?? 'cinematic'
    parsed.heroTextPosition = parsed.heroTextPosition ?? 'left-bottom'
    parsed.headingWeight    = parsed.headingWeight    ?? 'bold'
    parsed.brandVoice       = parsed.brandVoice       ?? 'authoritative'
    parsed.galleryEnabled   = parsed.galleryEnabled   ?? false
    parsed.logoMark         = parsed.logoMark         ?? businessName.slice(0, 2).toUpperCase()
    parsed.process          = Array.isArray(parsed.process) ? parsed.process : []

    // Migrate singular testimonial → array
    if (!Array.isArray(parsed.testimonials)) {
      const legacy = (parsed as unknown as { testimonial?: { quote: string; author: string; role: string } }).testimonial
      parsed.testimonials = legacy ? [legacy] : []
    }

    return parsed
  }

  try {
    return await attempt()
  } catch (firstError) {
    if (firstError instanceof SyntaxError || (firstError as Error).message === 'Malformed brief response') {
      return await attempt()
    }
    throw firstError
  }
}

// ── Extract a ContentBrief from imported HTML ─────────────────────────────────

export async function extractContentBriefFromHtml(
  html: string,
  businessName: string,
): Promise<ContentBrief> {
  const MAX_CHARS = 80_000
  // Strip scripts, styles, and comments to reduce token usage
  const condensed = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .slice(0, MAX_CHARS)

  const logoMark = businessName.slice(0, 2).toUpperCase() || 'XX'

  const anthropic = getAnthropic()
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: `You are extracting content from an existing website's HTML into a structured JSON object. Read the HTML carefully and extract real text content. For design fields that cannot be determined from HTML, use the specified defaults.`,
    messages: [{
      role: 'user',
      content: `Extract the website content from this HTML for a business called "${businessName}".

Return ONLY a valid JSON object. Use these exact keys:

{
  "templateVariant": "minimal",
  "heroStyle": "cinematic",
  "heroTextPosition": "left-bottom",
  "headingWeight": "bold",
  "brandVoice": "authoritative",
  "galleryEnabled": false,
  "primaryColor": "#1c1917",
  "accentColor": "#f5e8d0",
  "fontHeading": "Inter",
  "fontBody": "Inter",
  "fontDisplay": null,
  "logoMark": "${logoMark}",
  "headline": "<main hero headline>",
  "tagline": "<short 3-5 word descriptor>",
  "subheadline": "<hero subheading or intro text>",
  "navLinks": ["<nav item>", ...],
  "ctaText": "<primary CTA button text>",
  "heroAlt": "<description of hero image>",
  "services": [{ "name": "<service name>", "description": "<1 sentence>" }],
  "about": "<about section text>",
  "process": [{ "step": "01", "title": "<title>", "body": "<body>" }],
  "stats": [{ "value": "<value>", "label": "<label>" }],
  "testimonials": [{ "quote": "<quote>", "author": "<name>", "role": "<role>" }],
  "finalCtaHeadline": "<footer CTA headline>",
  "finalCtaSubtext": "<footer CTA subtext>",
  "email": "<contact email if found, else hello@${businessName.toLowerCase().replace(/\s+/g, '')}.com>",
  "location": "<city, country if found>"
}

RULES:
- Extract REAL text from the HTML — do not invent content
- For design fields (templateVariant, heroStyle, etc.) use the defaults shown above exactly
- If a section (process, stats, testimonials) is not present, use empty arrays
- Keep the JSON compact and valid

HTML:
${condensed}`,
    }],
  })

  const text = (msg.content[0] as { type: 'text'; text: string }).text
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON in extraction response')
  const parsed = JSON.parse(jsonMatch[0]) as ContentBrief

  // Ensure required array fields exist
  parsed.services      = Array.isArray(parsed.services)      ? parsed.services      : []
  parsed.process       = Array.isArray(parsed.process)       ? parsed.process       : []
  parsed.stats         = Array.isArray(parsed.stats)         ? parsed.stats         : []
  parsed.testimonials  = Array.isArray(parsed.testimonials)  ? parsed.testimonials  : []
  parsed.navLinks      = Array.isArray(parsed.navLinks)      ? parsed.navLinks      : []
  parsed.logoMark      = parsed.logoMark || logoMark

  return parsed
}

export async function generateHtmlModification(
  existingHtml: string,
  changeRequest: string,
): Promise<string> {
  const MAX_CHARS = 150_000
  const html = existingHtml.length > MAX_CHARS
    ? existingHtml.slice(0, MAX_CHARS)
    : existingHtml

  const anthropic = getAnthropic()
  const msg = await anthropic.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 16384,
    system: `You are editing a website's HTML. Make only the specific change requested by the user. Preserve all existing structure, CSS classes, JavaScript, inline styles, and asset URLs exactly. Return the complete HTML document with only the requested change applied — nothing else, no explanation, no markdown fences.`,
    messages: [{
      role:    'user',
      content: `Change request: ${changeRequest}\n\nHTML:\n${html}`,
    }],
  })

  const text = msg.content.find(b => b.type === 'text')?.text ?? ''
  // Strip any accidental markdown fences
  return text.replace(/^```html\s*/i, '').replace(/\s*```$/, '').trim()
}

export async function generateProspectHtml(params: {
  businessName:     string
  industry:         string
  description:      string
  heroImageUrl:     string | null
  galleryImageUrls: string[]
  aboutImageUrl?:   string | null
  tone?:            string
}): Promise<{ html: string; brief: ContentBrief }> {
  const { businessName, industry, description, heroImageUrl, galleryImageUrls, aboutImageUrl, tone } = params

  console.log(`[prospect] Claude Sonnet generating content brief for "${businessName}"`)
  const brief = await generateContentBrief(businessName, industry, description, tone)

  // Annotate brief with image URLs (not AI-generated — needed for future regeneration)
  brief.heroImageUrl    = heroImageUrl    ?? undefined
  brief.galleryImageUrl = galleryImageUrls[0] ?? undefined
  brief.aboutImageUrl   = aboutImageUrl   ?? undefined

  console.log(`[prospect] Assembling site (variant: ${brief.templateVariant}, hero: ${brief.heroStyle}, voice: ${brief.brandVoice})`)
  const { assembleProspectSite } = await import('./templates/index')
  const html = assembleProspectSite(brief, businessName, heroImageUrl, galleryImageUrls)
  return { html, brief }
}

// ── Update brief for change requests (Groq — fast, lower-stakes) ─────────────
// TODO: can be upgraded to Claude Sonnet for richer updates

export async function generateUpdatedBrief(
  current: ContentBrief,
  request: string,
): Promise<ContentBrief> {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is not set')

  const prompt = `You are a website content editor for a premium web design agency.

The client has requested a change to their website: "${request}"

Here is the current website content brief as JSON:
${JSON.stringify(current, null, 2)}

Return an updated brief applying the requested change.

CRITICAL RULES — preserve these fields EXACTLY as they are in the input:
- templateVariant, heroStyle, heroTextPosition (never change the design)
- headingWeight, brandVoice (never change typographic or voice identity)
- primaryColor, accentColor (never change brand colours)
- fontHeading, fontBody, fontDisplay (never change typography)
- logoMark (never change)
- galleryEnabled (never change)
- heroImageUrl, galleryImageUrl, aboutImageUrl (never change images)
- email, location (never change contact info unless explicitly asked)
- process (preserve unless the client explicitly asks to change it)
- testimonials (preserve unless the client explicitly asks to change them)

Only modify content fields directly relevant to the request (headline, tagline, subheadline, about, services, stats, ctaText, finalCtaHeadline, finalCtaSubtext, navLinks).

Return ONLY a valid JSON object with the same keys as the input. No extra text.`

  const attempt = async (): Promise<ContentBrief> => {
    const res = await getGroq().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const text = res.choices[0]?.message?.content ?? ''
    const parsed = JSON.parse(text) as ContentBrief

    if (!parsed.headline || !parsed.primaryColor || !Array.isArray(parsed.services)) {
      throw new Error('Malformed response')
    }

    // Always hard-preserve identity fields regardless of AI output
    parsed.templateVariant  = current.templateVariant
    parsed.heroStyle        = current.heroStyle
    parsed.heroTextPosition = current.heroTextPosition ?? 'left-bottom'
    parsed.headingWeight    = current.headingWeight    ?? 'bold'
    parsed.brandVoice       = current.brandVoice       ?? 'authoritative'
    parsed.galleryEnabled   = current.galleryEnabled   ?? false
    parsed.primaryColor     = current.primaryColor
    parsed.accentColor      = current.accentColor
    parsed.fontHeading      = current.fontHeading
    parsed.fontBody         = current.fontBody
    parsed.fontDisplay      = current.fontDisplay
    parsed.logoMark         = current.logoMark
    parsed.heroImageUrl     = current.heroImageUrl
    parsed.galleryImageUrl  = current.galleryImageUrl
    parsed.aboutImageUrl    = current.aboutImageUrl
    parsed.email            = current.email
    parsed.location         = current.location
    parsed.process          = current.process
    parsed.testimonials     = Array.isArray(current.testimonials) ? current.testimonials : []

    return parsed
  }

  try {
    return await attempt()
  } catch (firstError) {
    if (firstError instanceof SyntaxError || (firstError as Error).message === 'Malformed response') {
      return await attempt()
    }
    throw firstError
  }
}
