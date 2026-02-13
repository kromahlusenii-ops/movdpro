/**
 * Sync Empty Buildings — Scrape buildings with 0 units
 *
 * Run: npx tsx scripts/sync-empty.ts
 */

import { chromium } from 'playwright'
import prisma from '../src/lib/db'

async function main() {
  console.log('Finding buildings with 0 units...\n')

  // Get buildings with no units
  const emptyBuildings = await prisma.building.findMany({
    where: {
      isAvailable: true,
      units: { none: {} },
    },
    include: {
      management: { select: { name: true, slug: true } },
    },
  })

  console.log(`Found ${emptyBuildings.length} buildings with 0 units:\n`)
  for (const b of emptyBuildings) {
    console.log(`  - ${b.name} (${b.management?.name || 'unknown'})`)
    console.log(`    URL: ${b.listingUrl}`)
  }

  if (emptyBuildings.length === 0) {
    console.log('All buildings have units!')
    return
  }

  console.log('\n' + '='.repeat(60))
  console.log('Starting scrape...')
  console.log('='.repeat(60) + '\n')

  // Launch browser
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

  for (const building of emptyBuildings) {
    if (!building.listingUrl) {
      console.log(`\n[SKIP] ${building.name} - no listing URL`)
      continue
    }

    console.log(`\n[SCRAPING] ${building.name}`)
    console.log(`  URL: ${building.listingUrl}`)

    const baseUrl = building.listingUrl.replace(/\/$/, '')

    // Try different floor plans URL formats
    const floorplansPaths = ['/floorplans/', '/floor-plans/', '/floorplans', '/floor-plans', '/#floorplan', '']
    let floorplansUrl: string | null = null

    for (const path of floorplansPaths) {
      const tryUrl = path ? `${baseUrl}${path}` : baseUrl
      try {
        console.log(`  Trying: ${tryUrl}`)
        const response = await page.goto(tryUrl, { waitUntil: 'networkidle', timeout: 30000 })
        if (response && response.status() < 400) {
          // For main page URLs, check if there's floor plan content
          if (path === '' || path === '/#floorplan') {
            const hasFloorPlans = await page.evaluate(() => {
              return document.querySelector('[class*="floorplan"], [class*="floor-plan"], #floorplan, .fp-card') !== null
            })
            if (hasFloorPlans) {
              floorplansUrl = tryUrl
              console.log(`  ✓ Found floor plans on main page`)
              break
            }
          } else {
            floorplansUrl = tryUrl
            console.log(`  ✓ Found floor plans page`)
            break
          }
        }
      } catch (e) {
        // Try next
      }
    }

    if (!floorplansUrl) {
      console.log(`  ✗ No floor plans page found`)
      continue
    }

    // Wait for content
    await page.waitForTimeout(3000)

    // For MAA pages, try clicking on "Floor Plan" tab if it exists
    try {
      const fpTabClicked = await page.evaluate(() => {
        const tabs = document.querySelectorAll('a, button, [role="tab"]')
        for (const tab of tabs) {
          const text = tab.textContent?.toLowerCase() || ''
          if (text.includes('floor plan') || text.includes('floorplan')) {
            ;(tab as HTMLElement).click()
            return true
          }
        }
        return false
      })
      if (fpTabClicked) {
        console.log(`  Clicked floor plan tab`)
        await page.waitForTimeout(3000)
      }
    } catch (e) {
      // Tab click failed, continue with current content
    }

    // Extract floor plans
    const floorPlanData = await page.evaluate(() => {
      const results: Array<{
        name: string | null
        beds: number
        baths: number
        sqftMin: number | null
        sqftMax: number | null
        rentMin: number
        rentMax: number
      }> = []

      // Try various selectors
      const cardSelectors = [
        '[data-jd-fp-selector]',
        '.fp-card',
        '.floorplan-card',
        '.floor-plan-card',
        '[class*="floorplan"]',
        '.unit-card',
        '.unit-type-card',
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
            text.length < 1500
          ) {
            // Check it's not a parent of already found
            const isParent = cards.some((c) => el.contains(c))
            if (!isParent) cards.push(el)
          }
        }
      }

      for (const card of cards) {
        const text = card.textContent || ''
        if (!text.match(/\$[\d,]+/)) continue

        // Parse bedrooms
        let beds = 1
        if (text.toLowerCase().includes('studio')) {
          beds = 0
        } else {
          const bedMatch = text.match(/(\d+)\s*(?:bed|br|bedroom)/i)
          if (bedMatch) beds = parseInt(bedMatch[1], 10)
        }

        // Parse bathrooms
        const bathMatch = text.match(/(\d+\.?\d*)\s*(?:bath|ba)/i)
        const baths = bathMatch ? parseFloat(bathMatch[1]) : 1

        // Parse sqft
        let sqftMin: number | null = null
        let sqftMax: number | null = null
        const sqftMatch = text.match(/(\d{3,4}(?:\s*[-–]\s*\d{3,4})?)\s*(?:sq|sf)/i)
        if (sqftMatch) {
          const sqftStr = sqftMatch[1].replace(/,/g, '')
          const rangeMatch = sqftStr.match(/(\d+)\s*[-–]\s*(\d+)/)
          if (rangeMatch) {
            sqftMin = parseInt(rangeMatch[1], 10)
            sqftMax = parseInt(rangeMatch[2], 10)
          } else {
            sqftMin = sqftMax = parseInt(sqftStr, 10)
          }
        }

        // Parse rent
        const rentMatch = text.match(/\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?/i)
        let rentMin = 0, rentMax = 0
        if (rentMatch) {
          const rentStr = rentMatch[0].replace(/[$,]/g, '')
          const rangeMatch = rentStr.match(/(\d+)\s*[-–]\s*(\d+)/)
          if (rangeMatch) {
            rentMin = parseInt(rangeMatch[1], 10)
            rentMax = parseInt(rangeMatch[2], 10)
          } else {
            const singleMatch = rentStr.match(/(\d+)/)
            if (singleMatch) rentMin = rentMax = parseInt(singleMatch[1], 10)
          }
        }

        // Get name
        const nameEl = card.querySelector('.fp-name, .floorplan-name, h3, h4, .title, [class*="name"]')
        const name = nameEl?.textContent?.trim() || null

        if (rentMin > 0) {
          results.push({ name, beds, baths, sqftMin, sqftMax, rentMin, rentMax })
        }
      }

      return results
    })

    console.log(`  Found ${floorPlanData.length} floor plans`)

    if (floorPlanData.length === 0) {
      // Take a screenshot for debugging
      await page.screenshot({ path: `debug-${building.name.replace(/\s+/g, '-')}.png` })
      console.log(`  Screenshot saved for debugging`)
      continue
    }

    // Create units in database
    let unitsCreated = 0
    for (const fp of floorPlanData) {
      try {
        await prisma.unit.create({
          data: {
            buildingId: building.id,
            name: fp.name,
            bedrooms: fp.beds,
            bathrooms: fp.baths,
            sqftMin: fp.sqftMin,
            sqftMax: fp.sqftMax,
            rentMin: fp.rentMin,
            rentMax: fp.rentMax,
            isAvailable: true,
            availableCount: 1,
          },
        })
        unitsCreated++
      } catch (e) {
        console.log(`  Error creating unit: ${e}`)
      }
    }

    // Update building floorplansUrl
    await prisma.building.update({
      where: { id: building.id },
      data: { floorplansUrl },
    })

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
