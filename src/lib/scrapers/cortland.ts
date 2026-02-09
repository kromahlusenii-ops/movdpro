/**
 * Cortland Scraper - Scrapes Charlotte apartment properties from Cortland
 *
 * URL Patterns:
 * - Property page: https://cortland.com/apartments/[apartment-name]/
 * - Available units: https://cortland.com/apartments/[apartment-name]/available-apartments/
 * - Floorplans: https://cortland.com/apartments/[apartment-name]/floorplans/
 *
 * Uses Playwright for JavaScript rendering since Cortland loads specials/popups dynamically
 */

import { chromium, Browser, Page } from 'playwright'
import { ScrapedBuilding, ScrapedFloorPlan, ScrapedSpecial, ScrapeResult, DiscountType } from './types'
import prisma from '@/lib/db'

// Fallback list if database has no URLs
export const CHARLOTTE_CORTLAND_PROPERTIES = [
  'https://cortland.com/apartments/cortland-southpark/',
  'https://cortland.com/apartments/cortland-noda/',
  'https://cortland.com/apartments/cortland-plaza-midwood/',
  'https://cortland.com/apartments/cortland-university/',
  'https://cortland.com/apartments/cortland-midtown/',
  'https://cortland.com/apartments/cortland-ballantyne/',
  'https://cortland.com/apartments/cortland-dilworth/',
]

/**
 * Get Cortland property URLs from database
 */
async function getCortlandUrls(): Promise<string[]> {
  try {
    const buildings = await prisma.building.findMany({
      where: {
        listingUrl: { not: null },
        management: { slug: 'cortland' },
      },
      select: { listingUrl: true },
    })
    const urls = buildings.map((b) => b.listingUrl).filter((u): u is string => !!u)
    return urls.length > 0 ? urls : CHARLOTTE_CORTLAND_PROPERTIES
  } catch {
    // Database not available, use fallback
    return CHARLOTTE_CORTLAND_PROPERTIES
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
 * Extract content from a specific div class, handling nested content
 */
function extractDivContent(html: string, className: string): string[] {
  const results: string[] = []
  // Find the start of divs with this class
  const pattern = new RegExp(`<div[^>]*class="[^"]*${className}[^"]*"[^>]*>`, 'gi')
  let match

  while ((match = pattern.exec(html)) !== null) {
    const startIndex = match.index
    let depth = 1
    let endIndex = startIndex + match[0].length

    // Find matching closing div by tracking depth
    while (depth > 0 && endIndex < html.length) {
      const openDiv = html.indexOf('<div', endIndex)
      const closeDiv = html.indexOf('</div>', endIndex)

      if (closeDiv === -1) break

      if (openDiv !== -1 && openDiv < closeDiv) {
        depth++
        endIndex = openDiv + 4
      } else {
        depth--
        endIndex = closeDiv + 6
      }
    }

    if (depth === 0) {
      results.push(html.slice(startIndex, endIndex))
    }
  }

  return results
}

/**
 * Scrape specials from Cortland property page HTML
 */
function scrapeSpecialsFromHtml(html: string): ScrapedSpecial[] {
  const specials: ScrapedSpecial[] = []
  const seen = new Set<string>()

  // First, try to find popdown__container specifically (Cortland's main special container)
  const popdownContainers = extractDivContent(html, 'popdown__container')

  for (const rawHtml of popdownContainers) {
    // Strip HTML tags to get text content
    const text = rawHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

    if (text.length < 10) continue
    if (seen.has(text)) continue
    seen.add(text)

    // Extract title
    const titleMatch = rawHtml.match(/<h[1-4][^>]*>([^<]+)/i) ||
      rawHtml.match(/class="[^"]*popdown__title[^"]*"[^>]*>([^<]+)/i) ||
      rawHtml.match(/class="[^"]*title[^"]*"[^>]*>([^<]+)/i) ||
      rawHtml.match(/<strong[^>]*>([^<]+)/i)
    const title = titleMatch
      ? titleMatch[1].trim()
      : text.slice(0, 50) + (text.length > 50 ? '...' : '')

    // Check for floor plan mentions
    let targetFloorPlanNames: string[] | null = null
    const fpMentions = text.match(/(\d+)\s*(?:bed|br|bedroom)/gi) || text.match(/studio/gi)
    if (fpMentions) {
      targetFloorPlanNames = fpMentions.map(fp => fp.toLowerCase())
    }

    const discountType = parseDiscountType(text)
    const discountValue = parseDiscountValue(text, discountType)
    const endDate = parseSpecialEndDate(text)

    specials.push({
      title,
      description: text,
      discountType,
      discountValue,
      conditions: null,
      startDate: null,
      endDate,
      rawHtml,
      targetFloorPlanNames,
    })
  }

  // If no popdown containers found, fall back to other patterns
  if (specials.length === 0) {
    const fallbackPatterns = [
      /<div[^>]*class="[^"]*promo[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
      /<div[^>]*class="[^"]*special[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
      /<div[^>]*class="[^"]*offer[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    ]

    for (const pattern of fallbackPatterns) {
      const matches = html.matchAll(pattern)
      for (const match of matches) {
        const rawHtml = match[0]
        const text = rawHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

        if (text.length < 10) continue
        if (!text.match(/free|off|waiv|special|deal|save|\$/i)) continue
        if (seen.has(text)) continue
        seen.add(text)

        const titleMatch = rawHtml.match(/<h[1-4][^>]*>([^<]+)/i) ||
          rawHtml.match(/<strong[^>]*>([^<]+)/i)
        const title = titleMatch
          ? titleMatch[1].trim()
          : text.slice(0, 50) + (text.length > 50 ? '...' : '')

        let targetFloorPlanNames: string[] | null = null
        const fpMentions = text.match(/(\d+)\s*(?:bed|br|bedroom)/gi) || text.match(/studio/gi)
        if (fpMentions) {
          targetFloorPlanNames = fpMentions.map(fp => fp.toLowerCase())
        }

        const discountType = parseDiscountType(text)
        const discountValue = parseDiscountValue(text, discountType)
        const endDate = parseSpecialEndDate(text)

        specials.push({
          title,
          description: text,
          discountType,
          discountValue,
          conditions: null,
          startDate: null,
          endDate,
          rawHtml,
          targetFloorPlanNames,
        })
      }
    }
  }

  return specials
}

/**
 * Scrape Cortland floorplans page using Playwright
 */
async function scrapeCortlandFloorplans(
  page: Page,
  baseUrl: string
): Promise<{ floorPlans: ScrapedFloorPlan[]; errors: string[] }> {
  const floorplansUrl = `${baseUrl.replace(/\/$/, '')}/floorplans/`
  const floorPlans: ScrapedFloorPlan[] = []
  const errors: string[] = []

  try {
    await page.goto(floorplansUrl, { waitUntil: 'networkidle', timeout: 30000 })

    // Wait for floor plan content to load
    await page.waitForTimeout(2000)

    // Try to wait for specific floor plan elements
    try {
      await page.waitForSelector('[class*="floorplan"], [class*="floor-plan"], .unit-card', { timeout: 5000 })
    } catch {
      // Element might already be there or page structure is different
    }

    const html = await page.content()

    // Look for JSON data embedded in the page
    const jsonPatterns = [
      /window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});/,
      /"floorplans"\s*:\s*(\[[\s\S]*?\])/,
      /data-floorplans=['"]([\s\S]*?)['"]/i,
    ]

    for (const pattern of jsonPatterns) {
      const match = html.match(pattern)
      if (match) {
        try {
          let jsonStr = match[1]
          // Handle HTML entity encoded JSON
          jsonStr = jsonStr
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&#39;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')

          const data = JSON.parse(jsonStr)
          const fpArray = Array.isArray(data) ? data : data.floorplans || []

          for (const fp of fpArray) {
            floorPlans.push({
              name: fp.name || fp.title || fp.floorplanName || null,
              bedrooms: typeof fp.beds === 'number' ? fp.beds : parseBedrooms(String(fp.beds || fp.bedrooms || '1')),
              bathrooms:
                typeof fp.baths === 'number' ? fp.baths : parseBathrooms(String(fp.baths || fp.bathrooms || '1')),
              sqftMin: fp.sqftMin || fp.minSqft || fp.sqft || null,
              sqftMax: fp.sqftMax || fp.maxSqft || fp.sqft || null,
              rentMin: fp.rentMin || fp.minRent || fp.rent || 0,
              rentMax: fp.rentMax || fp.maxRent || fp.rent || 0,
              availableCount: fp.availableCount || fp.available || fp.unitCount || 1,
              photoUrl: fp.image || fp.floorplanImage || fp.imageUrl || null,
            })
          }
          break
        } catch {
          // JSON parse failed, try next pattern
        }
      }
    }

    // Playwright evaluate fallback - scrape from rendered DOM
    if (floorPlans.length === 0) {
      const fpData = await page.evaluate(() => {
        const results: Array<{
          name: string | null
          beds: string
          baths: string
          sqft: string
          rent: string
          available: number
          image: string | null
        }> = []

        const cardSelectors = [
          '.floorplan-card',
          '.floor-plan-card',
          '[class*="floorplan"]',
          '[class*="floor-plan"]',
          '.unit-card',
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

        // Fallback: find by content patterns
        if (cards.length === 0) {
          const allElements = document.querySelectorAll('div, article, section, li')
          for (const el of allElements) {
            const text = el.textContent || ''
            if (
              (text.match(/\d+\s*bed/i) || text.match(/studio/i)) &&
              text.match(/\$[\d,]+/) &&
              text.length < 1000
            ) {
              cards.push(el)
            }
          }
        }

        for (const card of cards) {
          const text = card.textContent || ''

          let beds = '1'
          if (text.toLowerCase().includes('studio')) {
            beds = '0'
          } else {
            const bedMatch = text.match(/(\d+)\s*(?:bed|br|bedroom)/i)
            if (bedMatch) beds = bedMatch[1]
          }

          const bathMatch = text.match(/(\d+\.?\d*)\s*(?:bath|ba)/i)
          const baths = bathMatch ? bathMatch[1] : '1'

          const sqftMatch = text.match(/(\d{3,4}(?:\s*[-–]\s*\d{3,4})?)\s*(?:sq|sf)/i)
          const sqft = sqftMatch ? sqftMatch[1] : ''

          const rentMatch = text.match(/\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?/i)
          const rent = rentMatch ? rentMatch[0] : ''

          const nameEl = card.querySelector('h2, h3, h4, .name, .title, [class*="name"]')
          const name = nameEl?.textContent?.trim() || null

          const imgEl = card.querySelector('img')
          const image = imgEl?.src || imgEl?.getAttribute('data-src') || null

          const availMatch = text.match(/(\d+)\s*(?:available|unit)/i)
          const available = availMatch ? parseInt(availMatch[1], 10) : 1

          if (rent) {
            results.push({ name, beds, baths, sqft, rent, available, image })
          }
        }

        return results
      })

      for (const fp of fpData) {
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
    }
  } catch (error) {
    errors.push(`Error scraping floorplans: ${error instanceof Error ? error.message : String(error)}`)
  }

  return { floorPlans, errors }
}

/**
 * Scrape Cortland property page for building info and specials using Playwright
 */
async function scrapeCortlandProperty(
  page: Page,
  propertyUrl: string
): Promise<{ propertyData: Partial<ScrapedBuilding>; specials: ScrapedSpecial[]; errors: string[] }> {
  const propertyData: Partial<ScrapedBuilding> = {
    listingUrl: propertyUrl,
  }
  let specials: ScrapedSpecial[] = []
  const errors: string[] = []

  try {
    await page.goto(propertyUrl, { waitUntil: 'networkidle', timeout: 30000 })

    // Wait for initial content
    await page.waitForTimeout(2000)

    // Wait specifically for popdown/popup elements to render
    // These are the special offer containers that load dynamically
    try {
      await page.waitForSelector('.popdown__container, [class*="popdown"], [class*="special-offer"], [class*="promo"]', {
        timeout: 5000,
      })
      console.log(`    [Cortland] Found popup/special elements`)
    } catch {
      console.log(`    [Cortland] No popup elements found after 5s wait`)
    }

    // Additional wait for any animations/transitions
    await page.waitForTimeout(1000)

    const html = await page.content()

    // Extract property name
    const titleMatch = html.match(/<title>([^<|]+)/i)
    if (titleMatch) {
      propertyData.name = titleMatch[1]
        .replace(/\s*\|.*$/, '')
        .replace(/Apartments.*$/i, '')
        .replace(/Cortland\s*/i, '')
        .trim()

      // Keep Cortland prefix if the name would be too short
      if (propertyData.name.length < 3) {
        propertyData.name = 'Cortland ' + propertyData.name
      }
    }

    // Try JSON-LD structured data
    const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)
    if (jsonLdMatches) {
      for (const scriptTag of jsonLdMatches) {
        try {
          const jsonContent = scriptTag.replace(/<script[^>]*>|<\/script>/gi, '')
          const data = JSON.parse(jsonContent)

          if (data['@type'] === 'ApartmentComplex' || data['@type'] === 'Residence' || data['@type'] === 'Place') {
            if (data.address) {
              propertyData.address = data.address.streetAddress || data.address
              propertyData.city = data.address.addressLocality
              propertyData.state = data.address.addressRegion
              propertyData.zipCode = data.address.postalCode
            }
            if (data.geo) {
              propertyData.lat = parseFloat(data.geo.latitude)
              propertyData.lng = parseFloat(data.geo.longitude)
            }
            if (data.telephone) {
              propertyData.phone = data.telephone
            }
            if (data.image) {
              propertyData.primaryPhotoUrl = Array.isArray(data.image) ? data.image[0] : data.image
            }
            if (data.name && !propertyData.name) {
              propertyData.name = data.name
            }
          }
        } catch {
          // JSON parse failed
        }
      }
    }

    // Extract address from HTML if not in JSON-LD
    if (!propertyData.address) {
      const addressMatch = html.match(/class="[^"]*address[^"]*"[^>]*>([^<]+)/i)
      if (addressMatch) {
        propertyData.address = addressMatch[1].trim()
      }
    }

    // Extract coordinates from map data or scripts
    const latMatch = html.match(/["']?lat(?:itude)?["']?\s*[=:]\s*["']?([-\d.]+)/i)
    const lngMatch = html.match(/["']?(?:lng|lon|longitude)["']?\s*[=:]\s*["']?([-\d.]+)/i)
    if (latMatch && lngMatch && !propertyData.lat) {
      propertyData.lat = parseFloat(latMatch[1])
      propertyData.lng = parseFloat(lngMatch[1])
    }

    // Extract phone
    const phoneMatch = html.match(/href="tel:([^"]+)"/i)
    if (phoneMatch && !propertyData.phone) {
      propertyData.phone = phoneMatch[1]
    }

    // Extract amenities
    const amenities: string[] = []
    const amenityPatterns = [
      /class="[^"]*amenity[^"]*"[^>]*>([^<]+)/gi,
      /class="[^"]*feature[^"]*"[^>]*>([^<]+)/gi,
      /<li[^>]*>([^<]*(?:pool|gym|fitness|parking|garage|pet|dog|laundry|washer|roof|concierge)[^<]*)<\/li>/gi,
    ]

    for (const pattern of amenityPatterns) {
      const matches = html.matchAll(pattern)
      for (const m of matches) {
        const text = m[1].toLowerCase().trim()
        if (text.includes('pool')) amenities.push('pool')
        if (text.includes('gym') || text.includes('fitness')) amenities.push('gym')
        if (text.includes('parking') || text.includes('garage')) amenities.push('parking')
        if (text.includes('pet') || text.includes('dog')) amenities.push('pet-friendly')
        if (text.includes('laundry') || text.includes('washer')) amenities.push('in-unit-laundry')
        if (text.includes('roof')) amenities.push('rooftop')
        if (text.includes('concierge') || text.includes('doorman')) amenities.push('concierge')
      }
    }
    propertyData.amenities = [...new Set(amenities)]

    // Extract photos
    const photoMatches = html.matchAll(/src="([^"]+(?:jpg|jpeg|png|webp)[^"]*)"/gi)
    const photos: string[] = []
    for (const m of photoMatches) {
      const url = m[1]
      if (
        (url.includes('gallery') ||
          url.includes('photo') ||
          url.includes('property') ||
          url.includes('hero') ||
          url.includes('exterior')) &&
        !url.includes('logo') &&
        !url.includes('icon') &&
        !url.includes('avatar')
      ) {
        photos.push(url)
      }
    }
    if (photos.length > 0) {
      propertyData.primaryPhotoUrl = propertyData.primaryPhotoUrl || photos[0]
      propertyData.photos = photos.slice(0, 10)
    }

    // Debug: Check if popdown__container exists in HTML
    const hasPopdown = html.includes('popdown__container')
    const hasPopdownClass = html.includes('popdown')
    console.log(`    [Cortland] Rendered HTML check: popdown__container=${hasPopdown}, popdown=${hasPopdownClass}`)

    // Also scrape specials directly from the rendered DOM
    const domSpecials = await page.evaluate(() => {
      const results: Array<{
        title: string
        description: string
        rawHtml: string
        targetFloorPlans: string[] | null
      }> = []

      const specialSelectors = [
        '.popdown__container',
        '[class*="popdown"]',
        '.special-offer',
        '[class*="special-offer"]',
        '.promo-banner',
        '[class*="promo"]',
        '[class*="offer"]',
        '[class*="deal"]',
      ]

      for (const selector of specialSelectors) {
        const elements = document.querySelectorAll(selector)
        for (const el of elements) {
          const text = el.textContent?.trim() || ''
          const html = el.outerHTML || ''

          if (text.length < 10) continue
          if (!text.match(/free|off|waiv|special|deal|save|\$|concession|move.?in/i)) continue

          const titleEl = el.querySelector('h1, h2, h3, h4, .title, strong, [class*="title"]')
          const title = titleEl?.textContent?.trim() || text.slice(0, 50) + (text.length > 50 ? '...' : '')

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

    // Parse specials from DOM
    specials = domSpecials.map(s => {
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

    // Fallback to HTML regex parsing if DOM scrape found nothing
    if (specials.length === 0) {
      specials = scrapeSpecialsFromHtml(html)
    }

    console.log(`    [Cortland] Found ${specials.length} specials`)
  } catch (error) {
    errors.push(`Error scraping property: ${error instanceof Error ? error.message : String(error)}`)
  }

  return { propertyData, specials, errors }
}

/**
 * Scrape a complete Cortland property using Playwright
 */
async function scrapeCortlandComplete(
  page: Page,
  propertyUrl: string
): Promise<{
  building: ScrapedBuilding | null
  errors: string[]
}> {
  const allErrors: string[] = []

  // Scrape property info first (includes specials from rendered page)
  const propertyResult = await scrapeCortlandProperty(page, propertyUrl)
  allErrors.push(...propertyResult.errors)

  // Then scrape floorplans
  const floorplansResult = await scrapeCortlandFloorplans(page, propertyUrl)
  allErrors.push(...floorplansResult.errors)

  if (floorplansResult.floorPlans.length === 0) {
    allErrors.push(`No floor plans found for ${propertyUrl}`)
    return { building: null, errors: allErrors }
  }

  const { propertyData, specials } = propertyResult

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
    photos: propertyData.photos || [],
    amenities: propertyData.amenities || [],
    petPolicy: propertyData.amenities?.includes('pet-friendly') ? 'dogs-allowed' : null,
    parkingType: propertyData.amenities?.includes('parking') ? 'garage' : null,
    listingUrl: propertyUrl,
    floorplansUrl: `${propertyUrl.replace(/\/$/, '')}/floorplans/`,
    yearBuilt: null,
    totalUnits: null,
    floorPlans: floorplansResult.floorPlans,
    specials,
  }

  console.log(`    Found ${floorplansResult.floorPlans.length} floor plans, ${specials.length} specials`)
  return { building, errors: allErrors }
}

/**
 * Scrape all Charlotte Cortland properties
 */
export async function scrapeCortlandCharlotte(): Promise<ScrapeResult> {
  const buildings: ScrapedBuilding[] = []
  const errors: string[] = []

  // Get URLs from database
  const propertyUrls = await getCortlandUrls()
  console.log(`  Found ${propertyUrls.length} Cortland properties to scrape`)

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
        console.log(`Scraping Cortland: ${propertyUrl}...`)
        const result = await scrapeCortlandComplete(page, propertyUrl)

        errors.push(...result.errors)

        if (result.building) {
          buildings.push(result.building)
        }

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
  name: 'Cortland',
  slug: 'cortland',
  scrape: scrapeCortlandCharlotte,
}
