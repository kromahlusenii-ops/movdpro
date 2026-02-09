/**
 * Greystar Discovery Scraper
 *
 * Discovers all Greystar-managed properties in Charlotte from their portfolio page
 * and matches them to existing buildings in the database to populate missing listingUrls.
 *
 * Source: https://www.greystar.com/s/charlotte-nc
 */

import prisma from '@/lib/db'

export interface DiscoveredProperty {
  name: string
  address: string
  greystarUrl: string
}

export interface DiscoveryResult {
  discovered: DiscoveredProperty[]
  matched: number
  updated: number
  errors: string[]
}

const GREYSTAR_SEARCH_URL = 'https://www.greystar.com/s/charlotte-nc'
const GREYSTAR_BASE_URL = 'https://www.greystar.com'

/**
 * Normalize address for matching
 */
function normalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .replace(/[.,#]/g, '')
    .replace(/\bstreet\b/g, 'st')
    .replace(/\bavenue\b/g, 'ave')
    .replace(/\bboulevard\b/g, 'blvd')
    .replace(/\bdrive\b/g, 'dr')
    .replace(/\broad\b/g, 'rd')
    .replace(/\blane\b/g, 'ln')
    .replace(/\bcourt\b/g, 'ct')
    .replace(/\bparkway\b/g, 'pkwy')
    .replace(/\bnorth\b/g, 'n')
    .replace(/\bsouth\b/g, 's')
    .replace(/\beast\b/g, 'e')
    .replace(/\bwest\b/g, 'w')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Normalize property name for matching
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/apartments?/gi, '')
    .replace(/a broadstone community/gi, '')
    .replace(/townhomes?/gi, '')
    .replace(/\bat\b/gi, '')
    .replace(/\bthe\b/gi, '')
    .replace(/[.,\-()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Check if two addresses match (fuzzy matching)
 */
function addressesMatch(addr1: string, addr2: string): boolean {
  const n1 = normalizeAddress(addr1)
  const n2 = normalizeAddress(addr2)

  if (n1 === n2) return true

  // Extract street number
  const num1 = n1.match(/^(\d+)/)?.[1]
  const num2 = n2.match(/^(\d+)/)?.[1]

  if (num1 && num2 && num1 === num2) {
    const street1 = n1.replace(/^\d+\s*/, '').split(/\s+/).slice(0, 2).join(' ')
    const street2 = n2.replace(/^\d+\s*/, '').split(/\s+/).slice(0, 2).join(' ')

    if (street1 === street2) return true
    if (street1.includes(street2) || street2.includes(street1)) return true
  }

  return false
}

/**
 * Check if two property names match (fuzzy matching)
 */
function namesMatch(name1: string, name2: string): boolean {
  const n1 = normalizeName(name1)
  const n2 = normalizeName(name2)

  if (n1 === n2) return true
  if (n1.includes(n2) || n2.includes(n1)) return true

  const words1 = new Set(n1.split(' ').filter(w => w.length > 2))
  const words2 = new Set(n2.split(' ').filter(w => w.length > 2))

  let overlap = 0
  for (const w of words1) {
    if (words2.has(w)) overlap++
  }

  const minWords = Math.min(words1.size, words2.size)
  if (minWords > 0 && overlap >= minWords * 0.5) return true

  return false
}

/**
 * Extract property name from URL slug
 */
function extractNameFromSlug(slug: string): string {
  return slug
    .replace(/-charlotte-nc.*$/, '')
    .replace(/-apartments?$/, '')
    .replace(/-/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/**
 * Fetch all pages from Greystar Charlotte search
 */
async function fetchAllGreystarPages(): Promise<string> {
  let allHtml = ''
  let page = 1
  const maxPages = 10

  while (page <= maxPages) {
    const url = page === 1 ? GREYSTAR_SEARCH_URL : `${GREYSTAR_SEARCH_URL}?page=${page}`
    console.log(`Fetching page ${page}...`)

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
      })

      if (!response.ok) break

      const html = await response.text()
      allHtml += html

      // Check if there's a next page
      if (!html.includes(`page=${page + 1}`) && page > 1) break

      page++

      // Rate limit
      await new Promise(r => setTimeout(r, 500))
    } catch {
      break
    }
  }

  return allHtml
}

/**
 * Parse properties from HTML
 */
function parsePropertiesFromHtml(html: string): DiscoveredProperty[] {
  const properties: DiscoveredProperty[] = []
  const seen = new Set<string>()

  // Match property links with their context
  // Pattern: href="/property-name-charlotte-nc/p_12345"
  const linkPattern = /href="(\/[a-z0-9-]+-charlotte-nc\/p_\d+)"/gi
  let match

  while ((match = linkPattern.exec(html)) !== null) {
    const path = match[1]
    if (seen.has(path)) continue
    seen.add(path)

    const greystarUrl = GREYSTAR_BASE_URL + path

    // Extract name from URL slug
    const slugMatch = path.match(/^\/([a-z0-9-]+)-charlotte-nc/)
    const name = slugMatch ? extractNameFromSlug(slugMatch[1]) : ''

    // Try to find address near this link in the HTML
    const linkIndex = match.index
    const contextStart = Math.max(0, linkIndex - 1000)
    const contextEnd = Math.min(html.length, linkIndex + 500)
    const context = html.substring(contextStart, contextEnd)

    // Look for address pattern
    const addressMatch = context.match(/(\d+\s+[A-Za-z0-9\s.]+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Drive|Dr|Road|Rd|Lane|Ln|Way|Court|Ct|Parkway|Pkwy|Circle|Cir)[^<,\n]{0,30})/i)
    let address = addressMatch?.[1]?.trim() || ''

    // Clean up address
    address = address
      .replace(/,?\s*Charlotte,?\s*NC\s*\d*/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim()

    if (name) {
      properties.push({ name, address, greystarUrl })
    }
  }

  return properties
}

/**
 * Discover all Greystar properties in Charlotte
 */
export async function discoverGreystarProperties(): Promise<DiscoveryResult> {
  const errors: string[] = []
  let discovered: DiscoveredProperty[] = []

  try {
    console.log('Fetching Greystar Charlotte properties...')
    const html = await fetchAllGreystarPages()

    if (!html) {
      errors.push('Failed to fetch Greystar search page')
      return { discovered: [], matched: 0, updated: 0, errors }
    }

    discovered = parsePropertiesFromHtml(html)
    console.log(`Discovered ${discovered.length} properties`)

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    errors.push(`Discovery error: ${message}`)
  }

  // Match discovered properties to existing buildings
  console.log('\nMatching to existing buildings...')

  const buildings = await prisma.building.findMany({
    where: {
      management: { slug: 'greystar' },
      listingUrl: null
    },
    select: {
      id: true,
      name: true,
      address: true,
      website: true,
    },
  })

  console.log(`Found ${buildings.length} buildings without listingUrl`)

  let matched = 0
  let updated = 0

  for (const building of buildings) {
    const match = discovered.find(d => {
      // Match by address first (most reliable)
      if (building.address && d.address && addressesMatch(building.address, d.address)) {
        return true
      }
      // Fall back to name matching
      if (namesMatch(building.name, d.name)) {
        return true
      }
      return false
    })

    if (match) {
      matched++
      console.log(`  Matched: "${building.name}" -> ${match.greystarUrl}`)

      try {
        await prisma.building.update({
          where: { id: building.id },
          data: {
            listingUrl: match.greystarUrl,
          },
        })
        updated++
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        errors.push(`Failed to update ${building.name}: ${message}`)
      }
    } else {
      console.log(`  No match: "${building.name}" (${building.address})`)
    }
  }

  console.log(`\nMatched: ${matched}, Updated: ${updated}`)

  return {
    discovered,
    matched,
    updated,
    errors,
  }
}

export default {
  name: 'Greystar Discovery',
  slug: 'greystar-discovery',
  discover: discoverGreystarProperties,
}
