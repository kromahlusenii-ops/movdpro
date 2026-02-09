/**
 * MAA Scraper - Scrapes Charlotte apartment properties from MAA (Mid-America Apartment Communities)
 *
 * URL Pattern: https://www.maac.com/north-carolina/charlotte/maa-[apartment-name]/
 * Uses Playwright for JavaScript rendering since MAA loads floor plans dynamically
 */

import { chromium, Browser, Page } from 'playwright'
import { ScrapedBuilding, ScrapedFloorPlan, ScrapedSpecial, ScrapeResult, DiscountType } from './types'
import prisma from '@/lib/db'

// MAA Charlotte deals hub page
const MAA_CHARLOTTE_DEALS_HUB = 'https://www.maac.com/north-carolina/charlotte/'

// Fallback list if database has no URLs
export const CHARLOTTE_MAA_PROPERTIES = [
  'https://www.maac.com/north-carolina/charlotte/maa-ballantyne/',
  'https://www.maac.com/north-carolina/charlotte/maa-south-end/',
  'https://www.maac.com/north-carolina/charlotte/maa-gateway/',
  'https://www.maac.com/north-carolina/charlotte/maa-reserve/',
  'https://www.maac.com/north-carolina/charlotte/maa-plaza-midwood/',
]

/**
 * Get MAA property URLs from database
 */
async function getMAAUrls(): Promise<string[]> {
  try {
    const buildings = await prisma.building.findMany({
      where: {
        listingUrl: { not: null },
        management: { slug: 'maa' },
      },
      select: { listingUrl: true },
    })
    const urls = buildings.map((b) => b.listingUrl).filter((u): u is string => !!u)
    return urls.length > 0 ? urls : CHARLOTTE_MAA_PROPERTIES
  } catch {
    // Database not available, use fallback
    return CHARLOTTE_MAA_PROPERTIES
  }
}

/**
 * Parse bedroom count from text
 */
function parseBedrooms(text: string): number {
  const lower = text.toLowerCase()
  if (lower.includes('studio')) return 0
  const match = lower.match(/(\d+)\s*(?:bed|br|bedroom)/i)
  return match ? parseInt(match[1], 10) : 1
}

/**
 * Parse bathroom count from text
 */
function parseBathrooms(text: string): number {
  const match = text.match(/(\d+\.?\d*)\s*(?:bath|ba|bathroom)/i)
  return match ? parseFloat(match[1]) : 1
}

/**
 * Parse sqft from text
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
 * Parse rent from text
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
  if (lower.includes('off rent') || lower.includes('reduced') || lower.includes('$ off') || lower.includes('save $')) {
    return 'reduced_rent'
  }
  if (lower.includes('waived') || lower.includes('no fee') || lower.includes('free application') || lower.includes('no admin')) {
    return 'waived_fees'
  }
  if (lower.includes('gift card') || lower.includes('visa') || lower.includes('amazon')) {
    return 'gift_card'
  }
  if (lower.includes('look') && lower.includes('lease')) {
    return 'reduced_rent' // Look & Lease specials typically offer rent discounts
  }
  return 'other'
}

/**
 * Parse discount value from special text
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
  const datePatterns = [
    /(?:expires?|ends?|by|before|through|valid until)\s+(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i,
    /(?:expires?|ends?|by|before|through|valid until)\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:,?\s*(\d{4}))?/i,
    /move[- ]?in\s+(?:by|before)\s+(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i,
  ]

  for (const pattern of datePatterns) {
    const match = text.match(pattern)
    if (match) {
      try {
        const dateStr = match[1] + (match[2] ? ` ${match[2]}` : '') + (match[3] ? `, ${match[3]}` : `, ${new Date().getFullYear()}`)
        const parsed = new Date(dateStr)
        if (!isNaN(parsed.getTime())) return parsed
      } catch {
        continue
      }
    }
  }

  return null
}

/**
 * Scrape MAA deals hub page for all Charlotte specials
 */
async function scrapeMAADealsHub(page: Page): Promise<Map<string, ScrapedSpecial[]>> {
  const specialsByProperty = new Map<string, ScrapedSpecial[]>()

  try {
    await page.goto(MAA_CHARLOTTE_DEALS_HUB, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(2000)

    // Extract deals from the hub page
    const dealsData = await page.evaluate(() => {
      const results: Array<{
        propertyName: string
        propertyUrl: string | null
        title: string
        description: string
        rawHtml: string
      }> = []

      // Look for deal cards on the page
      const dealSelectors = [
        '.deal-card',
        '.special-card',
        '.offer-card',
        '[class*="deal"]',
        '[class*="special"]',
        '[class*="promo"]',
      ]

      for (const selector of dealSelectors) {
        const cards = document.querySelectorAll(selector)
        for (const card of cards) {
          const text = card.textContent?.trim() || ''
          const html = card.outerHTML || ''

          // Skip if too short or doesn't look like a special
          if (text.length < 10) continue
          if (!text.match(/free|off|waiv|special|deal|save|\$|look.*lease/i)) continue

          // Try to find the associated property
          const propertyLink = card.querySelector('a[href*="/north-carolina/charlotte/"]')
          const propertyUrl = propertyLink?.getAttribute('href') || null
          const propertyName = propertyLink?.textContent?.trim() ||
            card.querySelector('h2, h3, h4, .property-name')?.textContent?.trim() ||
            'Unknown Property'

          // Get title
          const titleEl = card.querySelector('h1, h2, h3, .title, .heading, strong')
          const title = titleEl?.textContent?.trim() || text.slice(0, 50) + (text.length > 50 ? '...' : '')

          results.push({
            propertyName,
            propertyUrl,
            title,
            description: text,
            rawHtml: html,
          })
        }
      }

      return results
    })

    // Group specials by property
    for (const deal of dealsData) {
      const discountType = parseDiscountType(deal.description)
      const discountValue = parseDiscountValue(deal.description, discountType)
      const endDate = parseSpecialEndDate(deal.description)

      const special: ScrapedSpecial = {
        title: deal.title,
        description: deal.description,
        discountType,
        discountValue,
        conditions: null,
        startDate: null,
        endDate,
        rawHtml: deal.rawHtml,
        targetFloorPlanNames: null,
      }

      const key = deal.propertyUrl || deal.propertyName
      if (!specialsByProperty.has(key)) {
        specialsByProperty.set(key, [])
      }
      specialsByProperty.get(key)!.push(special)
    }
  } catch (error) {
    console.error('Failed to scrape MAA deals hub:', error)
  }

  return specialsByProperty
}

/**
 * Scrape a single MAA property page using Playwright
 */
async function scrapeMAAProperty(
  page: Page,
  propertyUrl: string
): Promise<{ floorPlans: ScrapedFloorPlan[]; propertyData: Partial<ScrapedBuilding>; specials: ScrapedSpecial[] }> {
  const floorPlans: ScrapedFloorPlan[] = []
  const propertyData: Partial<ScrapedBuilding> = {
    listingUrl: propertyUrl,
  }

  // Navigate to the floor plans page
  const floorplansUrl = `${propertyUrl.replace(/\/$/, '')}/floor-plans/`
  await page.goto(floorplansUrl, { waitUntil: 'networkidle', timeout: 30000 })

  // Wait for floor plan cards to load
  await page.waitForTimeout(2000)

  // Wait specifically for PERQ popup elements to render (they load dynamically)
  try {
    await page.waitForSelector('.perq-top-special-offer-cta-outer-container, [class*="perq"], [class*="special-offer"]', {
      timeout: 5000,
    })
    console.log(`    [MAA] Found PERQ/special elements`)
  } catch {
    console.log(`    [MAA] No PERQ elements found after 5s wait`)
  }

  // Additional wait for any animations/transitions
  await page.waitForTimeout(1000)

  // Try to find floor plan cards using various selectors
  const floorPlanData = await page.evaluate(() => {
    const results: Array<{
      name: string | null
      beds: string
      baths: string
      sqft: string
      rent: string
      available: number
      image: string | null
    }> = []

    // MAA uses various class patterns for floor plan cards
    const cardSelectors = [
      '.floorplan-card',
      '.floor-plan-card',
      '.fp-card',
      '[class*="floorplan"]',
      '.unit-type-card',
      '.apartment-card',
    ]

    let cards: Element[] = []
    for (const selector of cardSelectors) {
      const found = document.querySelectorAll(selector)
      if (found.length > 0) {
        cards = Array.from(found)
        break
      }
    }

    // If no cards found, try finding by content patterns
    if (cards.length === 0) {
      // Look for any element containing bed/bath info with pricing
      const allElements = document.querySelectorAll('div, article, section, li')
      for (const el of allElements) {
        const text = el.textContent || ''
        if (
          (text.match(/\d+\s*bed/i) || text.match(/studio/i)) &&
          text.match(/\$[\d,]+/) &&
          text.length < 1000 // Avoid getting entire page sections
        ) {
          cards.push(el)
        }
      }
    }

    for (const card of cards) {
      const text = card.textContent || ''

      // Extract bedroom info
      let beds = '1'
      if (text.toLowerCase().includes('studio')) {
        beds = '0'
      } else {
        const bedMatch = text.match(/(\d+)\s*(?:bed|br|bedroom)/i)
        if (bedMatch) beds = bedMatch[1]
      }

      // Extract bathroom info
      const bathMatch = text.match(/(\d+\.?\d*)\s*(?:bath|ba)/i)
      const baths = bathMatch ? bathMatch[1] : '1'

      // Extract sqft
      const sqftMatch = text.match(/(\d{3,4}(?:\s*[-–]\s*\d{3,4})?)\s*(?:sq|sf)/i)
      const sqft = sqftMatch ? sqftMatch[1] : ''

      // Extract rent
      const rentMatch = text.match(/\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?/i)
      const rent = rentMatch ? rentMatch[0] : ''

      // Extract name
      const nameEl = card.querySelector('h2, h3, h4, .name, .title, [class*="name"]')
      const name = nameEl?.textContent?.trim() || null

      // Extract image
      const imgEl = card.querySelector('img')
      const image = imgEl?.src || imgEl?.getAttribute('data-src') || null

      // Count available units (look for availability indicator)
      const availMatch = text.match(/(\d+)\s*(?:available|unit)/i)
      const available = availMatch ? parseInt(availMatch[1], 10) : 1

      if (rent) {
        results.push({ name, beds, baths, sqft, rent, available, image })
      }
    }

    return results
  })

  // Process extracted floor plan data
  for (const fp of floorPlanData) {
    const { min: sqftMin, max: sqftMax } = parseSqft(fp.sqft)
    const { min: rentMin, max: rentMax } = parseRent(fp.rent)

    floorPlans.push({
      name: fp.name,
      bedrooms: parseInt(fp.beds, 10),
      bathrooms: parseFloat(fp.baths),
      sqftMin,
      sqftMax,
      rentMin,
      rentMax,
      availableCount: fp.available,
      photoUrl: fp.image,
    })
  }

  // Extract property metadata from the page
  const metadata = await page.evaluate(() => {
    const result: {
      name?: string
      address?: string
      city?: string
      state?: string
      zipCode?: string
      lat?: number
      lng?: number
      phone?: string
      primaryPhotoUrl?: string
      amenities: string[]
    } = { amenities: [] }

    // Get property name from title or h1
    const title = document.querySelector('title')?.textContent || ''
    result.name = title
      .replace(/\s*\|.*$/, '')
      .replace(/Apartments.*$/i, '')
      .replace(/MAA\s*/i, '')
      .replace(/Floor Plans.*$/i, '')
      .trim()

    // Try to extract from JSON-LD
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]')
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse(script.textContent || '')
        if (data['@type'] === 'ApartmentComplex' || data['@type'] === 'LocalBusiness') {
          if (data.address) {
            result.address = data.address.streetAddress
            result.city = data.address.addressLocality
            result.state = data.address.addressRegion
            result.zipCode = data.address.postalCode
          }
          if (data.geo) {
            result.lat = parseFloat(data.geo.latitude)
            result.lng = parseFloat(data.geo.longitude)
          }
          if (data.telephone) result.phone = data.telephone
          if (data.image) {
            result.primaryPhotoUrl = Array.isArray(data.image) ? data.image[0] : data.image
          }
        }
      } catch {
        // Ignore parse errors
      }
    }

    // Extract amenities
    const amenityElements = document.querySelectorAll('[class*="amenity"], [class*="feature"]')
    for (const el of amenityElements) {
      const text = el.textContent?.toLowerCase() || ''
      if (text.includes('pool')) result.amenities.push('pool')
      if (text.includes('gym') || text.includes('fitness')) result.amenities.push('gym')
      if (text.includes('parking') || text.includes('garage')) result.amenities.push('parking')
      if (text.includes('pet') || text.includes('dog')) result.amenities.push('pet-friendly')
      if (text.includes('laundry') || text.includes('washer')) result.amenities.push('in-unit-laundry')
    }
    result.amenities = [...new Set(result.amenities)]

    return result
  })

  propertyData.name = metadata.name
  propertyData.address = metadata.address
  propertyData.city = metadata.city
  propertyData.state = metadata.state
  propertyData.zipCode = metadata.zipCode
  propertyData.lat = metadata.lat
  propertyData.lng = metadata.lng
  propertyData.phone = metadata.phone
  propertyData.primaryPhotoUrl = metadata.primaryPhotoUrl
  propertyData.amenities = metadata.amenities

  // Debug: check for PERQ elements
  const perqDebug = await page.evaluate(() => {
    const perqContainer = document.querySelector('.perq-top-special-offer-cta-outer-container')
    const allPerq = document.querySelectorAll('[class*="perq"]')
    return {
      hasPerqContainer: !!perqContainer,
      perqCount: allPerq.length,
      perqClasses: Array.from(allPerq).slice(0, 3).map(el => el.className),
    }
  })
  console.log(`    [MAA] PERQ check: container=${perqDebug.hasPerqContainer}, perq elements=${perqDebug.perqCount}`)
  if (perqDebug.perqClasses.length > 0) {
    console.log(`    [MAA] PERQ classes found: ${perqDebug.perqClasses.join(', ')}`)
  }

  // Extract specials from the property page
  const specialsData = await page.evaluate(() => {
    const results: Array<{
      title: string
      description: string
      rawHtml: string
      targetFloorPlans: string[] | null
    }> = []

    // MAA uses PERQ for specials - look for this specific container first
    const specialSelectors = [
      '.perq-top-special-offer-cta-outer-container',
      '.perq-special-offer',
      '[class*="perq"]',
      '.special-banner',
      '.promo-banner',
      '.deal-section',
      '[class*="special"]',
      '[class*="promo"]',
      '[class*="offer"]',
      '.look-lease', // MAA's common "Look & Lease" specials
      '[class*="incentive"]',
    ]

    for (const selector of specialSelectors) {
      const elements = document.querySelectorAll(selector)
      for (const el of elements) {
        const text = el.textContent?.trim() || ''
        const html = el.outerHTML || ''

        if (text.length < 10) continue
        if (!text.match(/free|off|waiv|special|deal|save|\$|look.*lease|concession|move.?in/i)) continue

        const titleEl = el.querySelector('h1, h2, h3, h4, .title, strong, .perq-special-offer-title')
        const title = titleEl?.textContent?.trim() || text.slice(0, 50) + (text.length > 50 ? '...' : '')

        // Check for floor plan mentions
        let targetFloorPlans: string[] | null = null
        const fpMentions = text.match(/(\d+)\s*(?:bed|br|bedroom)/gi) || text.match(/studio/gi)
        if (fpMentions) {
          targetFloorPlans = fpMentions.map(fp => fp.toLowerCase())
        }

        results.push({ title, description: text, rawHtml: html, targetFloorPlans })
      }
    }

    // Deduplicate
    const seen = new Set<string>()
    return results.filter(r => {
      if (seen.has(r.description)) return false
      seen.add(r.description)
      return true
    })
  })

  const specials: ScrapedSpecial[] = specialsData.map(s => {
    const discountType = parseDiscountType(s.description)
    const discountValue = parseDiscountValue(s.description, discountType)
    const endDate = parseSpecialEndDate(s.description)

    return {
      title: s.title,
      description: s.description,
      discountType,
      discountValue,
      conditions: null,
      startDate: null,
      endDate,
      rawHtml: s.rawHtml,
      targetFloorPlanNames: s.targetFloorPlans,
    }
  })

  console.log(`    [MAA] Found ${specials.length} specials on property page`)

  return { floorPlans, propertyData, specials }
}

/**
 * Scrape all Charlotte MAA properties
 */
export async function scrapeMAACHarlotte(): Promise<ScrapeResult> {
  const buildings: ScrapedBuilding[] = []
  const errors: string[] = []

  // Get URLs from database
  const propertyUrls = await getMAAUrls()
  console.log(`  Found ${propertyUrls.length} MAA properties to scrape`)

  // Launch browser
  let browser: Browser | null = null
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
    })

    const page = await context.newPage()

    // First, scrape the deals hub to get specials for all properties
    console.log('Scraping MAA deals hub...')
    const dealsHubSpecials = await scrapeMAADealsHub(page)
    console.log(`  Found specials for ${dealsHubSpecials.size} properties from deals hub`)

    for (const propertyUrl of propertyUrls) {
      try {
        console.log(`Scraping MAA: ${propertyUrl}...`)
        const { floorPlans, propertyData, specials: propertySpecials } = await scrapeMAAProperty(page, propertyUrl)

        if (floorPlans.length === 0) {
          errors.push(`No floor plans found for ${propertyUrl}`)
          continue
        }

        // Merge specials from property page and deals hub
        const hubSpecials = dealsHubSpecials.get(propertyUrl) || []
        const allSpecials = [...propertySpecials]

        // Add hub specials that aren't duplicates
        for (const hubSpecial of hubSpecials) {
          const isDupe = allSpecials.some(s =>
            s.description === hubSpecial.description ||
            s.title === hubSpecial.title
          )
          if (!isDupe) {
            allSpecials.push(hubSpecial)
          }
        }

        const building: ScrapedBuilding = {
          name: propertyData.name || new URL(propertyUrl).pathname.split('/').filter(Boolean).pop() || 'Unknown',
          address: propertyData.address || '',
          city: propertyData.city || 'Charlotte',
          state: propertyData.state || 'NC',
          zipCode: propertyData.zipCode || null,
          lat: propertyData.lat || 0,
          lng: propertyData.lng || 0,
          website: propertyUrl,
          phone: propertyData.phone || null,
          primaryPhotoUrl: propertyData.primaryPhotoUrl || null,
          photos: [],
          amenities: propertyData.amenities || [],
          petPolicy: propertyData.amenities?.includes('pet-friendly') ? 'dogs-allowed' : null,
          parkingType: propertyData.amenities?.includes('parking') ? 'garage' : null,
          listingUrl: propertyUrl,
          floorplansUrl: `${propertyUrl.replace(/\/$/, '')}/floor-plans/`,
          yearBuilt: null,
          totalUnits: null,
          floorPlans,
          specials: allSpecials,
        }

        buildings.push(building)
        console.log(`    Found ${floorPlans.length} floor plans, ${allSpecials.length} specials`)

        // Rate limit between properties
        await new Promise((resolve) => setTimeout(resolve, 2000))
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        errors.push(`Failed to scrape ${propertyUrl}: ${message}`)
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

export default {
  name: 'MAA',
  slug: 'maa',
  scrape: scrapeMAACHarlotte,
}
