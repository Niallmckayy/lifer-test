import type { Version } from './types'

const headlines = [
  'Where Form Meets Function',
  'Architecture That Speaks',
  'Built With Intention',
  'Spaces Designed to Inspire',
  'Crafting Tomorrows Spaces',
  'The Art of Considered Design',
  'Precision in Every Detail',
]

const subheadings = [
  'Award-winning architectural practice based in London.',
  'Thoughtful design for residential and commercial spaces.',
  'We create spaces that stand the test of time.',
  'From concept to completion — architecture redefined.',
  'Architecture rooted in material honesty and precision.',
  'A studio defined by rigour, craft, and care.',
]

const abouts = [
  'Our practice is built on a belief that great architecture comes from deep listening — to our clients, to the site, and to the materials we work with.',
  'We are a London-based studio working across residential, commercial, and cultural projects. Every project begins with a question: what does this space need to become?',
  'Founded on the principles of simplicity and precision, we deliver architectural solutions that balance beauty with practicality.',
  'MK Architects is a considered practice — small by design, ambitious in scope. We take on fewer projects so every one receives the attention it deserves.',
  'We believe architecture should last. Our work is defined by material honesty, close client relationships, and a refusal to compromise on quality.',
]

const servicesSets = [
  ['Residential Design', 'Commercial Projects', 'Interior Architecture', 'Planning Consultancy'],
  ['New Builds', 'Refurbishment', 'Interior Design', 'Project Management'],
  ['Residential Design', 'Commercial Architecture', 'Urban Planning', 'Interior Consultancy'],
  ['Bespoke Homes', 'Workplace Design', 'Heritage Projects', 'Planning & Permits'],
]

function pick<T>(arr: T[], exclude?: T): T {
  const pool = exclude !== undefined ? arr.filter(x => x !== exclude) : arr
  return pool[Math.floor(Math.random() * pool.length)]
}

export function generateWebsiteUpdate(current: Version, request: string): Version {
  const lower = request.toLowerCase()

  const targetHeadline = lower.includes('headline') || lower.includes('hero') || lower.includes('title') || lower.includes('heading')
  const targetSubheading = lower.includes('subheading') || lower.includes('tagline') || lower.includes('description') || lower.includes('subtitle')
  const targetAbout = lower.includes('about') || lower.includes('story') || lower.includes('bio') || lower.includes('who we are')
  const targetServices = lower.includes('service') || lower.includes('offering') || lower.includes('what we do')

  // Default: change headline if no specific section mentioned
  const noTarget = !targetHeadline && !targetSubheading && !targetAbout && !targetServices

  return {
    id: `v-${Date.now()}`,
    headline: targetHeadline || noTarget ? pick(headlines, current.headline) : current.headline,
    subheading: targetSubheading ? pick(subheadings, current.subheading) : current.subheading,
    about: targetAbout ? pick(abouts, current.about) : current.about,
    services: targetServices ? pick(servicesSets, current.services) : current.services,
    createdAt: new Date().toISOString(),
  }
}
