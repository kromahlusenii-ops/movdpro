/**
 * Sync Building Google Place IDs
 *
 * This script looks up Google Place IDs for buildings that don't have one,
 * using the building name and address for the search.
 *
 * Usage: npx tsx scripts/sync-building-place-ids.ts
 *
 * Note: Google Places API charges for Find Place requests.
 * After running this, run sync-building-photos.ts to fetch photos.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

async function syncBuildingPlaceIds() {
  if (!GOOGLE_API_KEY) {
    console.error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set')
    process.exit(1)
  }

  console.log('Finding buildings without Google Place IDs...')

  // Find buildings without googlePlaceId
  const buildings = await prisma.building.findMany({
    where: {
      googlePlaceId: null,
    },
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      state: true,
    },
  })

  console.log(`Found ${buildings.length} buildings to look up`)

  let updated = 0
  let notFound = 0
  let failed = 0

  for (const building of buildings) {
    try {
      console.log(`\nProcessing: ${building.name}`)

      // Create search query from building name and address
      const searchQuery = `${building.name} ${building.address} ${building.city} ${building.state}`

      // Use Find Place API to look up the place ID
      const findPlaceUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id,name,formatted_address&key=${GOOGLE_API_KEY}`

      const response = await fetch(findPlaceUrl)
      const data = await response.json()

      if (data.status !== 'OK' || !data.candidates?.length) {
        console.log(`   No results found`)
        notFound++
        continue
      }

      const candidate = data.candidates[0]
      console.log(`   Found: ${candidate.name}`)
      console.log(`   Address: ${candidate.formatted_address}`)

      // Update the building with the place ID
      await prisma.building.update({
        where: { id: building.id },
        data: { googlePlaceId: candidate.place_id },
      })

      console.log(`   Place ID saved`)
      updated++

      // Rate limit: be conservative with API calls
      await new Promise(resolve => setTimeout(resolve, 200))

    } catch (error) {
      console.error(`   Error:`, error)
      failed++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('Summary:')
  console.log(`   Updated: ${updated}`)
  console.log(`   Not found: ${notFound}`)
  console.log(`   Failed: ${failed}`)
  console.log('='.repeat(50))

  if (updated > 0) {
    console.log('\nNext step: Run sync-building-photos.ts to fetch photos')
  }

  await prisma.$disconnect()
}

syncBuildingPlaceIds().catch(console.error)
