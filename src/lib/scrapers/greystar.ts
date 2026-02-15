/**
 * Greystar Scraper - Scrapes Charlotte apartment properties from Greystar/Jonah Digital
 *
 * Strategy:
 * 1. Fetch Greystar property URLs from the database
 * 2. Use Playwright to load each property's /floorplans/ page
 * 3. Extract floor plans, pricing, availability from the rendered page
 */

import { chromium, Browser, Page } from 'playwright'
import { ScrapedBuilding, ScrapedFloorPlan, ScrapedSpecial, ScrapeResult, DiscountType } from './types'
import prisma from '@/lib/db'

// Fallback list if database has no URLs
export const CHARLOTTE_GREYSTAR_PROPERTIES = [
  'https://www.thenovasouthend.com',
  'https://www.camdenrailyardsouthend.com',
  'https://www.avalonmeyerspark.com',
  'https://www.hawthornegatewaynoda.com',
  'https://www.thelincolnatsouthend.com',
]

/**
 * Get Greystar property URLs from database
 */
async function getGreystarUrls(): Promise<string[]> {
  try {
    const buildings = await prisma.building.findMany({
      where: {
        listingUrl: { not: null },
        management: { slug: 'greystar' },
      },
      select: { listingUrl: true },
    })
    const urls = buildings.map((b) => b.listingUrl).filter((u): u is string => !!u)
    return urls.length > 0 ? urls : CHARLOTTE_GREYSTAR_PROPERTIES
  } catch {
    // Database not available, use fallback
    return CHARLOTTE_GREYSTAR_PROPERTIES
  }
}

/**
 * Parse bedroom count from various formats
 */
function parseBedrooms(beds: number | string): number {
  if (typeof beds === 'number') return beds
  const str = String(beds).toLowerCase()
  if (str.includes('studio')) return 0
  const match = str.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : 1
}

/**
 * Parse bathroom count from various formats
 */
function parseBathrooms(baths: number | string): number {
  if (typeof baths === 'number') return baths
  const match = String(baths).match(/(\d+\.?\d*)/)
  return match ? parseFloat(match[1]) : 1
}

/**
 * Parse sqft range from string like "650 - 850" or "720"
 */
function parseSqft(sqft: string | number): { min: number | null; max: number | null } {
  if (typeof sqft === 'number') return { min: sqft, max: sqft }
  const str = String(sqft).replace(/,/g, '')
  const rangeMatch = str.match(/(\d+)\s*[-–]\s*(\d+)/)
  if (rangeMatch) {
    return { min: parseInt(rangeMatch[1], 10), max: parseInt(rangeMatch[2], 10) }
  }
  const singleMatch = str.match(/(\d+)/)
  if (singleMatch) {
    const val = parseInt(singleMatch[1], 10)
    return { min: val, max: val }
  }
  return { min: null, max: null }
}

/**
 * Parse rent range from string like "$1,500 - $1,800" or "$1,650"
 */
function parseRent(rent: string | number): { min: number; max: number } {
  if (typeof rent === 'number') return { min: rent, max: rent }
  const str = String(rent).replace(/[$,]/g, '')
  const rangeMatch = str.match(/(\d+)\s*[-–]\s*(\d+)/)
  if (rangeMatch) {
    return { min: parseInt(rangeMatch[1], 10), max: parseInt(rangeMatch[2], 10) }
  }
  const singleMatch = str.match(/(\d+)/)
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
  if (lower.includes('waived') || lower.includes('no fee') || lower.includes('free application') || lower.includes('no admin')) {
    return 'waived_fees'
  }
  if (lower.includes('gift card') || lower.includes('visa') || lower.includes('amazon')) {
    return 'gift_card'
  }
  return 'other'
}

/**
 * Parse discount value from special text
 */
function parseDiscountValue(text: string, discountType: DiscountType | null): number | null {
  if (!discountType) return null

  if (discountType === 'months_free') {
    // Look for "1 month", "2 months", "6 weeks" etc.
    const monthMatch = text.match(/(\d+)\s*months?\s*free/i)
    if (monthMatch) return parseFloat(monthMatch[1])
    const weekMatch = text.match(/(\d+)\s*weeks?\s*free/i)
    if (weekMatch) return parseFloat(weekMatch[1]) / 4 // Convert weeks to months
  }

  if (discountType === 'reduced_rent' || discountType === 'gift_card' || discountType === 'waived_fees') {
    // Look for dollar amounts
    const dollarMatch = text.match(/\$[\s]*([\d,]+)/i)
    if (dollarMatch) return parseFloat(dollarMatch[1].replace(/,/g, ''))
  }

  return null
}

/**
 * Parse end date from special text
 */
function parseSpecialEndDate(text: string): Date | null {
  // Look for patterns like "expires 3/31", "ends March 31", "by March 31, 2024"
  const datePatterns = [
    /(?:expires?|ends?|by|before|through)\s+(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i,
    /(?:expires?|ends?|by|before|through)\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:,?\s*(\d{4}))?/i,
  ]

  for (const pattern of datePatterns) {
    const match = text.match(pattern)
    if (match) {
      try {
        const dateStr = match[1] + (match[2] ? ` ${match[2]}` : '') + (match[3] ? `, ${match[3]}` : `, ${new Date().getFullYear()}`)
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
 * Scrape a single Greystar property using Playwright
 */
async function scrapeGreystarProperty(
  page: Page,
  propertyUrl: string
): Promise<{ floorPlans: ScrapedFloorPlan[]; propertyData: Partial<ScrapedBuilding>; specials: ScrapedSpecial[] }> {
  const floorPlans: ScrapedFloorPlan[] = []
  // Keep the full URL including www if present
  const baseUrl = propertyUrl.replace(/\/$/, '')

  // Try different floor plans URL formats (some sites use /floorplans, others use /floor-plans)
  const floorplansPaths = ['/floorplans/', '/floor-plans/', '/floorplans', '/floor-plans']
  let floorplansUrl = `${baseUrl}/floorplans/`
  let navigated = false

  const propertyData: Partial<ScrapedBuilding> = {
    listingUrl: propertyUrl,
  }

  // Try each floor plans URL format until one works
  for (const path of floorplansPaths) {
    const tryUrl = `${baseUrl}${path}`
    try {
      const response = await page.goto(tryUrl, { waitUntil: 'networkidle', timeout: 30000 })
      // Check if we got a valid page (not 404)
      if (response && response.status() < 400) {
        floorplansUrl = tryUrl
        navigated = true
        break
      }
    } catch {
      // Try next URL format
      continue
    }
  }

  if (!navigated) {
    // Fall back to first option if all failed
    await page.goto(`${baseUrl}/floorplans/`, { waitUntil: 'networkidle', timeout: 30000 })
  }

  propertyData.floorplansUrl = floorplansUrl

  // Wait for floor plan content to load
  await page.waitForTimeout(3000)

  // Extract floor plan data from the rendered page
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

    // Greystar/Jonah Digital uses various selectors
    const cardSelectors = [
      '[data-jd-fp-selector]',
      '.fp-card',
      '.floorplan-card',
      '.floor-plan-card',
      '[class*="floorplan"]',
      '.unit-card',
    ]

    let cards: Element[] = []
    for (const selector of cardSelectors) {
      const found = document.querySelectorAll(selector)
      if (found.length > 0) {
        cards = Array.from(found)
        break
      }
    }

    // If no specific cards found, try to find elements with bed/bath/price patterns
    if (cards.length === 0) {
      const allElements = document.querySelectorAll('div, article, section')
      for (const el of allElements) {
        const text = el.textContent || ''
        const classList = el.className || ''
        // Look for elements that seem like floor plan cards
        if (
          (text.match(/\d+\s*bed/i) || text.match(/studio/i)) &&
          text.match(/\$[\d,]+/) &&
          text.length < 2000 &&
          !classList.includes('header') &&
          !classList.includes('footer')
        ) {
          // Check if this element isn't a parent of an already-found element
          const isParent = cards.some((c) => el.contains(c))
          if (!isParent) {
            cards.push(el)
          }
        }
      }
    }

    for (const card of cards) {
      const text = card.textContent || ''

      // Skip if no pricing info
      if (!text.match(/\$[\d,]+/)) continue

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
      const nameEl = card.querySelector('.fp-name, .floorplan-name, h3, h4, .title, [class*="name"]')
      const name = nameEl?.textContent?.trim() || null

      // Extract image
      const imgEl = card.querySelector('img[src*="floorplan"], img[src*="floor-plan"], img.fp-image, img')
      const image = imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src') || null

      // Count available units - match "X available" or "X units available", but not "Unit X"
      // Cap at 50 to avoid picking up building-wide totals
      const availMatch = text.match(/(\d+)\s*(?:units?\s+)?available/i)
      const rawAvailable = availMatch ? parseInt(availMatch[1], 10) : 1
      const available = Math.min(rawAvailable, 50)

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
      bedrooms: parseBedrooms(fp.beds),
      bathrooms: parseBathrooms(fp.baths),
      sqftMin,
      sqftMax,
      rentMin,
      rentMax,
      availableCount: fp.available,
      photoUrl: fp.image,
    })
  }

  // Extract property metadata
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
      photos: string[]
      amenities: string[]
    } = { photos: [], amenities: [] }

    // Get property name from title
    const title = document.querySelector('title')?.textContent || ''
    result.name = title
      .replace(/\s*\|.*$/, '')
      .replace(/Apartments.*$/i, '')
      .replace(/Floor Plans.*$/i, '')
      .trim()

    // Try JSON-LD structured data
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]')
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse(script.textContent || '')
        if (data['@type'] === 'ApartmentComplex' || data['@type'] === 'Residence') {
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

    // Look for address in common patterns
    const addressEl = document.querySelector('[class*="address"], .property-address')
    if (addressEl && !result.address) {
      result.address = addressEl.textContent?.trim()
    }

    // Look for phone number
    const phoneLink = document.querySelector('a[href^="tel:"]')
    if (phoneLink && !result.phone) {
      result.phone = phoneLink.getAttribute('href')?.replace('tel:', '')
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
      if (text.includes('roof')) result.amenities.push('rooftop')
      if (text.includes('concierge')) result.amenities.push('concierge')
    }
    result.amenities = [...new Set(result.amenities)]

    // Extract photos
    const images = document.querySelectorAll('img[src*="gallery"], img[src*="photo"], img[src*="hero"]')
    for (const img of images) {
      const src = img.getAttribute('src')
      if (src && !src.includes('logo') && !src.includes('icon')) {
        result.photos.push(src)
      }
    }

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
  propertyData.photos = metadata.photos
  propertyData.amenities = metadata.amenities

  // Extract specials from popdown
  const specialsData = await page.evaluate(() => {
    const results: Array<{
      title: string
      description: string
      rawHtml: string
      targetFloorPlans: string[] | null
    }> = []

    // Look for popdown/promotional elements
    const popdownSelectors = [
      '.popdown',
      '.pop-down',
      '#popdown',
      '[class*="promo"]',
      '[class*="special"]',
      '.offer-banner',
      '.deal-banner',
      '.incentive',
    ]

    for (const selector of popdownSelectors) {
      const elements = document.querySelectorAll(selector)
      for (const el of elements) {
        const text = el.textContent?.trim() || ''
        const html = el.outerHTML || ''

        // Skip if too short or doesn't look like a special
        if (text.length < 10) continue
        if (!text.match(/free|off|waiv|special|deal|save|\$/i)) continue

        // Try to extract a title
        const titleEl = el.querySelector('h1, h2, h3, h4, .title, .heading, strong')
        const title = titleEl?.textContent?.trim() || text.slice(0, 50) + (text.length > 50 ? '...' : '')

        // Check if the special mentions specific floor plans
        let targetFloorPlans: string[] | null = null
        const fpMentions = text.match(/(\d+)\s*(?:bed|br|bedroom)/gi) || text.match(/studio/gi)
        if (fpMentions) {
          targetFloorPlans = fpMentions.map(fp => fp.toLowerCase())
        }

        results.push({
          title,
          description: text,
          rawHtml: html,
          targetFloorPlans,
        })
      }
    }

    // Deduplicate by description
    const seen = new Set<string>()
    return results.filter(r => {
      if (seen.has(r.description)) return false
      seen.add(r.description)
      return true
    })
  })

  // Process scraped specials
  const specials: ScrapedSpecial[] = specialsData.map(s => {
    const discountType = parseDiscountType(s.description)
    const discountValue = parseDiscountValue(s.description, discountType)
    const endDate = parseSpecialEndDate(s.description)

    return {
      title: s.title,
      description: s.description,
      discountType,
      discountValue,
      conditions: null, // Could add more parsing here
      startDate: null,
      endDate,
      rawHtml: s.rawHtml,
      targetFloorPlanNames: s.targetFloorPlans,
    }
  })

  return { floorPlans, propertyData, specials }
}

/**
 * Scrape all Charlotte Greystar properties
 */
export async function scrapeGreystarCharlotte(): Promise<ScrapeResult> {
  const buildings: ScrapedBuilding[] = []
  const errors: string[] = []

  // Get URLs from database
  const propertyUrls = await getGreystarUrls()
  console.log(`  Found ${propertyUrls.length} Greystar properties to scrape`)

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

    for (const propertyUrl of propertyUrls) {
      try {
        console.log(`Scraping Greystar: ${propertyUrl}...`)
        const { floorPlans, propertyData, specials } = await scrapeGreystarProperty(page, propertyUrl)

        if (floorPlans.length === 0) {
          errors.push(`No floor plans found for ${propertyUrl}`)
          continue
        }

        const building: ScrapedBuilding = {
          name: propertyData.name || new URL(propertyUrl).hostname.replace(/^www\./, ''),
          address: propertyData.address || '',
          city: propertyData.city || 'Charlotte',
          state: propertyData.state || 'NC',
          zipCode: propertyData.zipCode || null,
          lat: propertyData.lat || 0,
          lng: propertyData.lng || 0,
          website: propertyUrl,
          phone: propertyData.phone || null,
          primaryPhotoUrl: propertyData.primaryPhotoUrl || null,
          photos: propertyData.photos || [],
          amenities: propertyData.amenities || [],
          petPolicy: propertyData.amenities?.includes('pet-friendly') ? 'dogs-allowed' : null,
          parkingType: propertyData.amenities?.includes('parking') ? 'garage' : null,
          listingUrl: propertyData.listingUrl || propertyUrl,
          floorplansUrl: propertyData.floorplansUrl || null,
          yearBuilt: null,
          totalUnits: null,
          floorPlans,
          specials,
        }

        buildings.push(building)
        console.log(`    Found ${floorPlans.length} floor plans, ${specials.length} specials`)

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
  name: 'Greystar',
  slug: 'greystar',
  scrape: scrapeGreystarCharlotte,
}
