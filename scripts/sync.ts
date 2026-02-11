/**
 * Sync Script — Discover properties, scrape buildings + units + deals
 *
 * Run: npx tsx scripts/sync.ts
 *
 * Steps:
 * 1. fullSyncAll() — discover properties from portfolio pages, scrape buildings + units
 * 2. Standalone scrapers — scrape each provider for specials/deals
 * 3. syncSpecialsFromBuildings() — save deals to the database
 * 4. Cleanup — deactivate stale + expired specials
 */

import { fullSyncAll } from '../src/lib/scrapers/full-sync'
import { scrapeGreystarCharlotte } from '../src/lib/scrapers/greystar'
import { scrapeMAACHarlotte } from '../src/lib/scrapers/maa'
import { scrapeCortlandCharlotte } from '../src/lib/scrapers/cortland'
import { scrapeCrescentCharlotte } from '../src/lib/scrapers/crescent'
import {
  syncSpecialsFromBuildings,
  deactivateStaleSpecials,
  deactivateExpiredSpecials,
} from '../src/lib/scrapers/specials-sync'
import prisma from '../src/lib/db'

async function main() {
  const startTime = Date.now()
  console.log('='.repeat(60))
  console.log('MOVD Pro — Full Sync')
  console.log(`Started at ${new Date().toISOString()}`)
  console.log('='.repeat(60))

  // ── Step 1: Full sync (discover + scrape buildings & units) ──
  console.log('\n[1/4] Running full sync (buildings + units)...\n')
  const syncResults = await fullSyncAll()

  let totalDiscovered = 0
  let totalCreated = 0
  let totalUpdated = 0
  let totalUnits = 0
  const syncErrors: string[] = []

  for (const r of syncResults) {
    totalDiscovered += r.discovered
    totalCreated += r.created
    totalUpdated += r.updated
    totalUnits += r.unitsCreated
    syncErrors.push(...r.errors)
  }

  console.log(`\n  Buildings: ${totalDiscovered} discovered, ${totalCreated} created, ${totalUpdated} updated`)
  console.log(`  Units: ${totalUnits} created`)
  if (syncErrors.length > 0) {
    console.log(`  Errors: ${syncErrors.length}`)
  }

  // ── Step 2: Scrape specials/deals from each provider ──
  console.log('\n[2/4] Scraping specials/deals...\n')

  const scrapers = [
    { name: 'Greystar', slug: 'greystar', fn: scrapeGreystarCharlotte },
    { name: 'MAA', slug: 'maa', fn: scrapeMAACHarlotte },
    { name: 'Cortland', slug: 'cortland', fn: scrapeCortlandCharlotte },
    { name: 'Crescent Communities', slug: 'crescent', fn: scrapeCrescentCharlotte },
  ]

  let totalSpecialsCreated = 0
  let totalSpecialsUpdated = 0
  const specialsErrors: string[] = []

  for (const scraper of scrapers) {
    console.log(`  Scraping ${scraper.name} specials...`)
    try {
      const result = await scraper.fn()
      console.log(`    Found ${result.buildings.length} buildings`)

      const buildingsWithSpecials = result.buildings.filter(
        (b) => b.specials && b.specials.length > 0
      )
      console.log(`    ${buildingsWithSpecials.length} buildings have specials`)

      if (buildingsWithSpecials.length > 0) {
        // ── Step 3: Save specials to database ──
        const specialsResult = await syncSpecialsFromBuildings(
          result.buildings,
          scraper.slug
        )
        totalSpecialsCreated += specialsResult.totalCreated
        totalSpecialsUpdated += specialsResult.totalUpdated
        specialsErrors.push(...specialsResult.errors)
      }

      if (result.errors.length > 0) {
        console.log(`    Scrape errors: ${result.errors.length}`)
        specialsErrors.push(...result.errors)
      }
    } catch (error) {
      const msg = `${scraper.name} scraper failed: ${error instanceof Error ? error.message : error}`
      console.error(`    ${msg}`)
      specialsErrors.push(msg)
    }
  }

  console.log(`\n  Specials: ${totalSpecialsCreated} created, ${totalSpecialsUpdated} updated`)

  // ── Step 4: Cleanup stale + expired specials ──
  console.log('\n[3/4] Cleaning up stale specials...\n')

  const staleDeactivated =
    (await deactivateStaleSpecials('greystar')) +
    (await deactivateStaleSpecials('maa')) +
    (await deactivateStaleSpecials('cortland')) +
    (await deactivateStaleSpecials('crescent'))
  console.log(`  Deactivated ${staleDeactivated} stale specials (not scraped in 48h)`)

  const expiredDeactivated = await deactivateExpiredSpecials()
  console.log(`  Deactivated ${expiredDeactivated} expired specials`)

  // ── Summary ──
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log('\n' + '='.repeat(60))
  console.log('SYNC COMPLETE')
  console.log('='.repeat(60))
  console.log(`  Buildings:  ${totalCreated} new, ${totalUpdated} updated`)
  console.log(`  Units:      ${totalUnits} created`)
  console.log(`  Specials:   ${totalSpecialsCreated} new, ${totalSpecialsUpdated} updated`)
  console.log(`  Cleanup:    ${staleDeactivated + expiredDeactivated} deactivated`)
  console.log(`  Errors:     ${syncErrors.length + specialsErrors.length}`)
  console.log(`  Duration:   ${elapsed}s`)
  console.log('='.repeat(60))

  if (syncErrors.length + specialsErrors.length > 0) {
    console.log('\nErrors:')
    for (const err of [...syncErrors, ...specialsErrors]) {
      console.log(`  - ${err}`)
    }
  }
}

main()
  .catch((e) => {
    console.error('Sync failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
