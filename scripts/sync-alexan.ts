/**
 * Sync Alexan Buildings — Scrape Alexan-style floor plan pages
 *
 * Alexan uses a specific HTML structure:
 * - .floor-plan divs with bed-X class (bed-0 = studio, bed-1 = 1BR, etc.)
 * - .rent-container with "Base Rent from $X"
 * - .detail-bar with bedroom/bath/sqft info
 * - h2 with floor plan name (S1, A1, B1, etc.)
 *
 * Run: npx tsx scripts/sync-alexan.ts
 */

import { chromium } from 'playwright'
import prisma from '../src/lib/db'

async function main() {
  // Find Alexan buildings or buildings with 0 units that have floor-plans URL
  const buildings = await prisma.building.findMany({
    where: {
      isAvailable: true,
      OR: [
        { website: { contains: 'alexan' } },
        { listingUrl: { contains: 'alexan' } },
        {
          units: { none: {} },
          floorplansUrl: { contains: 'floor-plans' },
        },
      ],
    },
    include: {
      management: { select: { name: true, slug: true } },
      _count: { select: { units: true } },
    },
  })

  console.log(`Found ${buildings.length} Alexan-style buildings:\n`)
  for (const b of buildings) {
    console.log(`  - ${b.name} (${b._count.units} units)`)
    console.log(`    URL: ${b.floorplansUrl || b.listingUrl}`)
  }

  if (buildings.length === 0) {
    console.log('No Alexan buildings found.')
    return
  }

  console.log('\n' + '='.repeat(60))
  console.log('Starting scrape...')
  console.log('='.repeat(60) + '\n')

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  })

  const page = await context.newPage()

  for (const building of buildings) {
    const baseUrl = building.listingUrl?.replace(/\/$/, '') || ''
    let floorplansUrl = building.floorplansUrl

    // Try to find floor plans page if not set
    if (!floorplansUrl) {
      const paths = ['/floor-plans/', '/floorplans/', '/floor-plans', '/floorplans']
      for (const path of paths) {
        const tryUrl = `${baseUrl}${path}`
        try {
          const response = await page.goto(tryUrl, { waitUntil: 'networkidle', timeout: 30000 })
          if (response && response.status() < 400) {
            floorplansUrl = tryUrl
            break
          }
        } catch {
          // Try next
        }
      }
    }

    if (!floorplansUrl) {
      console.log(`\n[SKIP] ${building.name} - no floor plans URL found`)
      continue
    }

    console.log(`\n[SCRAPING] ${building.name}`)
    console.log(`  URL: ${floorplansUrl}`)

    try {
      await page.goto(floorplansUrl, { waitUntil: 'networkidle', timeout: 60000 })
      await page.waitForTimeout(3000)
    } catch (e) {
      console.log(`  ✗ Failed to load page: ${e}`)
      continue
    }

    // Extract floor plans using Alexan-specific selectors
    const floorPlanData = await page.evaluate(() => {
      const results: Array<{
        name: string
        beds: number
        baths: number
        sqftMin: number | null
        sqftMax: number | null
        rentMin: number
        rentMax: number
        availableCount: number
      }> = []

      // Find all .floor-plan elements
      const floorPlanElements = document.querySelectorAll('.floor-plan')

      for (const fp of floorPlanElements) {
        // Get bedroom count from class (bed-0, bed-1, bed-1d, bed-2, etc.)
        const classes = fp.className || ''
        let beds = 1
        const bedMatch = classes.match(/bed-(\d+)/)
        if (bedMatch) {
          beds = parseInt(bedMatch[1], 10)
        }

        // Get floor plan name from h2
        const nameEl = fp.querySelector('h2, .fp-name, [class*="name"]')
        const name = nameEl?.textContent?.trim().split('\n')[0] || ''

        // Get rent from .rent-container
        const rentEl = fp.querySelector('.rent-container')
        const rentText = rentEl?.textContent || ''
        let rentMin = 0
        let rentMax = 0
        const rentMatch = rentText.match(/\$[\d,]+/)
        if (rentMatch) {
          const rent = parseInt(rentMatch[0].replace(/[$,]/g, ''), 10)
          rentMin = rentMax = rent
        }

        // Get bath and sqft from detail-bar
        const detailBar = fp.querySelector('.detail-bar, ul')
        const detailText = detailBar?.textContent || ''

        // Parse bathrooms
        const bathMatch = detailText.match(/(\d+\.?\d*)\s*(?:bath|ba)/i)
        const baths = bathMatch ? parseFloat(bathMatch[1]) : 1

        // Parse sqft
        let sqftMin: number | null = null
        let sqftMax: number | null = null
        const sqftMatch = detailText.match(/(\d{3,4})\s*(?:sq|sf)/i)
        if (sqftMatch) {
          sqftMin = sqftMax = parseInt(sqftMatch[1], 10)
        }

        // Get available count
        const availEl = fp.querySelector('.avail, [class*="avail"]')
        const availText = availEl?.textContent || ''
        const availMatch = availText.match(/(\d+)\s*unit/i)
        const availableCount = availMatch ? parseInt(availMatch[1], 10) : 1

        if (rentMin > 0) {
          results.push({
            name,
            beds,
            baths,
            sqftMin,
            sqftMax,
            rentMin,
            rentMax,
            availableCount,
          })
        }
      }

      return results
    })

    console.log(`  Found ${floorPlanData.length} floor plans`)

    if (floorPlanData.length === 0) {
      await page.screenshot({ path: `debug-${building.name.replace(/\s+/g, '-')}.png` })
      console.log(`  Screenshot saved for debugging`)
      continue
    }

    // Log first few for verification
    for (const fp of floorPlanData.slice(0, 5)) {
      console.log(`    ${fp.name}: ${fp.beds}BR/${fp.baths}BA, ${fp.sqftMin}sqft, $${fp.rentMin} (${fp.availableCount} units)`)
    }
    if (floorPlanData.length > 5) {
      console.log(`    ... and ${floorPlanData.length - 5} more`)
    }

    // Delete existing units and create new ones
    const deletedCount = await prisma.unit.deleteMany({
      where: { buildingId: building.id },
    })
    if (deletedCount.count > 0) {
      console.log(`  Deleted ${deletedCount.count} existing units`)
    }

    let unitsCreated = 0
    for (const fp of floorPlanData) {
      try {
        await prisma.unit.create({
          data: {
            buildingId: building.id,
            name: fp.name || null,
            bedrooms: fp.beds,
            bathrooms: fp.baths,
            sqftMin: fp.sqftMin,
            sqftMax: fp.sqftMax,
            rentMin: fp.rentMin,
            rentMax: fp.rentMax,
            isAvailable: true,
            availableCount: fp.availableCount,
          },
        })
        unitsCreated++
      } catch (e) {
        console.log(`  Error creating unit: ${e}`)
      }
    }

    // Update building floorplansUrl if not set
    if (!building.floorplansUrl && floorplansUrl) {
      await prisma.building.update({
        where: { id: building.id },
        data: { floorplansUrl },
      })
    }

    console.log(`  ✓ Created ${unitsCreated} units`)

    // Rate limit
    await new Promise((r) => setTimeout(r, 2000))
  }

  await context.close()
  await browser.close()

  console.log('\n' + '='.repeat(60))
  console.log('SYNC COMPLETE')
  console.log('='.repeat(60))
}

main()
  .catch((e) => {
    console.error('Sync failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
