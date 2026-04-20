export interface UnsplashPhoto {
  url: string
  fullUrl: string
  thumbUrl: string
  credit: string
}

interface UnsplashResult {
  urls: { full: string; regular: string; thumb: string }
  user: { name: string }
}

interface UnsplashSearchResponse {
  results: UnsplashResult[]
}

const HERO_QUERIES: Record<string, string> = {
  architecture:  'modern architecture interior dramatic light',
  restaurant:    'restaurant interior ambient evening dining',
  fitness:       'modern gym interior equipment light',
  legal:         'law office professional minimal interior',
  technology:    'tech office modern workspace open plan',
  retail:        'boutique retail interior minimal clean',
  wellness:      'spa interior calm natural light serene',
  construction:  'construction architecture building professional',
  marketing:     'creative agency studio office modern',
  medical:       'modern clinic interior minimal white',
  finance:       'finance office professional city skyline',
  consulting:    'consulting office professional boardroom',
  education:     'modern classroom education bright airy',
  photography:   'photography studio professional equipment',
  beauty:        'beauty salon interior modern minimal',
  realestate:    'luxury real estate interior design',
  automotive:    'automotive showroom modern sleek',
  events:        'event venue elegant interior lighting',
  accounting:    'accounting office professional clean',
  design:        'design studio creative workspace inspiration',
  hospitality:   'hotel lobby interior elegant modern',
  catering:      'catering food professional kitchen elegant',
}

export function industryHeroQuery(industry: string): string {
  const key = industry.toLowerCase().replace(/[^a-z]/g, '')
  if (HERO_QUERIES[key]) return HERO_QUERIES[key]
  for (const [k, v] of Object.entries(HERO_QUERIES)) {
    if (key.includes(k) || k.includes(key)) return v
  }
  return `${industry} professional atmosphere interior`
}

export async function searchUnsplash(
  query: string,
  count = 1,
  orientation: 'landscape' | 'squarish' | 'portrait' = 'landscape',
): Promise<UnsplashPhoto[]> {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) return []

  try {
    const params = new URLSearchParams({
      query,
      per_page: String(Math.min(count, 10)),
      orientation,
    })

    const res = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
      headers: { Authorization: `Client-ID ${key}` },
      next: { revalidate: 0 },
    })

    if (!res.ok) return []

    const body = (await res.json()) as UnsplashSearchResponse

    return body.results.map(r => ({
      url:      r.urls.regular,
      fullUrl:  r.urls.full ?? r.urls.regular,
      thumbUrl: r.urls.thumb,
      credit:   `Photo by ${r.user.name} on Unsplash`,
    }))
  } catch {
    return []
  }
}
