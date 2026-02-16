/**
 * Building Photos Sync
 *
 * Syncs Google Place IDs and photos for buildings.
 */

import prisma from '../db'

// Server-only key preferred; NEXT_PUBLIC_ exposes key to client bundle
const GOOGLE_API_KEY =
  process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

interface SyncResult {
  updated: number
  notFound: number
  failed: number
  errors: string[]
}

/**
 * Sync Google Place IDs for buildings that don't have one
 */
export async function syncBuildingPlaceIds(): Promise<SyncResult> {
  const result: SyncResult = { updated: 0, notFound: 0, failed: 0, errors: [] }

  if (!GOOGLE_API_KEY) {
    result.errors.push('GOOGLE_MAPS_API_KEY not set')
    return result
  }

  const buildings = await prisma.building.findMany({
    where: { googlePlaceId: null },
    select: { id: true, name: true, address: true, city: true, state: true },
  })

  for (const building of buildings) {
    try {
      const searchQuery = `${building.name} ${building.address} ${building.city} ${building.state}`
      const findPlaceUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id,name&key=${GOOGLE_API_KEY}`

      const response = await fetch(findPlaceUrl)
      const data = await response.json()

      if (data.status !== 'OK' || !data.candidates?.length) {
        result.notFound++
        continue
      }

      await prisma.building.update({
        where: { id: building.id },
        data: { googlePlaceId: data.candidates[0].place_id },
      })

      result.updated++
      await new Promise((resolve) => setTimeout(resolve, 200))
    } catch (error) {
      result.failed++
      result.errors.push(`${building.name}: ${error instanceof Error ? error.message : error}`)
    }
  }

  return result
}

/**
 * Sync photos for buildings that have a Google Place ID but no photo
 */
export async function syncBuildingPhotos(): Promise<SyncResult> {
  const result: SyncResult = { updated: 0, notFound: 0, failed: 0, errors: [] }

  if (!GOOGLE_API_KEY) {
    result.errors.push('GOOGLE_MAPS_API_KEY not set')
    return result
  }

  const buildings = await prisma.building.findMany({
    where: {
      googlePlaceId: { not: null },
      primaryPhotoUrl: null,
    },
    select: { id: true, name: true, googlePlaceId: true },
  })

  for (const building of buildings) {
    try {
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${building.googlePlaceId}&fields=photos&key=${GOOGLE_API_KEY}`

      const detailsRes = await fetch(detailsUrl)
      const detailsData = await detailsRes.json()

      if (detailsData.status !== 'OK') {
        result.failed++
        continue
      }

      if (!detailsData.result?.photos?.length) {
        result.notFound++
        continue
      }

      const photoReference = detailsData.result.photos[0].photo_reference
      const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoReference}&key=${GOOGLE_API_KEY}`

      await prisma.building.update({
        where: { id: building.id },
        data: { primaryPhotoUrl: photoUrl },
      })

      result.updated++
      await new Promise((resolve) => setTimeout(resolve, 100))
    } catch (error) {
      result.failed++
      result.errors.push(`${building.name}: ${error instanceof Error ? error.message : error}`)
    }
  }

  return result
}
