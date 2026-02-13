/**
 * Sync Building Photos from Google Places API
 *
 * This script fetches photos for buildings that have a googlePlaceId.
 *
 * Usage:
 *   npx tsx scripts/sync-building-photos.ts           # Only buildings without photos
 *   npx tsx scripts/sync-building-photos.ts --refresh # Refresh all building photos
 *
 * Note: Google Places API charges ~$7 per 1000 photo requests.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

async function syncBuildingPhotos() {
  if (!GOOGLE_API_KEY) {
    console.error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set')
    process.exit(1)
  }

  const refreshAll = process.argv.includes('--refresh')

  if (refreshAll) {
    console.log('Refreshing ALL building photos from Google Places...')
  } else {
    console.log('Finding buildings without photos...')
  }

  // Find buildings with googlePlaceId
  const buildings = await prisma.building.findMany({
    where: {
      googlePlaceId: { not: null },
      ...(refreshAll ? {} : { primaryPhotoUrl: null }),
    },
    select: {
      id: true,
      name: true,
      googlePlaceId: true,
    },
  })

  console.log(`Found ${buildings.length} buildings to update`)

  let updated = 0
  let failed = 0
  let noPhoto = 0

  for (const building of buildings) {
    try {
      console.log(`\nProcessing: ${building.name}`)

      // Fetch place details to get photo reference
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${building.googlePlaceId}&fields=photos&key=${GOOGLE_API_KEY}`

      const detailsRes = await fetch(detailsUrl)
      const detailsData = await detailsRes.json()

      if (detailsData.status !== 'OK') {
        console.log(`   API error: ${detailsData.status}`)
        failed++
        continue
      }

      if (!detailsData.result?.photos?.length) {
        console.log(`   No photos available`)
        noPhoto++
        continue
      }

      // Get the first photo reference
      const photoReference = detailsData.result.photos[0].photo_reference

      // Construct the photo URL
      const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoReference}&key=${GOOGLE_API_KEY}`

      // Update the building
      await prisma.building.update({
        where: { id: building.id },
        data: { primaryPhotoUrl: photoUrl },
      })

      console.log(`   Photo URL saved`)
      updated++

      // Rate limit: 50 requests per second max, let's be conservative
      await new Promise(resolve => setTimeout(resolve, 100))

    } catch (error) {
      console.error(`   Error:`, error)
      failed++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('Summary:')
  console.log(`   Updated: ${updated}`)
  console.log(`   No photo: ${noPhoto}`)
  console.log(`   Failed: ${failed}`)
  console.log('='.repeat(50))

  await prisma.$disconnect()
}

syncBuildingPhotos().catch(console.error)
