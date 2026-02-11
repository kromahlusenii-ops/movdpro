/**
 * Full Sync Scraper
 *
 * Discovers all properties from management company portfolio pages,
 * creates new buildings, and scrapes floor plans/units.
 *
 * Supports: Greystar, MAA, Cortland, Crescent Communities
 */

import { chromium, Browser, Page } from 'playwright'
import prisma from '@/lib/db'
import { invalidateListingsCache } from '@/lib/listings-cache'
import crescentOverrides from '@/config/crescent-overrides.json'

// Portfolio page URLs
const PORTFOLIO_URLS = {
  greystar: 'https://www.greystar.com/s/charlotte-nc',
  maa: 'https://www.maac.com/north-carolina/charlotte/',
  cortland: 'https://cortland.com/apartments/charlotte-metro/',
  crescent: 'https://www.crescentcommunities.com/about-us/markets/charlotte-nc/',
}

interface DiscoveredProperty {
  name: string
  address: string
  url: string
  city: string
  state: string
}

interface ScrapedUnit {
  name: string | null
  bedrooms: number
  bathrooms: number
  sqftMin: number | null
  sqftMax: number | null
  rentMin: number
  rentMax: number
  availableCount: number
  photoUrl: string | null
}

interface SyncResult {
  management: string
  discovered: number
  created: number
  updated: number
  unitsCreated: number
  errors: string[]
}

/**
 * Ensure management company exists
 */
async function ensureManagementCompany(slug: string, name: string) {
  return prisma.managementCompany.upsert({
    where: { slug },
    update: {},
    create: { slug, name },
  })
}

/**
 * Find or create neighborhood by coordinates
 */
async function findNeighborhood(lat: number, lng: number): Promise<string | null> {
  // Find nearest neighborhood by center coordinates
  const neighborhoods = await prisma.neighborhood.findMany({
    select: { id: true, centerLat: true, centerLng: true },
  })

  let nearest: { id: string; distance: number } | null = null

  for (const n of neighborhoods) {
    const distance = Math.sqrt(
      Math.pow(n.centerLat - lat, 2) + Math.pow(n.centerLng - lng, 2)
    )
    if (!nearest || distance < nearest.distance) {
      nearest = { id: n.id, distance }
    }
  }

  // Only return if within reasonable distance (~5 miles)
  return nearest && nearest.distance < 0.1 ? nearest.id : null
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

// ============================================================================
// GREYSTAR
// ============================================================================

async function discoverGreystar(): Promise<DiscoveredProperty[]> {
  const properties: DiscoveredProperty[] = []
  const seen = new Set<string>()

  console.log('  Fetching Greystar portfolio (all pages)...')

  const maxPages = 10
  let browser: Browser | null = null

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    })

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      // Fresh context per page to avoid crash accumulation
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      })
      const page = await context.newPage()

      // Block images/fonts/media to reduce memory pressure
      await page.route('**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,mp4,webm}', route => route.abort())

      let retries = 2
      let success = false

      while (retries > 0 && !success) {
        try {
          console.log(`    Scraping page ${pageNum}${retries < 2 ? ` (retry)` : ''}...`)

          // Navigate to the search page — Greystar uses hash-based pagination
          const url = pageNum === 1
            ? PORTFOLIO_URLS.greystar
            : `${PORTFOLIO_URLS.greystar}#page=${pageNum}`
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
          await page.waitForTimeout(5000)

          // If page > 1, click through to the right page using the pagination buttons
          if (pageNum > 1) {
            // Try clicking the specific page number button first
            const pageButton = await page.$(`button[aria-label="Go to page ${pageNum}"]`)
            if (pageButton) {
              await pageButton.click()
              await page.waitForTimeout(4000)
            } else {
              // Click "next" repeatedly to reach the target page
              for (let clicks = 1; clicks < pageNum; clicks++) {
                const nextBtn = await page.$('button[aria-label="Go to next page"]')
                if (!nextBtn) break
                const disabled = await nextBtn.evaluate(el => el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true')
                if (disabled) break
                await nextBtn.click()
                await page.waitForTimeout(3000)
              }
            }
          }

          // Extract property links from current page
          const pageLinks = await page.evaluate(() => {
            const results: Array<{ path: string; name: string; address: string }> = []
            const localSeen = new Set<string>()

            const linkElements = document.querySelectorAll('a[href*="/p_"]')
            for (const link of linkElements) {
              const href = link.getAttribute('href') || ''
              const pathMatch = href.match(/(\/[a-z0-9-]+-charlotte-nc\/p_\d+)/)
              if (!pathMatch) continue

              const path = pathMatch[1]
              if (localSeen.has(path)) continue
              localSeen.add(path)

              // Find the card container
              let card: Element | null = link
              for (let i = 0; i < 5; i++) {
                card = card?.parentElement || null
              }

              const text = card?.textContent || link.textContent || ''

              // Extract name from URL
              const slugMatch = path.match(/^\/([a-z0-9-]+)-charlotte-nc/)
              const name = slugMatch
                ? slugMatch[1]
                    .replace(/-apartments?$/, '')
                    .replace(/-townhomes?$/, '')
                    .split('-')
                    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ')
                : ''

              // Extract address
              const addrMatch = text.match(/(\d+\s+[A-Za-z0-9\s.]+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Drive|Dr|Road|Rd|Lane|Ln|Way|Court|Ct|Parkway|Pkwy)[^,\n]{0,30})/i)
              const address = addrMatch?.[1]?.replace(/,?\s*Charlotte.*$/i, '').trim() || ''

              results.push({ path, name, address })
            }

            return results
          })

          if (pageLinks.length === 0) {
            console.log(`    No more properties found on page ${pageNum}`)
            await context.close()
            // No more pages to scrape
            return properties
          }

          // Add to collection
          let newCount = 0
          for (const link of pageLinks) {
            if (seen.has(link.path)) continue
            seen.add(link.path)
            newCount++

            properties.push({
              name: link.name,
              address: link.address,
              url: 'https://www.greystar.com' + link.path,
              city: 'Charlotte',
              state: 'NC',
            })
          }

          console.log(`      Found ${pageLinks.length} properties, ${newCount} new (total: ${properties.length})`)

          // If all properties on this page were already seen, we've looped
          if (newCount === 0) {
            console.log('    No new properties — reached end')
            await context.close()
            return properties
          }

          success = true
        } catch (error) {
          retries--
          console.log(`    Page ${pageNum} error: ${error instanceof Error ? error.message.slice(0, 80) : error}${retries > 0 ? ' — retrying...' : ''}`)
        }
      }

      await context.close()

      if (!success) {
        console.log(`    Giving up on page ${pageNum} after retries, continuing with what we have`)
        break
      }
    }

  } catch (error) {
    console.log(`    Discovery error: ${error instanceof Error ? error.message : error}`)
  } finally {
    if (browser) {
      await browser.close()
    }
  }

  return properties
}

async function scrapeGreystarProperty(page: Page, url: string): Promise<{ units: ScrapedUnit[]; buildingData: Record<string, unknown> }> {
  const units: ScrapedUnit[] = []
  const buildingData: Record<string, unknown> = {}

  try {
    // First, go to portfolio page to find actual property website
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(2000)

    // Find external property website link
    const propertyWebsite = await page.evaluate(() => {
      const links = document.querySelectorAll('a[href]')
      for (const link of links) {
        const href = link.getAttribute('href') || ''
        // Look for external property website (not greystar.com, not social media)
        if (href.startsWith('http') &&
            !href.includes('greystar.com') &&
            !href.includes('instagram') &&
            !href.includes('linkedin') &&
            !href.includes('twitter') &&
            !href.includes('facebook') &&
            !href.includes('x.com') &&
            !href.includes('walkscore') &&
            !href.includes('scene7.com') &&
            !href.includes('residentportal')) {
          try {
            const u = new URL(href)
            return u.origin
          } catch { /* ignore */ }
        }
      }
      return null
    })

    if (!propertyWebsite) {
      console.log(`    No property website found for ${url}`)
      return { units, buildingData }
    }

    console.log(`    Found property website: ${propertyWebsite}`)
    buildingData.website = propertyWebsite

    // Go to floorplans page on the actual property website
    const floorplansUrl = propertyWebsite + '/floorplans/'
    await page.goto(floorplansUrl, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(3000)

    // Extract floor plans
    const data = await page.evaluate(() => {
      const results: Array<{
        name: string | null
        beds: string
        baths: string
        sqft: string
        rent: string
        available: number
        image: string | null
      }> = []

      // Find floor plan cards
      const cards = document.querySelectorAll('[data-jd-fp-selector], .fp-card, [class*="floorplan"]')

      for (const card of cards) {
        const text = card.textContent || ''
        if (!text.match(/\$[\d,]+/)) continue

        let beds = '1'
        if (text.toLowerCase().includes('studio')) {
          beds = '0'
        } else {
          const bedMatch = text.match(/(\d+)\s*(?:bed|br)/i)
          if (bedMatch) beds = bedMatch[1]
        }

        const bathMatch = text.match(/(\d+\.?\d*)\s*(?:bath|ba)/i)
        const baths = bathMatch ? bathMatch[1] : '1'

        const sqftMatch = text.match(/(\d{3,4}(?:\s*[-–]\s*\d{3,4})?)\s*(?:sq|sf)/i)
        const sqft = sqftMatch ? sqftMatch[1] : ''

        const rentMatch = text.match(/\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?/i)
        const rent = rentMatch ? rentMatch[0] : ''

        const nameEl = card.querySelector('.fp-name, h3, h4, [class*="name"]')
        const name = nameEl?.textContent?.trim() || null

        const imgEl = card.querySelector('img')
        const image = imgEl?.getAttribute('src') || null

        const availMatch = text.match(/(\d+)\s*(?:available|unit)/i)
        const available = availMatch ? parseInt(availMatch[1], 10) : 1

        if (rent) {
          results.push({ name, beds, baths, sqft, rent, available, image })
        }
      }

      return results
    })

    for (const fp of data) {
      const { min: sqftMin, max: sqftMax } = parseSqft(fp.sqft)
      const { min: rentMin, max: rentMax } = parseRent(fp.rent)

      units.push({
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

    // Extract building metadata from JSON-LD
    const metadata = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]')
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent || '')
          if (data['@type'] === 'ApartmentComplex' || data['@type'] === 'Residence') {
            return {
              address: data.address?.streetAddress,
              city: data.address?.addressLocality,
              state: data.address?.addressRegion,
              zipCode: data.address?.postalCode,
              lat: data.geo?.latitude ? parseFloat(data.geo.latitude) : null,
              lng: data.geo?.longitude ? parseFloat(data.geo.longitude) : null,
              phone: data.telephone,
              image: Array.isArray(data.image) ? data.image[0] : data.image,
            }
          }
        } catch { /* ignore */ }
      }
      return {}
    })

    Object.assign(buildingData, metadata)

  } catch (error) {
    console.log(`    Error scraping: ${error instanceof Error ? error.message : error}`)
  }

  return { units, buildingData }
}

// ============================================================================
// MAA
// ============================================================================

async function discoverMAA(): Promise<DiscoveredProperty[]> {
  const properties: DiscoveredProperty[] = []
  const seen = new Set<string>()

  console.log('  Fetching MAA portfolio...')

  // Use Playwright to capture JS-rendered property links
  let browser: Browser | null = null
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    })
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    })
    const page = await context.newPage()
    await page.route('**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,mp4,webm}', route => route.abort())

    await page.goto(PORTFOLIO_URLS.maa, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(3000)

    // Scroll to load lazy content
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2))
    await page.waitForTimeout(2000)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(2000)

    // Check for "Show More" / "Load More" buttons and click them
    for (let i = 0; i < 5; i++) {
      const loadMore = await page.$('button:has-text("Show More"), button:has-text("Load More"), button:has-text("View More"), a:has-text("Show More")')
      if (!loadMore) break
      console.log('    Clicking "Show More"...')
      await loadMore.click()
      await page.waitForTimeout(3000)
    }

    const html = await page.content()
    await context.close()

    // Extract property links - pattern: /north-carolina/charlotte/maa-xxx/
    const linkPattern = /href="(\/north-carolina\/charlotte\/maa-[a-z0-9-]+\/)"/gi
    let match

    while ((match = linkPattern.exec(html)) !== null) {
      const path = match[1]
      if (seen.has(path)) continue
      seen.add(path)

      const url = 'https://www.maac.com' + path

      const slugMatch = path.match(/\/maa-([a-z0-9-]+)\/$/)
      const name = slugMatch
        ? 'MAA ' + slugMatch[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        : ''

      if (name) {
        properties.push({ name, address: '', url, city: 'Charlotte', state: 'NC' })
      }
    }
  } catch (error) {
    console.log(`    Discovery error: ${error instanceof Error ? error.message : error}`)

    // Fallback to plain fetch if Playwright fails
    console.log('    Falling back to plain fetch...')
    try {
      const response = await fetch(PORTFOLIO_URLS.maa, { headers: { 'User-Agent': 'Mozilla/5.0' } })
      const html = await response.text()
      const linkPattern = /href="(\/north-carolina\/charlotte\/maa-[a-z0-9-]+\/)"/gi
      let match
      while ((match = linkPattern.exec(html)) !== null) {
        const path = match[1]
        if (seen.has(path)) continue
        seen.add(path)
        const url = 'https://www.maac.com' + path
        const slugMatch = path.match(/\/maa-([a-z0-9-]+)\/$/)
        const name = slugMatch ? 'MAA ' + slugMatch[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : ''
        if (name) properties.push({ name, address: '', url, city: 'Charlotte', state: 'NC' })
      }
    } catch (fetchError) {
      console.log(`    Fallback fetch error: ${fetchError instanceof Error ? fetchError.message : fetchError}`)
    }
  } finally {
    if (browser) await browser.close()
  }

  return properties
}

async function scrapeMAAProperty(page: Page, url: string): Promise<{ units: ScrapedUnit[]; buildingData: Record<string, unknown> }> {
  const units: ScrapedUnit[] = []
  const buildingData: Record<string, unknown> = {}

  try {
    // MAA floor plans are on the property HOME page (not /floor-plans/ which 404s)
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })

    // Wait for unit carousel cards to render (JS-rendered)
    await page.waitForTimeout(3000)

    // Scroll to trigger lazy loading of unit carousel
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 3))
    await page.waitForTimeout(2000)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 2 / 3))
    await page.waitForTimeout(2000)

    // Wait for unit cards (.apt-link) or pricing elements
    try {
      await page.waitForSelector('.apt-link, [class*="apt-link"]', { timeout: 10000 })
    } catch {
      try {
        await page.waitForSelector('text=/\\$[0-9]/', { timeout: 5000 })
      } catch { /* ignore */ }
    }
    await page.waitForTimeout(1000)

    // Click through bedroom filter tabs to load all unit types
    const tabTexts = ['All', 'Studio', '1 Bedroom', '2 Bedroom', '3 Bedroom']
    for (const tabText of tabTexts) {
      try {
        const tab = await page.$(`button:has-text("${tabText}"), a:has-text("${tabText}"), [role="tab"]:has-text("${tabText}")`)
        if (tab) {
          await tab.click()
          await page.waitForTimeout(1500)
        }
      } catch { /* tab not found, skip */ }
    }

    // Click "All" tab back to ensure we see everything
    try {
      const allTab = await page.$('button:has-text("All"), a:has-text("All"), [role="tab"]:has-text("All")')
      if (allTab) {
        await allTab.click()
        await page.waitForTimeout(1500)
      }
    } catch { /* ignore */ }

    // Also try clicking carousel next buttons to load more cards
    for (let i = 0; i < 10; i++) {
      try {
        const nextBtn = await page.$('button[aria-label*="next" i], button[aria-label*="Next"], .slick-next, [class*="carousel"] button:last-child, button:has-text("›"), button:has-text(">")')
        if (!nextBtn) break
        const isVisible = await nextBtn.isVisible()
        const isDisabled = await nextBtn.getAttribute('disabled')
        if (!isVisible || isDisabled !== null) break
        await nextBtn.click()
        await page.waitForTimeout(500)
      } catch { break }
    }

    const data = await page.evaluate(() => {
      const results: Array<{
        name: string | null
        beds: string
        baths: string
        sqft: string
        rent: string
        available: number
        image: string | null
        special: string | null
      }> = []

      const seen = new Set<string>()

      // Strategy 1: Look for .apt-link unit cards (MAA's primary card class)
      const aptCards = document.querySelectorAll('.apt-link, [class*="apt-link"]')
      for (const card of aptCards) {
        const text = card.textContent || ''
        if (!text.match(/\$\d/)) continue

        // Extract unit number
        const unitMatch = text.match(/(?:Unit|Apt|#)\s*#?(\w+)/i)
        const unitName = unitMatch ? `Unit ${unitMatch[1]}` : null

        // Extract rent
        const rentMatch = text.match(/\$[\d,]+/)
        const rent = rentMatch ? rentMatch[0] : ''

        // Extract beds
        let beds = '1'
        if (text.toLowerCase().includes('studio')) {
          beds = '0'
        } else {
          const bedMatch = text.match(/(\d+)\s*(?:Bed|BR|Bedroom)/i)
          if (bedMatch) beds = bedMatch[1]
        }

        // Extract baths
        const bathMatch = text.match(/(\d+\.?\d*)\s*(?:Bath|BA)/i)
        const baths = bathMatch ? bathMatch[1] : '1'

        // Extract sqft
        const sqftMatch = text.match(/([\d,]+)\s*(?:Sq\.?\s*Ft|SF)/i)
        const sqft = sqftMatch ? sqftMatch[1].replace(',', '') : ''

        // Extract specials
        const specialEl = card.querySelector('[class*="special"], [class*="move-in-special"], [class*="unit-special"]')
        const special = specialEl?.textContent?.trim() || null

        // Extract image
        const imgEl = card.querySelector('img')
        const image = imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src') || null

        const key = `${unitName || ''}-${beds}-${baths}-${rent}`
        if (rent && !seen.has(key)) {
          seen.add(key)
          results.push({ name: unitName, beds, baths, sqft, rent, available: 1, image, special })
        }
      }

      // Strategy 2: If no .apt-link cards found, search for any elements with pricing + bed/bath info
      if (results.length === 0) {
        // Find all elements that look like unit cards by their content
        const allEls = document.querySelectorAll('[class*="card"], [class*="unit"], [class*="apartment"], [class*="listing"], li, article')
        for (const el of allEls) {
          const text = el.textContent || ''
          // Must have a dollar amount and bed/bath info, and be a reasonable size
          if (!text.match(/\$\d{3,}/) || text.length > 2000 || text.length < 20) continue
          if (!text.match(/bed|bath|studio|sq\s*ft/i)) continue

          // Skip if this element contains other matching elements (deduplicate)
          const children = el.querySelectorAll('[class*="card"], [class*="unit"], [class*="apartment"]')
          let hasMatchingChild = false
          for (const child of children) {
            if (child !== el && child.textContent?.match(/\$\d{3,}/)) {
              hasMatchingChild = true
              break
            }
          }
          if (hasMatchingChild) continue

          let beds = '1'
          if (text.toLowerCase().includes('studio')) {
            beds = '0'
          } else {
            const bedMatch = text.match(/(\d+)\s*(?:Bed|BR|Bedroom)/i)
            if (bedMatch) beds = bedMatch[1]
          }

          const bathMatch = text.match(/(\d+\.?\d*)\s*(?:Bath|BA)/i)
          const baths = bathMatch ? bathMatch[1] : '1'

          const sqftMatch = text.match(/([\d,]+)\s*(?:Sq\.?\s*Ft|SF)/i)
          const sqft = sqftMatch ? sqftMatch[1].replace(',', '') : ''

          const rentMatch = text.match(/\$[\d,]+/)
          const rent = rentMatch ? rentMatch[0] : ''

          const unitMatch = text.match(/(?:Unit|Apt|#)\s*#?(\w+)/i)
          const unitName = unitMatch ? `Unit ${unitMatch[1]}` : null

          const key = `${unitName || beds}-${baths}-${rent}`
          if (rent && !seen.has(key)) {
            seen.add(key)
            results.push({ name: unitName, beds, baths, sqft, rent, available: 1, image: null, special: null })
          }
        }
      }

      return results
    })

    console.log(`    Found ${data.length} units on property page`)

    for (const fp of data) {
      const { min: sqftMin, max: sqftMax } = parseSqft(fp.sqft)
      const { min: rentMin, max: rentMax } = parseRent(fp.rent)

      units.push({
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

    // Extract building metadata from JSON-LD
    const metadata = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]')
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent || '')
          if (data['@type'] === 'ApartmentComplex' || data['@type'] === 'LocalBusiness') {
            return {
              address: data.address?.streetAddress,
              city: data.address?.addressLocality,
              state: data.address?.addressRegion,
              zipCode: data.address?.postalCode,
              lat: data.geo?.latitude ? parseFloat(data.geo.latitude) : null,
              lng: data.geo?.longitude ? parseFloat(data.geo.longitude) : null,
              phone: data.telephone,
              image: Array.isArray(data.image) ? data.image[0] : data.image,
            }
          }
        } catch { /* ignore */ }
      }
      return {}
    })

    Object.assign(buildingData, metadata)

  } catch (error) {
    console.log(`    Error scraping: ${error instanceof Error ? error.message : error}`)
  }

  return { units, buildingData }
}

// ============================================================================
// CORTLAND
// ============================================================================

async function discoverCortland(): Promise<DiscoveredProperty[]> {
  const properties: DiscoveredProperty[] = []
  const seen = new Set<string>()

  console.log('  Fetching Cortland portfolio...')

  // Use Playwright to capture JS-rendered property links
  let browser: Browser | null = null
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    })
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    })
    const page = await context.newPage()
    await page.route('**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,mp4,webm}', route => route.abort())

    await page.goto(PORTFOLIO_URLS.cortland, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(3000)

    // Scroll to load lazy content
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2))
    await page.waitForTimeout(2000)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(2000)

    // Check for "Show More" / "Load More" buttons
    for (let i = 0; i < 5; i++) {
      const loadMore = await page.$('button:has-text("Show More"), button:has-text("Load More"), button:has-text("View More"), a:has-text("View All")')
      if (!loadMore) break
      console.log('    Clicking "Show More"...')
      await loadMore.click()
      await page.waitForTimeout(3000)
    }

    const html = await page.content()
    await context.close()

    // Extract property links - pattern: /apartments/cortland-xxx/
    const linkPattern = /href="(\/apartments\/cortland-[a-z0-9-]+\/)"/gi
    let match

    while ((match = linkPattern.exec(html)) !== null) {
      const path = match[1]
      if (seen.has(path)) continue
      seen.add(path)

      const url = 'https://cortland.com' + path

      const slugMatch = path.match(/\/cortland-([a-z0-9-]+)\/$/)
      const name = slugMatch
        ? 'Cortland ' + slugMatch[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        : ''

      if (name) {
        properties.push({ name, address: '', url, city: 'Charlotte', state: 'NC' })
      }
    }
  } catch (error) {
    console.log(`    Discovery error: ${error instanceof Error ? error.message : error}`)

    // Fallback to plain fetch
    console.log('    Falling back to plain fetch...')
    try {
      const response = await fetch(PORTFOLIO_URLS.cortland, { headers: { 'User-Agent': 'Mozilla/5.0' } })
      const html = await response.text()
      const linkPattern = /href="(\/apartments\/cortland-[a-z0-9-]+\/)"/gi
      let match
      while ((match = linkPattern.exec(html)) !== null) {
        const path = match[1]
        if (seen.has(path)) continue
        seen.add(path)
        const url = 'https://cortland.com' + path
        const slugMatch = path.match(/\/cortland-([a-z0-9-]+)\/$/)
        const name = slugMatch ? 'Cortland ' + slugMatch[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : ''
        if (name) properties.push({ name, address: '', url, city: 'Charlotte', state: 'NC' })
      }
    } catch (fetchError) {
      console.log(`    Fallback fetch error: ${fetchError instanceof Error ? fetchError.message : fetchError}`)
    }
  } finally {
    if (browser) await browser.close()
  }

  return properties
}

async function scrapeCortlandProperty(page: Page, url: string): Promise<{ units: ScrapedUnit[]; buildingData: Record<string, unknown> }> {
  const units: ScrapedUnit[] = []
  const buildingData: Record<string, unknown> = {}

  try {
    const floorplansUrl = url.replace(/\/?$/, '/floorplans/')
    await page.goto(floorplansUrl, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForTimeout(3000)

    // Strategy 1: Extract from server-rendered "var preload" JSON (most reliable)
    const preloadData = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script')
      for (const script of scripts) {
        const text = script.textContent || ''
        const preloadMatch = text.match(/var\s+preload\s*=\s*(\{[\s\S]*?\});/)
        if (preloadMatch) {
          try {
            return JSON.parse(preloadMatch[1])
          } catch { /* malformed JSON */ }
        }
      }
      return null
    })

    // Strategy 1a: Extract siteSettings for building metadata
    const siteSettingsData = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script')
      for (const script of scripts) {
        const text = script.textContent || ''
        const settingsMatch = text.match(/var\s+siteSettings\s*=\s*(\{[\s\S]*?\});/)
        if (settingsMatch) {
          try {
            return JSON.parse(settingsMatch[1])
          } catch { /* malformed JSON */ }
        }
      }
      return null
    })

    if (preloadData && preloadData.floorplans) {
      const floorplans = preloadData.floorplans as Record<string, {
        id: number
        title: string
        bedroom: string
        bathroom: string
        square_feet: number
        max_square_feet: number
        min_rent: number | null
        max_rent: number | null
        apartments: number[]
        availability: string[]
      }>

      for (const [, fp] of Object.entries(floorplans)) {
        // Only include floor plans with available units and pricing
        if (!fp.min_rent) continue

        const bedrooms = fp.bedroom === 'Studio' ? 0 : parseInt(fp.bedroom, 10) || 1
        const bathrooms = parseFloat(fp.bathroom) || 1

        // Count available apartments for this floor plan
        const availCount = fp.apartments?.length || 1

        units.push({
          name: fp.title,
          bedrooms,
          bathrooms,
          sqftMin: fp.square_feet || null,
          sqftMax: fp.max_square_feet || fp.square_feet || null,
          rentMin: fp.min_rent,
          rentMax: fp.max_rent || fp.min_rent,
          availableCount: availCount,
          photoUrl: null,
        })
      }

      console.log(`    [Cortland] Extracted ${units.length} floor plans from preload data`)
    } else {
      // Strategy 2: Fallback to DOM-based extraction
      console.log('    [Cortland] No preload data found, falling back to DOM extraction')

      const data = await page.evaluate(() => {
        const results: Array<{
          name: string | null
          beds: string
          baths: string
          sqft: string
          rent: string
          available: number
          image: string | null
        }> = []

        const seen = new Set<string>()

        // Try .floorplan-listing__item cards first
        const fpCards = document.querySelectorAll('.floorplan-listing__item[data-floorplan]')
        for (const card of fpCards) {
          const fpId = card.getAttribute('data-floorplan') || ''
          if (seen.has(fpId)) continue
          seen.add(fpId)

          const titleEl = card.querySelector('.floorplan-listing__item-title')
          const name = titleEl?.textContent?.trim() || null

          const infoEl = card.querySelector('.floorplan-listing__item-info')
          const infoText = infoEl?.textContent || ''

          let beds = '1'
          if (infoText.toLowerCase().includes('studio')) {
            beds = '0'
          } else {
            const bedMatch = infoText.match(/(\d+)\s*Bed/i)
            if (bedMatch) beds = bedMatch[1]
          }

          const bathMatch = infoText.match(/(\d+\.?\d*)\s*Bath/i)
          const baths = bathMatch ? bathMatch[1] : '1'

          const sqftEl = card.querySelector('.floorplan-listing__sqft')
          const sqftText = sqftEl?.textContent || ''
          const sqftMatch = sqftText.match(/([\d,]+)\s*sq/i)
          const sqft = sqftMatch ? sqftMatch[1].replace(',', '') : ''

          const pricingEl = card.querySelector('.floorplan-listing__item-pricing')
          const pricingText = pricingEl?.textContent || ''
          const rentMatch = pricingText.match(/\$[\d,]+/)
          const rent = rentMatch ? rentMatch[0] : ''

          const imgEl = card.querySelector('img.floorplan-listing__item-image-asset')
          const image = imgEl?.getAttribute('data-src') || imgEl?.getAttribute('src') || null

          if (rent) {
            results.push({ name, beds, baths, sqft, rent, available: 1, image })
          }
        }

        // Fallback: data-event-extra attributes
        if (results.length === 0) {
          const elements = document.querySelectorAll('[data-event-extra]')
          for (const el of elements) {
            try {
              const dataStr = el.getAttribute('data-event-extra') || ''
              const data = JSON.parse(dataStr)
              if (!data.floor_plan_id || !data.starting_at_price) continue
              const fpId = String(data.floor_plan_id)
              if (seen.has(fpId)) continue
              seen.add(fpId)
              results.push({
                name: data.floor_plan_name || null,
                beds: String(data.bedrooms || '1'),
                baths: '1',
                sqft: '',
                rent: '$' + data.starting_at_price,
                available: 1,
                image: null,
              })
            } catch { /* skip */ }
          }
        }

        return results
      })

      for (const fp of data) {
        const { min: sqftMin, max: sqftMax } = parseSqft(fp.sqft)
        const { min: rentMin, max: rentMax } = parseRent(fp.rent)

        units.push({
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

    // Extract building metadata from siteSettings (more reliable than JSON-LD)
    if (siteSettingsData?.contactInfo) {
      const info = siteSettingsData.contactInfo
      buildingData.address = info.address
      buildingData.city = info.city
      buildingData.state = info.state
      buildingData.zipCode = info.zip
      buildingData.lat = info.lat ? parseFloat(info.lat) : null
      buildingData.lng = info.lng ? parseFloat(info.lng) : null
      buildingData.phone = info.phone_local || info.phone
    } else {
      // Fallback to JSON-LD
      const metadata = await page.evaluate(() => {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]')
        for (const script of scripts) {
          try {
            const data = JSON.parse(script.textContent || '')
            if (data['@type'] === 'ApartmentComplex' || data['@type'] === 'Residence') {
              return {
                address: data.address?.streetAddress,
                city: data.address?.addressLocality,
                state: data.address?.addressRegion,
                zipCode: data.address?.postalCode,
                lat: data.geo?.latitude ? parseFloat(data.geo.latitude) : null,
                lng: data.geo?.longitude ? parseFloat(data.geo.longitude) : null,
                phone: data.telephone,
                image: Array.isArray(data.image) ? data.image[0] : data.image,
              }
            }
          } catch { /* ignore */ }
        }
        return {}
      })
      Object.assign(buildingData, metadata)
    }

  } catch (error) {
    console.log(`    Error scraping: ${error instanceof Error ? error.message : error}`)
  }

  return { units, buildingData }
}

// ============================================================================
// CRESCENT COMMUNITIES
// ============================================================================

interface CrescentOverride {
  status: string
  url?: string
  platform?: string
  floor_plans_path?: string
  exclude_from_scrape?: boolean
}

interface CrescentKnown {
  url: string
  platform: string
  floor_plans_path: string
  status: string
}

function getCrescentOverride(slug: string): CrescentOverride | null {
  const overrides = crescentOverrides.overrides as Record<string, CrescentOverride>
  return overrides[slug] || null
}

function getCrescentKnown(slug: string): CrescentKnown | null {
  const known = crescentOverrides.known_communities as Record<string, CrescentKnown>
  return known[slug] || null
}

function slugifyCrescent(name: string): string {
  return name
    .toLowerCase()
    .replace(/novel\s+/i, 'novel-')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

async function discoverCrescent(): Promise<DiscoveredProperty[]> {
  const properties: DiscoveredProperty[] = []
  const seen = new Set<string>()

  console.log('  Fetching Crescent Communities portfolio...')

  let browser: Browser | null = null
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    })
    const context = await browser.newContext({
      userAgent: 'MOVD-PRO-Bot/1.0 (apartment-locator-tool)',
    })
    const page = await context.newPage()
    await page.route('**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,mp4,webm}', route => route.abort())

    await page.goto(PORTFOLIO_URLS.crescent, { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForTimeout(3000)

    // Extract communities from the page
    const communities = await page.evaluate(() => {
      const results: Array<{
        name: string
        status: string
        websiteUrl: string | null
      }> = []

      // Get all NOVEL links and community cards
      const pageText = document.body.innerText
      const allLinks = document.querySelectorAll('a[href*="novel"]')

      // Build a map of URLs to help match with names
      const urlMap: Record<string, string> = {}
      for (const link of allLinks) {
        const href = link.getAttribute('href') || ''
        if (href.includes('novel') && href.includes('.com') && !href.includes('crescentcommunities')) {
          // Extract name from URL like noveluniversityplace.com -> university place
          const match = href.match(/novel([a-z]+)\.com/i)
          if (match) {
            urlMap[match[1].toLowerCase()] = href
          }
        }
      }

      // Look for NOVEL community names in the page text
      // Pattern: "NOVEL Something" followed by status
      const lines = pageText.split('\n').map(l => l.trim()).filter(l => l)

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (line.startsWith('NOVEL ') && line.length < 50) {
          const name = line.trim()

          // Skip duplicates
          if (results.some(r => r.name === name)) continue

          // Look ahead for status in next few lines
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

    await context.close()

    // Process discovered communities
    for (const comm of communities) {
      const slug = slugifyCrescent(comm.name)

      // Check if excluded
      const override = getCrescentOverride(slug)
      if (override?.exclude_from_scrape) {
        console.log(`    Skipping ${comm.name} (excluded)`)
        continue
      }

      // Determine URL
      let url = comm.websiteUrl
      const known = getCrescentKnown(slug)

      if (known) {
        url = known.url
      } else if (override?.url) {
        url = override.url
      } else if (!url) {
        // Try to construct URL
        const cleanName = comm.name.toLowerCase().replace(/novel\s+/i, '').replace(/\s+/g, '')
        const testUrls = [`https://www.novel${cleanName}.com`, `https://novel${cleanName}.com`]
        for (const testUrl of testUrls) {
          try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 5000)
            const response = await fetch(testUrl, { method: 'HEAD', signal: controller.signal })
            clearTimeout(timeoutId)
            if (response.ok) {
              url = testUrl
              console.log(`    Discovered URL for ${comm.name}: ${url}`)
              break
            }
          } catch {
            // Try next URL
          }
        }
      }

      if (!url) {
        console.log(`    No URL found for ${comm.name}`)
        continue
      }

      if (seen.has(url)) continue
      seen.add(url)

      properties.push({
        name: comm.name,
        address: '',
        url,
        city: 'Charlotte',
        state: 'NC',
      })
    }

    // Also add known communities that might not be on the market page
    const knownCommunities = crescentOverrides.known_communities as Record<string, CrescentKnown>
    for (const [slug, known] of Object.entries(knownCommunities)) {
      if (seen.has(known.url)) continue
      seen.add(known.url)

      const name = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ').replace('Novel ', 'NOVEL ')

      properties.push({
        name,
        address: '',
        url: known.url,
        city: 'Charlotte',
        state: 'NC',
      })
    }

  } catch (error) {
    console.log(`    Discovery error: ${error instanceof Error ? error.message : error}`)
  } finally {
    if (browser) await browser.close()
  }

  console.log(`    Found ${properties.length} Crescent properties`)
  return properties
}

async function scrapeCrescentProperty(page: Page, url: string): Promise<{ units: ScrapedUnit[]; buildingData: Record<string, unknown> }> {
  const units: ScrapedUnit[] = []
  const buildingData: Record<string, unknown> = { website: url }

  try {
    // Determine floor plans path based on platform
    const knownPatterns = crescentOverrides.url_patterns as Record<string, { floor_plans: string }>
    let floorPlansPath = '/floor-plans/'

    // Check known communities for platform type
    const knownCommunities = crescentOverrides.known_communities as Record<string, CrescentKnown>
    for (const [, known] of Object.entries(knownCommunities)) {
      if (url.includes(known.url.replace(/https?:\/\//, '').replace(/\/$/, ''))) {
        floorPlansPath = known.floor_plans_path
        break
      }
    }

    // Detect platform from homepage
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(2000)

    const platformType = await page.evaluate(() => {
      const html = document.documentElement.outerHTML
      if (html.includes('/media/') || html.includes('knockDoorway')) {
        return 'crescent_cms'
      }
      if (html.includes('/assets/images/') || document.querySelector('a[href*="/floorplans/"]')) {
        return 'third_party'
      }
      return 'unknown'
    })

    if (platformType === 'third_party') {
      floorPlansPath = '/floorplans/'
    }

    // Navigate to floor plans page
    const floorplansUrl = url.replace(/\/$/, '') + floorPlansPath
    await page.goto(floorplansUrl, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(3000)

    // Extract floor plans
    const data = await page.evaluate(() => {
      const results: Array<{
        name: string | null
        beds: string
        baths: string
        sqft: string
        rent: string
        available: number
        image: string | null
      }> = []

      const cardSelectors = ['.floor-plan', '.floorplan', '[class*="floor-plan"]', '[class*="floorplan"]', 'article']
      let cards: Element[] = []

      for (const selector of cardSelectors) {
        const found = document.querySelectorAll(selector)
        if (found.length > 0) {
          cards = Array.from(found)
          break
        }
      }

      // Fallback: find elements with pricing patterns
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
        if (!text.match(/\$[\d,]+/)) continue

        let beds = '1'
        if (text.toLowerCase().includes('studio')) {
          beds = '0'
        } else {
          const bedMatch = text.match(/(\d+)\s*(?:bed|br)/i)
          if (bedMatch) beds = bedMatch[1]
        }

        const bathMatch = text.match(/(\d+\.?\d*)\s*(?:bath|ba)/i)
        const baths = bathMatch ? bathMatch[1] : '1'

        const sqftMatch = text.match(/(\d{3,4}(?:\s*[-–]\s*\d{3,4})?)\s*(?:sq|sf)/i)
        const sqft = sqftMatch ? sqftMatch[1] : ''

        const rentMatch = text.match(/(?:starting\s*at\s*)?\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?/i)
        const rent = rentMatch ? rentMatch[0] : ''

        const nameEl = card.querySelector('h2, h3, h4, .name, [class*="name"]')
        let name = nameEl?.textContent?.trim() || null
        if (!name) {
          const codeMatch = text.match(/\b([A-Z]\d{1,2})\b/)
          if (codeMatch) name = codeMatch[1]
        }

        const imgEl = card.querySelector('img')
        const image = imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src') || null

        const availMatch = text.match(/(\d+)\s*(?:available|unit)/i)
        const available = availMatch ? parseInt(availMatch[1], 10) : 1

        if (rent) {
          results.push({ name, beds, baths, sqft, rent, available, image })
        }
      }

      return results
    })

    for (const fp of data) {
      const { min: sqftMin, max: sqftMax } = parseSqft(fp.sqft)
      const { min: rentMin, max: rentMax } = parseRent(fp.rent)

      units.push({
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

    // Extract building metadata
    const metadata = await page.evaluate(() => {
      const result: Record<string, unknown> = {}

      // Try JSON-LD
      const scripts = document.querySelectorAll('script[type="application/ld+json"]')
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent || '')
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
          if (data.image) result.image = Array.isArray(data.image) ? data.image[0] : data.image
        } catch { /* ignore */ }
      }

      // Fallback: look for address patterns
      if (!result.address) {
        const allText = document.body.innerText
        const addrMatch = allText.match(/\d+\s+[\w\s]+(?:Drive|Street|Avenue|Road|Boulevard|Way),?\s*Charlotte,?\s*NC\s*\d{5}/i)
        if (addrMatch) result.address = addrMatch[0]
      }

      // Look for phone
      if (!result.phone) {
        const phoneLink = document.querySelector('a[href^="tel:"]')
        if (phoneLink) {
          result.phone = phoneLink.getAttribute('href')?.replace('tel:', '') || phoneLink.textContent?.trim()
        }
      }

      return result
    })

    Object.assign(buildingData, metadata)

  } catch (error) {
    console.log(`    Error scraping: ${error instanceof Error ? error.message : error}`)
  }

  return { units, buildingData }
}

// ============================================================================
// MAIN SYNC FUNCTION
// ============================================================================

export async function fullSync(management: 'greystar' | 'maa' | 'cortland' | 'crescent'): Promise<SyncResult> {
  const result: SyncResult = {
    management,
    discovered: 0,
    created: 0,
    updated: 0,
    unitsCreated: 0,
    errors: [],
  }

  const managementNames = {
    greystar: 'Greystar',
    maa: 'MAA',
    cortland: 'Cortland',
    crescent: 'Crescent Communities',
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log(`FULL SYNC: ${managementNames[management]}`)
  console.log('='.repeat(60))

  // Ensure management company exists
  const mgmt = await ensureManagementCompany(management, managementNames[management])

  // Discover properties
  let properties: DiscoveredProperty[] = []
  try {
    if (management === 'greystar') {
      properties = await discoverGreystar()
    } else if (management === 'maa') {
      properties = await discoverMAA()
    } else if (management === 'cortland') {
      properties = await discoverCortland()
    } else if (management === 'crescent') {
      properties = await discoverCrescent()
    }
  } catch (error) {
    result.errors.push(`Discovery failed: ${error instanceof Error ? error.message : error}`)
    return result
  }

  result.discovered = properties.length
  console.log(`  Discovered ${properties.length} properties`)

  if (properties.length === 0) {
    return result
  }

  // Launch browser for scraping
  let browser: Browser | null = null
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      viewport: { width: 1280, height: 800 },
    })

    const page = await context.newPage()

    for (const prop of properties) {
      console.log(`  Processing: ${prop.name}...`)

      // Scrape property
      let scrapeResult: { units: ScrapedUnit[]; buildingData: Record<string, unknown> }
      try {
        if (management === 'greystar') {
          scrapeResult = await scrapeGreystarProperty(page, prop.url)
        } else if (management === 'maa') {
          scrapeResult = await scrapeMAAProperty(page, prop.url)
        } else if (management === 'cortland') {
          scrapeResult = await scrapeCortlandProperty(page, prop.url)
        } else {
          scrapeResult = await scrapeCrescentProperty(page, prop.url)
        }
      } catch (error) {
        result.errors.push(`Failed to scrape ${prop.name}: ${error instanceof Error ? error.message : error}`)
        continue
      }

      const { units, buildingData } = scrapeResult

      // Use scraped data or defaults
      const address = (buildingData.address as string) || prop.address || ''
      const lat = (buildingData.lat as number) || 35.2271
      const lng = (buildingData.lng as number) || -80.8431
      // Use property website if found, otherwise the portfolio URL
      const listingUrl = (buildingData.website as string) || prop.url

      // Find neighborhood
      const neighborhoodId = await findNeighborhood(lat, lng)
      if (!neighborhoodId) {
        console.log(`    Skipping - no neighborhood found for ${prop.name}`)
        continue
      }

      // Upsert building - check by URL, name, or address
      const existingBuilding = await prisma.building.findFirst({
        where: {
          managementId: mgmt.id,
          OR: [
            { listingUrl },
            { listingUrl: prop.url },
            { name: prop.name },
            ...(address ? [{ address }] : []),
          ],
        },
      })

      let building
      try {
        if (existingBuilding) {
          // Don't change address on existing buildings to avoid conflicts
          building = await prisma.building.update({
            where: { id: existingBuilding.id },
            data: {
              listingUrl,
              website: (buildingData.website as string) || existingBuilding.website,
              lat: lat || existingBuilding.lat,
              lng: lng || existingBuilding.lng,
              primaryPhotoUrl: (buildingData.image as string) || existingBuilding.primaryPhotoUrl,
              phone: (buildingData.phone as string) || existingBuilding.phone,
              lastSyncedAt: new Date(),
            },
          })
          result.updated++
        } else {
          building = await prisma.building.create({
            data: {
              name: prop.name,
              address: address || `${prop.name} - ${prop.city}`, // Ensure unique address
              city: prop.city,
              state: prop.state,
              zipCode: (buildingData.zipCode as string) || null,
              lat,
              lng,
              listingUrl,
              website: (buildingData.website as string) || null,
              primaryPhotoUrl: (buildingData.image as string) || null,
              phone: (buildingData.phone as string) || null,
              managementId: mgmt.id,
              neighborhoodId,
              lastSyncedAt: new Date(),
            },
          })
          result.created++
        }
      } catch (dbError) {
        // If duplicate constraint, try to find and update existing
        const existing = await prisma.building.findFirst({
          where: { managementId: mgmt.id, address },
        })
        if (existing) {
          building = await prisma.building.update({
            where: { id: existing.id },
            data: { listingUrl, lastSyncedAt: new Date() },
          })
          result.updated++
        } else {
          console.log(`    DB error: ${dbError instanceof Error ? dbError.message : dbError}`)
          continue
        }
      }

      // Delete existing units and create new ones
      if (units.length > 0) {
        await prisma.unit.deleteMany({ where: { buildingId: building.id } })

        for (const unit of units) {
          await prisma.unit.create({
            data: {
              buildingId: building.id,
              name: unit.name,
              bedrooms: unit.bedrooms,
              bathrooms: unit.bathrooms,
              sqftMin: unit.sqftMin,
              sqftMax: unit.sqftMax,
              rentMin: unit.rentMin,
              rentMax: unit.rentMax,
              availableCount: unit.availableCount,
              photoUrl: unit.photoUrl,
              isAvailable: true,
              lastSyncedAt: new Date(),
            },
          })
          result.unitsCreated++
        }
        console.log(`    Created ${units.length} units`)
      } else {
        console.log(`    No units found`)
      }

      // Rate limit
      await new Promise(r => setTimeout(r, 2000))
    }

    await context.close()
  } catch (error) {
    result.errors.push(`Browser error: ${error instanceof Error ? error.message : error}`)
  } finally {
    if (browser) {
      await browser.close()
    }
  }

  console.log(`\n  Summary: ${result.created} created, ${result.updated} updated, ${result.unitsCreated} units`)

  // Invalidate in-memory cache if data changed
  if (result.created > 0 || result.updated > 0 || result.unitsCreated > 0) {
    invalidateListingsCache()
    console.log('  Cache invalidated')
  }

  return result
}

/**
 * Sync all management companies
 */
export async function fullSyncAll(): Promise<SyncResult[]> {
  const results: SyncResult[] = []

  for (const mgmt of ['greystar', 'maa', 'cortland', 'crescent'] as const) {
    const result = await fullSync(mgmt)
    results.push(result)
  }

  return results
}
