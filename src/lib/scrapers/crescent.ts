/**
 * Crescent Communities Scraper - Scrapes Charlotte NOVEL-branded apartment properties
 *
 * Strategy:
 * Stage 0 — Discovery: Parse market page, identify all communities (Leasing + Legacy)
 * Stage 1 — Market Index: Extract community metadata
 * Stage 2 — Community Site: Scrape homepage for specials, contact info, platform detection
 * Stage 3 — Floor Plans: Extract floor plan data with pricing
 *
 * Handles two platform types:
 * - Crescent CMS (noveluniversityplace.com, novelmallardcreek.com, noveldavidson.com)
 * - Third-party CMS (novelballantyne.com)
 */

import { chromium, Browser, Page } from 'playwright'
import { ScrapedBuilding, ScrapedFloorPlan, ScrapedSpecial, ScrapeResult, DiscountType } from './types'
import crescentOverrides from '@/config/crescent-overrides.json'

// Charlotte market page URL
const CHARLOTTE_MARKET_URL = 'https://www.crescentcommunities.com/about-us/markets/charlotte-nc/'

// Platform types
type PlatformType = 'crescent_cms' | 'third_party' | 'unknown'

interface DiscoveredCommunity {
  name: string
  slug: string
  status: 'leasing' | 'legacy' | 'coming_soon'
  location: string
  unitCount: number | null
  description: string | null
  websiteUrl: string | null
  platformType: PlatformType
  floorPlansPath: string
}

interface CommunityOverride {
  status: string
  url?: string
  new_url?: string
  platform?: string
  floor_plans_path?: string
  exclude_from_scrape?: boolean
  new_name?: string
  operator?: string
  notes?: string
}

/**
 * Slugify a community name
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/novel\s+/i, 'novel-')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

/**
 * Get override config for a community
 */
function getOverride(slug: string): CommunityOverride | null {
  const overrides = crescentOverrides.overrides as Record<string, CommunityOverride>
  return overrides[slug] || null
}

/**
 * Get known community config
 */
function getKnownCommunity(slug: string): { url: string; platform: string; floor_plans_path: string; status: string } | null {
  const known = crescentOverrides.known_communities as Record<string, { url: string; platform: string; floor_plans_path: string; status: string }>
  return known[slug] || null
}

/**
 * Construct potential URLs for a community
 */
function constructCommunityUrls(name: string): string[] {
  const cleanName = name.toLowerCase().replace(/novel\s+/i, '').replace(/\s+/g, '')
  return [
    `https://www.novel${cleanName}.com`,
    `https://novel${cleanName}.com`,
    `https://www.novel${cleanName}.com/`,
    `https://novel${cleanName}.com/`,
  ]
}

/**
 * Validate URL with HTTP HEAD request
 */
async function validateUrl(url: string): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    })

    clearTimeout(timeoutId)
    return response.ok
  } catch {
    return false
  }
}

/**
 * Detect platform type from HTML content
 */
async function detectPlatformType(page: Page, url: string): Promise<PlatformType> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 })

    const platformSignals = await page.evaluate(() => {
      const html = document.documentElement.outerHTML

      return {
        hasMediaPath: html.includes('/media/'),
        hasAssetsPath: html.includes('/assets/images/'),
        hasKnockDoorway: html.includes('knockDoorway'),
        hasFloorPlansPath: !!document.querySelector('a[href*="/floor-plans/"]'),
        hasFloorplansPath: !!document.querySelector('a[href*="/floorplans/"]'),
      }
    })

    // Crescent CMS markers: /media/ paths, knockDoorway script, /floor-plans/ path
    if (platformSignals.hasMediaPath || platformSignals.hasKnockDoorway || platformSignals.hasFloorPlansPath) {
      return 'crescent_cms'
    }

    // Third-party markers: /assets/images/ paths, /floorplans/ path
    if (platformSignals.hasAssetsPath || platformSignals.hasFloorplansPath) {
      return 'third_party'
    }

    return 'unknown'
  } catch {
    return 'unknown'
  }
}

/**
 * Stage 0 & 1: Discover communities from market page
 */
async function discoverCommunities(page: Page): Promise<DiscoveredCommunity[]> {
  console.log('  [crescent] Stage 0: Discovering communities from market page...')

  const communities: DiscoveredCommunity[] = []
  const seen = new Set<string>()

  await page.goto(CHARLOTTE_MARKET_URL, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(2000)

  // Extract community data from the page
  const rawCommunities = await page.evaluate(() => {
    const results: Array<{
      name: string
      status: string
      websiteUrl: string | null
    }> = []

    // Get all NOVEL links
    const allLinks = document.querySelectorAll('a[href*="novel"]')
    const urlMap: Record<string, string> = {}
    for (const link of allLinks) {
      const href = link.getAttribute('href') || ''
      if (href.includes('novel') && href.includes('.com') && !href.includes('crescentcommunities')) {
        const match = href.match(/novel([a-z]+)\.com/i)
        if (match) {
          urlMap[match[1].toLowerCase()] = href
        }
      }
    }

    // Parse page text line by line to find NOVEL communities
    const pageText = document.body.innerText
    const lines = pageText.split('\n').map(l => l.trim()).filter(l => l)

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.startsWith('NOVEL ') && line.length < 50) {
        const name = line.trim()

        // Skip duplicates
        if (results.some(r => r.name === name)) continue

        // Look ahead for status
        let status = 'unknown'
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const nextLine = lines[j].toLowerCase()
          if (nextLine === 'leasing') { status = 'leasing'; break }
          if (nextLine === 'legacy') { status = 'legacy'; break }
          if (nextLine.includes('coming soon')) { status = 'coming_soon'; break }
        }

        // Skip "Coming Soon" properties
        if (status === 'coming_soon') continue

        // Try to find matching URL
        const nameKey = name.replace(/NOVEL\s+/i, '').toLowerCase().replace(/\s+/g, '')
        const websiteUrl = urlMap[nameKey] || null

        results.push({ name, status, websiteUrl })
      }
    }

    return results
  })

  console.log(`  [crescent] Found ${rawCommunities.length} communities on market page`)

  // Process each community from page
  for (const raw of rawCommunities) {
    const slug = slugify(raw.name)
    const override = getOverride(slug)
    const known = getKnownCommunity(slug)

    // Skip if explicitly excluded
    if (override?.exclude_from_scrape) {
      console.log(`  [crescent] Skipping ${raw.name} (sold/excluded)`)
      continue
    }

    // Determine URL
    let websiteUrl = raw.websiteUrl
    let platformType: PlatformType = 'unknown'
    let floorPlansPath = '/floor-plans/'

    // Check known communities first
    if (known) {
      websiteUrl = known.url
      platformType = known.platform as PlatformType
      floorPlansPath = known.floor_plans_path
    }
    // Then check overrides
    else if (override?.url) {
      websiteUrl = override.url
      platformType = (override.platform as PlatformType) || 'unknown'
      floorPlansPath = override.floor_plans_path || '/floor-plans/'
    }
    // For communities without URL, try to construct
    else if (!websiteUrl) {
      console.log(`  [crescent] Attempting URL discovery for: ${raw.name}`)
      const potentialUrls = constructCommunityUrls(raw.name)

      for (const url of potentialUrls) {
        if (await validateUrl(url)) {
          websiteUrl = url
          console.log(`  [crescent] Discovered URL: ${url}`)
          break
        }
      }
    }

    // Skip if no URL found
    if (!websiteUrl) {
      console.log(`  [crescent] Skipping ${raw.name} (no URL available)`)
      continue
    }

    // Skip duplicates
    if (seen.has(websiteUrl)) continue
    seen.add(websiteUrl)

    // Detect platform type if not known
    if (platformType === 'unknown' && websiteUrl) {
      platformType = await detectPlatformType(page, websiteUrl)
      floorPlansPath = platformType === 'third_party' ? '/floorplans/' : '/floor-plans/'
      console.log(`  [crescent] Detected platform for ${raw.name}: ${platformType}`)
    }

    communities.push({
      name: raw.name,
      slug,
      status: raw.status as 'leasing' | 'legacy' | 'coming_soon',
      location: 'Charlotte, North Carolina',
      unitCount: null,
      description: null,
      websiteUrl,
      platformType,
      floorPlansPath,
    })

    // Rate limit
    await new Promise(r => setTimeout(r, 1000))
  }

  // Also add known communities that might not be on the market page
  const knownComms = crescentOverrides.known_communities as Record<string, { url: string; platform: string; floor_plans_path: string; status: string }>
  for (const [slug, known] of Object.entries(knownComms)) {
    if (seen.has(known.url)) continue
    seen.add(known.url)

    const name = 'NOVEL ' + slug.replace('novel-', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    console.log(`  [crescent] Adding known community: ${name}`)

    communities.push({
      name,
      slug,
      status: known.status as 'leasing' | 'legacy' | 'coming_soon',
      location: 'Charlotte, North Carolina',
      unitCount: null,
      description: null,
      websiteUrl: known.url,
      platformType: known.platform as PlatformType,
      floorPlansPath: known.floor_plans_path,
    })
  }

  console.log(`  [crescent] ${communities.length} communities ready for scraping`)
  return communities
}

/**
 * Parse bedroom count from text
 * Note: Crescent sites use plan codes like S1, S2 for Studios, A1, A2 for 1BR, B1, B2 for 2BR
 */
function parseBedrooms(text: string): number {
  const lower = text.toLowerCase()

  // Check for explicit "studio" text
  if (lower.includes('studio')) return 0

  // Check for S-prefix plan codes (S1, S2 = Studio)
  if (/\bS\d+\b/i.test(text)) return 0

  // Check for explicit bedroom count
  const match = lower.match(/(\d+)\s*(?:bed|br|bedroom)/i)
  if (match) return parseInt(match[1], 10)

  // Infer from plan code prefix: A=1BR, B=2BR, C=3BR
  if (/\bA\d+/.test(text)) return 1
  if (/\bB\d+/.test(text)) return 2
  if (/\bC\d+/.test(text)) return 3

  return 1 // Default fallback
}

/**
 * Parse bathroom count from text
 */
function parseBathrooms(text: string): number {
  const match = text.match(/(\d+\.?\d*)\s*(?:bath|ba)/i)
  return match ? parseFloat(match[1]) : 1
}

/**
 * Parse sqft from text like "574 SF" or "650 - 850 SF"
 */
function parseSqft(text: string): { min: number | null; max: number | null } {
  const str = text.replace(/,/g, '')
  const rangeMatch = str.match(/(\d+)\s*[-–]\s*(\d+)/)
  if (rangeMatch) {
    return { min: parseInt(rangeMatch[1], 10), max: parseInt(rangeMatch[2], 10) }
  }
  const singleMatch = str.match(/(\d{3,4})/)
  if (singleMatch) {
    const val = parseInt(singleMatch[1], 10)
    return { min: val, max: val }
  }
  return { min: null, max: null }
}

/**
 * Parse rent from text like "$1,439" or "$1,500 - $1,800"
 */
function parseRent(text: string): { min: number; max: number } {
  const str = text.replace(/[$,]/g, '')
  const rangeMatch = str.match(/(\d+)\s*[-–]\s*(\d+)/)
  if (rangeMatch) {
    return { min: parseInt(rangeMatch[1], 10), max: parseInt(rangeMatch[2], 10) }
  }
  const singleMatch = str.match(/(\d{3,5})/)
  if (singleMatch) {
    const val = parseInt(singleMatch[1], 10)
    return { min: val, max: val }
  }
  return { min: 0, max: 0 }
}

/**
 * Parse discount type from special text
 */
function parseDiscountType(text: string): DiscountType | null {
  const lower = text.toLowerCase()
  if (lower.includes('month free') || lower.includes('months free') || lower.includes('weeks free')) {
    return 'months_free'
  }
  if (lower.includes('off rent') || lower.includes('reduced') || lower.includes('$ off')) {
    return 'reduced_rent'
  }
  if (lower.includes('waived') || lower.includes('no fee') || lower.includes('free application')) {
    return 'waived_fees'
  }
  if (lower.includes('gift card') || lower.includes('visa') || lower.includes('amazon')) {
    return 'gift_card'
  }
  if (lower.match(/free|off|special|deal|save|\$/i)) {
    return 'other'
  }
  return null
}

/**
 * Parse discount value from text
 */
function parseDiscountValue(text: string, discountType: DiscountType | null): number | null {
  if (!discountType) return null

  if (discountType === 'months_free') {
    const monthMatch = text.match(/(\d+)\s*months?\s*free/i)
    if (monthMatch) return parseFloat(monthMatch[1])
    const weekMatch = text.match(/(\d+)\s*weeks?\s*free/i)
    if (weekMatch) return parseFloat(weekMatch[1]) / 4
  }

  if (discountType === 'reduced_rent' || discountType === 'gift_card' || discountType === 'waived_fees') {
    const dollarMatch = text.match(/\$[\s]*([\d,]+)/i)
    if (dollarMatch) return parseFloat(dollarMatch[1].replace(/,/g, ''))
  }

  return null
}

/**
 * Parse end date from special text
 */
function parseSpecialEndDate(text: string): Date | null {
  const patterns = [
    /(?:move\s*in\s*by|expires?|ends?|by|before|through)\s+(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i,
    /(?:move\s*in\s*by|expires?|ends?|by|before|through)\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:,?\s*(\d{4}))?/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      try {
        let dateStr = match[1]
        if (match[2]) dateStr += ` ${match[2]}`
        if (match[3]) dateStr += `, ${match[3]}`
        else dateStr += `, ${new Date().getFullYear()}`

        const parsed = new Date(dateStr)
        if (!isNaN(parsed.getTime())) return parsed
      } catch {
        // Continue to next pattern
      }
    }
  }

  return null
}

/**
 * Stage 2: Scrape community homepage for specials and contact info
 */
async function scrapeCommunityHomepage(
  page: Page,
  community: DiscoveredCommunity
): Promise<{ specials: ScrapedSpecial[]; propertyData: Partial<ScrapedBuilding> }> {
  const specials: ScrapedSpecial[] = []
  const propertyData: Partial<ScrapedBuilding> = {
    name: community.name,
    listingUrl: community.websiteUrl || '',
    website: community.websiteUrl || null,
    city: 'Charlotte',
    state: 'NC',
  }

  if (!community.websiteUrl) {
    return { specials, propertyData }
  }

  try {
    await page.goto(community.websiteUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(2000)

    // Extract metadata and specials
    const pageData = await page.evaluate(() => {
      const result: {
        phone: string | null
        address: string | null
        officeHours: string | null
        leasingPortal: string | null
        virtualTour: string | null
        brochure: string | null
        specials: Array<{ title: string; description: string; rawHtml: string }>
        photos: string[]
        amenities: string[]
        lat: number | null
        lng: number | null
      } = {
        phone: null,
        address: null,
        officeHours: null,
        leasingPortal: null,
        virtualTour: null,
        brochure: null,
        specials: [],
        photos: [],
        amenities: [],
        lat: null,
        lng: null,
      }

      // Extract phone
      const phoneLink = document.querySelector('a[href^="tel:"]')
      if (phoneLink) {
        result.phone = phoneLink.getAttribute('href')?.replace('tel:', '') ||
                       phoneLink.textContent?.trim() || null
      }

      // Extract address
      const addressSelectors = ['.address', '[class*="address"]', 'address', '[itemtype*="PostalAddress"]']
      for (const sel of addressSelectors) {
        const el = document.querySelector(sel)
        if (el) {
          result.address = el.textContent?.trim().replace(/\s+/g, ' ') || null
          break
        }
      }

      // Fallback: look for text matching address pattern
      if (!result.address) {
        const allText = document.body.innerText
        const addrMatch = allText.match(/\d+\s+[\w\s]+(?:Drive|Street|Avenue|Road|Boulevard|Way|Lane|Circle),?\s*Charlotte,?\s*NC\s*\d{5}/i)
        if (addrMatch) result.address = addrMatch[0]
      }

      // Extract leasing portal URL
      const leasingLinks = document.querySelectorAll('a')
      for (const link of leasingLinks) {
        const href = link.getAttribute('href') || ''
        const text = link.textContent?.toLowerCase() || ''

        if (href.includes('onlineleasing.realpage.com') || text.includes('lease online') || text.includes('apply now')) {
          result.leasingPortal = href
          break
        }
      }

      // Extract virtual tour link
      const tourLinks = document.querySelectorAll('a[href*="virtual"], a[href*="tour"]')
      if (tourLinks.length > 0) {
        result.virtualTour = tourLinks[0].getAttribute('href')
      }

      // Extract brochure link
      const brochureLinks = document.querySelectorAll('a[href*="brochure"], a[href*="issuu"]')
      if (brochureLinks.length > 0) {
        result.brochure = brochureLinks[0].getAttribute('href')
      }

      // Extract specials/promos
      // Look for promotional sections - Crescent sites often have large promotional banners
      const promoSelectors = [
        '.promo', '.promotion', '.special', '.deal', '.offer',
        '[class*="promo"]', '[class*="special"]', '[class*="deal"]',
        'h1', 'h2', // Large headings often contain promo text
      ]

      for (const sel of promoSelectors) {
        const elements = document.querySelectorAll(sel)
        for (const el of elements) {
          const text = el.textContent?.trim() || ''

          // Check if it looks like a special/promo
          if (text.length > 20 && text.length < 500 &&
              text.match(/free|off|waiv|special|deal|save|gift\s*card|weeks?\s*free|months?\s*free/i)) {

            // Avoid duplicates
            const isDupe = result.specials.some(s =>
              s.description.includes(text.slice(0, 50)) || text.includes(s.description.slice(0, 50))
            )

            if (!isDupe) {
              result.specials.push({
                title: text.slice(0, 100) + (text.length > 100 ? '...' : ''),
                description: text,
                rawHtml: el.outerHTML,
              })
            }
          }
        }
      }

      // Extract photos
      const images = document.querySelectorAll('img[src*="hero"], img[src*="gallery"], img[src*="property"]')
      for (const img of images) {
        const src = img.getAttribute('src') || img.getAttribute('data-src')
        if (src && !src.includes('logo') && !src.includes('icon')) {
          result.photos.push(src)
        }
      }

      // Extract amenities
      const amenityEls = document.querySelectorAll('[class*="amenity"], [class*="feature"]')
      for (const el of amenityEls) {
        const text = el.textContent?.toLowerCase() || ''
        if (text.includes('pool')) result.amenities.push('pool')
        if (text.includes('gym') || text.includes('fitness')) result.amenities.push('gym')
        if (text.includes('parking') || text.includes('garage')) result.amenities.push('parking')
        if (text.includes('pet') || text.includes('dog')) result.amenities.push('pet-friendly')
        if (text.includes('laundry') || text.includes('washer')) result.amenities.push('in-unit-laundry')
        if (text.includes('roof')) result.amenities.push('rooftop')
        if (text.includes('concierge')) result.amenities.push('concierge')
      }

      // Try to get coordinates from JSON-LD
      const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]')
      for (const script of jsonLdScripts) {
        try {
          const data = JSON.parse(script.textContent || '')
          if (data.geo) {
            result.lat = parseFloat(data.geo.latitude)
            result.lng = parseFloat(data.geo.longitude)
          }
          if (data.address && !result.address) {
            result.address = [
              data.address.streetAddress,
              data.address.addressLocality,
              data.address.addressRegion,
              data.address.postalCode
            ].filter(Boolean).join(', ')
          }
        } catch {
          // Ignore parse errors
        }
      }

      return result
    })

    // Populate property data
    propertyData.phone = pageData.phone
    propertyData.address = pageData.address || ''
    propertyData.lat = pageData.lat || 0
    propertyData.lng = pageData.lng || 0
    propertyData.photos = pageData.photos
    propertyData.amenities = [...new Set(pageData.amenities)]
    propertyData.floorplansUrl = community.websiteUrl.replace(/\/$/, '') + community.floorPlansPath

    // Process specials
    for (const s of pageData.specials) {
      const discountType = parseDiscountType(s.description)
      const discountValue = parseDiscountValue(s.description, discountType)
      const endDate = parseSpecialEndDate(s.description)

      specials.push({
        title: s.title,
        description: s.description,
        discountType,
        discountValue,
        conditions: null,
        startDate: null,
        endDate,
        rawHtml: s.rawHtml,
        targetFloorPlanNames: null,
      })
    }

  } catch (error) {
    console.log(`  [crescent] Error scraping homepage for ${community.name}: ${error instanceof Error ? error.message : error}`)
  }

  return { specials, propertyData }
}

/**
 * Stage 3: Scrape floor plans page
 */
async function scrapeFloorPlans(
  page: Page,
  community: DiscoveredCommunity
): Promise<ScrapedFloorPlan[]> {
  const floorPlans: ScrapedFloorPlan[] = []

  if (!community.websiteUrl) return floorPlans

  const floorPlansUrl = community.websiteUrl.replace(/\/$/, '') + community.floorPlansPath

  try {
    await page.goto(floorPlansUrl, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(3000)

    // Extract floor plan data
    const fpData = await page.evaluate((platformType) => {
      const results: Array<{
        name: string | null
        beds: string
        baths: string
        sqft: string
        rent: string
        available: number
        image: string | null
        applyUrl: string | null
        pdfUrl: string | null
      }> = []

      // Different selectors based on platform
      const cardSelectors = platformType === 'crescent_cms'
        ? ['.floor-plan', '.floorplan', '[class*="floor-plan"]', '[class*="floorplan"]', 'article']
        : ['.floorplan', '.floor-plan', '[class*="floorplan"]', '.unit-card', 'article']

      let cards: Element[] = []
      for (const selector of cardSelectors) {
        const found = document.querySelectorAll(selector)
        if (found.length > 0) {
          cards = Array.from(found)
          break
        }
      }

      // Fallback: look for elements with bed/bath/price patterns
      if (cards.length === 0) {
        const allElements = document.querySelectorAll('div, article, section')
        for (const el of allElements) {
          const text = el.textContent || ''
          if ((text.match(/\d+\s*bed/i) || text.match(/studio/i)) &&
              text.match(/\$[\d,]+/) &&
              text.length < 2000) {
            const isParent = cards.some(c => el.contains(c))
            if (!isParent) cards.push(el)
          }
        }
      }

      for (const card of cards) {
        const text = card.textContent || ''

        // Skip if no pricing
        if (!text.match(/\$[\d,]+/)) continue

        // Parse bedroom count
        let beds = '1'
        if (text.toLowerCase().includes('studio')) {
          beds = '0'
        } else {
          const bedMatch = text.match(/(\d+)\s*(?:bed|br|bedroom)/i)
          if (bedMatch) beds = bedMatch[1]
        }

        // Parse bathroom count
        const bathMatch = text.match(/(\d+\.?\d*)\s*(?:bath|ba)/i)
        const baths = bathMatch ? bathMatch[1] : '1'

        // Parse sqft
        const sqftMatch = text.match(/(\d{3,4}(?:\s*[-–]\s*\d{3,4})?)\s*(?:sq|sf)/i)
        const sqft = sqftMatch ? sqftMatch[1] : ''

        // Parse rent
        const rentMatch = text.match(/(?:starting\s*at\s*)?\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?/i)
        const rent = rentMatch ? rentMatch[0] : ''

        // Extract name (plan code like S1, A1, B2, etc.)
        const nameEl = card.querySelector('h2, h3, h4, .name, [class*="name"], .title')
        let name = nameEl?.textContent?.trim() || null
        // Also look for plan codes in the text
        if (!name) {
          const codeMatch = text.match(/\b([A-Z]\d{1,2})\b/)
          if (codeMatch) name = codeMatch[1]
        }

        // Extract image
        const imgEl = card.querySelector('img')
        let image = imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src') || null

        // Extract apply URL
        const applyLink = card.querySelector('a[href*="apply"], a[href*="realpage"], a[href*="leasing"]')
        const applyUrl = applyLink?.getAttribute('href') || null

        // Extract PDF URL
        const pdfLink = card.querySelector('a[href*=".pdf"], a[href*="download"]')
        const pdfUrl = pdfLink?.getAttribute('href') || null

        // Count available units
        const availMatch = text.match(/(\d+)\s*(?:available|unit)/i)
        const available = availMatch ? parseInt(availMatch[1], 10) : 1

        if (rent) {
          results.push({ name, beds, baths, sqft, rent, available, image, applyUrl, pdfUrl })
        }
      }

      return results
    }, community.platformType)

    // Process floor plan data
    for (const fp of fpData) {
      const { min: sqftMin, max: sqftMax } = parseSqft(fp.sqft)
      const { min: rentMin, max: rentMax } = parseRent(fp.rent)

      // Use plan name to help infer bedroom count
      // Crescent uses: S=Studio, A=1BR, B=2BR, C=3BR
      const nameAndBeds = `${fp.name || ''} ${fp.beds}`

      floorPlans.push({
        name: fp.name,
        bedrooms: parseBedrooms(nameAndBeds),
        bathrooms: parseBathrooms(fp.baths),
        sqftMin,
        sqftMax,
        rentMin,
        rentMax,
        availableCount: fp.available,
        photoUrl: fp.image,
      })
    }

  } catch (error) {
    console.log(`  [crescent] Error scraping floor plans for ${community.name}: ${error instanceof Error ? error.message : error}`)
  }

  return floorPlans
}

/**
 * Main scrape function for Charlotte Crescent communities
 */
export async function scrapeCrescentCharlotte(): Promise<ScrapeResult> {
  const buildings: ScrapedBuilding[] = []
  const errors: string[] = []

  let browser: Browser | null = null

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const context = await browser.newContext({
      userAgent: 'MOVD-PRO-Bot/1.0 (apartment-locator-tool; contact@movdpro.com)',
      viewport: { width: 1280, height: 800 },
    })

    const page = await context.newPage()

    // Stage 0 & 1: Discover communities
    const communities = await discoverCommunities(page)

    // Process each community
    for (const community of communities) {
      console.log(`  [crescent] Scraping ${community.name} (${community.platformType})...`)

      try {
        // Stage 2: Scrape homepage
        const { specials, propertyData } = await scrapeCommunityHomepage(page, community)

        // Stage 3: Scrape floor plans
        const floorPlans = await scrapeFloorPlans(page, community)

        if (floorPlans.length === 0) {
          errors.push(`No floor plans found for ${community.name}`)
        }

        const building: ScrapedBuilding = {
          name: propertyData.name || community.name,
          address: propertyData.address || '',
          city: propertyData.city || 'Charlotte',
          state: propertyData.state || 'NC',
          zipCode: null,
          lat: propertyData.lat || 0,
          lng: propertyData.lng || 0,
          website: propertyData.website || null,
          phone: propertyData.phone || null,
          primaryPhotoUrl: propertyData.photos?.[0] || null,
          photos: propertyData.photos || [],
          amenities: propertyData.amenities || [],
          petPolicy: propertyData.amenities?.includes('pet-friendly') ? 'dogs-allowed' : null,
          parkingType: propertyData.amenities?.includes('parking') ? 'garage' : null,
          listingUrl: propertyData.listingUrl || community.websiteUrl || '',
          floorplansUrl: propertyData.floorplansUrl || null,
          yearBuilt: null,
          totalUnits: community.unitCount,
          floorPlans,
          specials,
        }

        buildings.push(building)
        console.log(`    Found ${floorPlans.length} floor plans, ${specials.length} specials`)

        // Rate limit between properties (2 seconds as per spec)
        await new Promise(r => setTimeout(r, 2000))

      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        errors.push(`Failed to scrape ${community.name}: ${message}`)
      }
    }

    await context.close()

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    errors.push(`Browser error: ${message}`)
  } finally {
    if (browser) {
      await browser.close()
    }
  }

  return {
    buildings,
    errors,
    scrapedAt: new Date(),
  }
}

// Fallback list of known properties
export const CHARLOTTE_CRESCENT_PROPERTIES = [
  'https://www.noveluniversityplace.com',
  'https://www.novelmallardcreek.com',
  'https://www.noveldavidson.com',
  'https://novelballantyne.com',
]

export default {
  name: 'Crescent Communities',
  slug: 'crescent',
  scrape: scrapeCrescentCharlotte,
}
