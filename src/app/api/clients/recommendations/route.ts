/**
 * Client Recommendations API
 *
 * Get recommended listings based on client preferences.
 * Takes into account: budget, bedrooms, neighborhoods, vibes, priorities, pets, etc.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserCached } from '@/lib/pro-auth'
import prisma from '@/lib/db'
import { NEIGHBORHOOD_PROFILES } from '@/lib/constants'

interface ClientPreferences {
  budgetMin?: number
  budgetMax?: number
  bedrooms: string[]
  neighborhoods: string[]
  vibes: string[]
  priorities: string[]
  hasDog: boolean
  hasCat: boolean
  hasKids: boolean
  worksFromHome: boolean
  needsParking: boolean
  commutePreference?: string
}

// Score a building based on client preferences
function scoreBuildingForClient(
  building: {
    neighborhood: { name: string; slug: string } | null
    amenities: string[]
    rating: number | null
  },
  preferences: ClientPreferences
): number {
  let score = 50 // Base score

  const neighborhoodSlug = building.neighborhood?.slug
  const neighborhoodName = building.neighborhood?.name
  const profile = neighborhoodSlug ? NEIGHBORHOOD_PROFILES[neighborhoodSlug] : null

  // Neighborhood match bonus
  if (neighborhoodName && preferences.neighborhoods.includes(neighborhoodName)) {
    score += 20
  }

  // Building rating bonus
  if (building.rating) {
    score += building.rating * 2 // Up to +10 points for 5-star rating
  }

  if (profile) {
    // Vibe matching
    for (const vibe of preferences.vibes) {
      if (profile.bestVibes.includes(vibe as typeof profile.bestVibes[number])) {
        score += 10
      }
      if (profile.avoidVibes.includes(vibe as typeof profile.avoidVibes[number])) {
        score -= 10
      }
    }

    // Priority matching
    for (const priority of preferences.priorities) {
      switch (priority) {
        case 'quiet':
          if (profile.nightlifeScore <= 2) score += 8
          break
        case 'walkable':
          score += profile.walkScore * 2
          break
        case 'nightlife':
          score += profile.nightlifeScore * 2
          break
        case 'family-friendly':
          score += profile.familyScore * 2
          break
        case 'safe':
          score += profile.safetyScore * 3
          break
        case 'good-transit':
          score += profile.transitScore * 2
          break
        case 'parks':
          if (profile.walkScore >= 4) score += 5
          break
        case 'trendy':
          if (profile.priceLevel === 'very-expensive' || profile.priceLevel === 'expensive') {
            score += 5
          }
          break
      }
    }

    // Pet matching
    if (preferences.hasDog && profile.dogFriendly) {
      score += 8
    }
    if (preferences.hasKids && profile.kidFriendly) {
      score += 10
    }

    // Commute preference matching
    if (preferences.commutePreference === 'walkable' && profile.walkScore >= 4) {
      score += 8
    }
    if (preferences.commutePreference === 'transit' && profile.transitAccess !== 'none') {
      score += 8
    }

    // Works from home - prefer quieter neighborhoods
    if (preferences.worksFromHome && profile.nightlifeScore <= 3) {
      score += 5
    }
  }

  // Amenity matching
  const petAmenities = ['dog park', 'pet friendly', 'pet spa', 'bark park']
  const parkingAmenities = ['parking', 'garage', 'covered parking']
  const fitnessAmenities = ['gym', 'fitness center', 'fitness']
  const poolAmenities = ['pool', 'swimming pool']

  const buildingAmenitiesLower = building.amenities.map(a => a.toLowerCase())

  if (preferences.hasDog && petAmenities.some(a => buildingAmenitiesLower.some(ba => ba.includes(a)))) {
    score += 8
  }
  if (preferences.needsParking && parkingAmenities.some(a => buildingAmenitiesLower.some(ba => ba.includes(a)))) {
    score += 5
  }

  // General amenity bonuses
  if (fitnessAmenities.some(a => buildingAmenitiesLower.some(ba => ba.includes(a)))) {
    score += 3
  }
  if (poolAmenities.some(a => buildingAmenitiesLower.some(ba => ba.includes(a)))) {
    score += 2
  }

  return Math.min(100, Math.max(0, score))
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUserCached()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const locator = await prisma.locatorProfile.findUnique({
      where: { userId: user.id },
    })

    if (!locator) {
      return NextResponse.json({ error: 'No locator profile' }, { status: 404 })
    }

    const body: ClientPreferences = await request.json()
    const {
      budgetMin,
      budgetMax,
      bedrooms,
      neighborhoods,
      vibes,
      priorities,
      hasDog,
      hasCat,
      hasKids,
      worksFromHome,
      needsParking,
      commutePreference,
    } = body

    // Build unit query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unitWhere: any = {
      isAvailable: true,
    }

    // Budget filter
    if (budgetMin) {
      unitWhere.rentMax = { gte: budgetMin }
    }
    if (budgetMax) {
      unitWhere.rentMin = { lte: budgetMax }
    }

    // Bedrooms filter
    if (bedrooms && bedrooms.length > 0) {
      const bedroomNums = bedrooms.map((b) => {
        if (b === 'studio') return 0
        if (b === '1br') return 1
        if (b === '2br') return 2
        if (b === '3br+' || b === '3br') return 3
        return parseInt(b)
      })
      unitWhere.bedrooms = { in: bedroomNums }
    }

    // Building filters for neighborhoods
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buildingWhere: any = {
      isAvailable: true,
    }

    // Get all matching neighborhoods (preferred + related based on vibes/priorities)
    const allNeighborhoods = new Set(neighborhoods || [])

    // Add related neighborhoods based on vibes
    if (vibes && vibes.length > 0) {
      for (const [slug, profile] of Object.entries(NEIGHBORHOOD_PROFILES)) {
        for (const vibe of vibes) {
          if (profile.bestVibes.includes(vibe as typeof profile.bestVibes[number])) {
            // Find the name for this slug
            const neighborhoodName = Object.entries(NEIGHBORHOOD_PROFILES)
              .find(([s]) => s === slug)?.[0]
            if (neighborhoodName) {
              // Convert slug to name (e.g., 'south-end' -> 'South End')
              const name = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
              allNeighborhoods.add(name)
            }
          }
        }
      }
    }

    // Apply neighborhood filter if we have any
    if (allNeighborhoods.size > 0) {
      buildingWhere.neighborhood = {
        name: { in: Array.from(allNeighborhoods) },
      }
    }

    // Apply building filters to unit query
    unitWhere.building = buildingWhere

    // Fetch listings with building and neighborhood context
    const listings = await prisma.unit.findMany({
      where: unitWhere,
      include: {
        building: {
          include: {
            neighborhood: {
              select: {
                id: true,
                name: true,
                slug: true,
                grade: true,
                walkScore: true,
                transitScore: true,
              },
            },
            management: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
              },
            },
          },
        },
      },
      take: 100, // Get more to score and filter
    })

    // Score and sort listings
    const scoredListings = listings.map((listing) => {
      const score = scoreBuildingForClient(
        {
          neighborhood: listing.building.neighborhood,
          amenities: listing.building.amenities,
          rating: listing.building.rating,
        },
        {
          budgetMin,
          budgetMax,
          bedrooms: bedrooms || [],
          neighborhoods: neighborhoods || [],
          vibes: vibes || [],
          priorities: priorities || [],
          hasDog: hasDog || false,
          hasCat: hasCat || false,
          hasKids: hasKids || false,
          worksFromHome: worksFromHome || false,
          needsParking: needsParking || false,
          commutePreference,
        }
      )

      return {
        id: listing.id,
        unitNumber: listing.unitNumber,
        name: listing.name,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        sqftMin: listing.sqftMin,
        sqftMax: listing.sqftMax,
        rentMin: listing.rentMin,
        rentMax: listing.rentMax,
        building: {
          id: listing.building.id,
          name: listing.building.name,
          address: listing.building.address,
          city: listing.building.city,
          state: listing.building.state,
          lat: listing.building.lat,
          lng: listing.building.lng,
          primaryPhotoUrl: listing.building.primaryPhotoUrl,
          amenities: listing.building.amenities,
          rating: listing.building.rating,
          reviewCount: listing.building.reviewCount,
          listingUrl: listing.building.listingUrl,
        },
        neighborhood: listing.building.neighborhood,
        management: listing.building.management,
        matchScore: score,
      }
    })

    // Sort by score and take top 10
    const recommendations = scoredListings
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10)

    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error('Get recommendations error:', error)
    return NextResponse.json({ error: 'Failed to get recommendations' }, { status: 500 })
  }
}
