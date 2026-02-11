/**
 * Sync Crescent Communities Only
 *
 * Run: npx tsx scripts/sync-crescent.ts
 */

import { fullSync } from '../src/lib/scrapers/full-sync'
import { scrapeCrescentCharlotte } from '../src/lib/scrapers/crescent'
import {
  syncSpecialsFromBuildings,
  deactivateStaleSpecials,
} from '../src/lib/scrapers/specials-sync'
import prisma from '../src/lib/db'

async function main() {
  const startTime = Date.now()
  console.log('='.repeat(60))
  console.log('MOVD Pro — Crescent Communities Sync')
  console.log(`Started at ${new Date().toISOString()}`)
  console.log('='.repeat(60))

  // Step 1: Full sync for Crescent (buildings + units)
  console.log('\n[1/3] Syncing Crescent buildings + units...\n')
  const syncResult = await fullSync('crescent')

  console.log(`\n  Buildings: ${syncResult.discovered} discovered, ${syncResult.created} created, ${syncResult.updated} updated`)
  console.log(`  Units: ${syncResult.unitsCreated} created`)
  if (syncResult.errors.length > 0) {
    console.log(`  Errors: ${syncResult.errors.length}`)
  }

  // Step 2: Scrape specials
  console.log('\n[2/3] Scraping Crescent specials...\n')
  let specialsCreated = 0
  let specialsUpdated = 0
  const specialsErrors: string[] = []

  try {
    const result = await scrapeCrescentCharlotte()
    console.log(`  Found ${result.buildings.length} buildings`)

    const buildingsWithSpecials = result.buildings.filter(
      (b) => b.specials && b.specials.length > 0
    )
    console.log(`  ${buildingsWithSpecials.length} buildings have specials`)

    if (buildingsWithSpecials.length > 0) {
      const specialsResult = await syncSpecialsFromBuildings(
        result.buildings,
        'crescent'
      )
      specialsCreated = specialsResult.totalCreated
      specialsUpdated = specialsResult.totalUpdated
      specialsErrors.push(...specialsResult.errors)
    }
  } catch (error) {
    const msg = `Crescent scraper failed: ${error instanceof Error ? error.message : error}`
    console.error(`  ${msg}`)
    specialsErrors.push(msg)
  }

  console.log(`\n  Specials: ${specialsCreated} created, ${specialsUpdated} updated`)

  // Step 3: Cleanup stale specials
  console.log('\n[3/3] Cleaning up stale Crescent specials...\n')
  const staleDeactivated = await deactivateStaleSpecials('crescent')
  console.log(`  Deactivated ${staleDeactivated} stale specials`)

  // Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log('\n' + '='.repeat(60))
  console.log('CRESCENT SYNC COMPLETE')
  console.log('='.repeat(60))
  console.log(`  Buildings:  ${syncResult.created} new, ${syncResult.updated} updated`)
  console.log(`  Units:      ${syncResult.unitsCreated} created`)
  console.log(`  Specials:   ${specialsCreated} new, ${specialsUpdated} updated`)
  console.log(`  Duration:   ${elapsed}s`)
  console.log('='.repeat(60))

  const allErrors = [...syncResult.errors, ...specialsErrors]
  if (allErrors.length > 0) {
    console.log('\nErrors:')
    for (const err of allErrors) {
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
