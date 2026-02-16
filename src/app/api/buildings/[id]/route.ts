/**
 * Building Detail API
 *
 * Get detailed building info with all units.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserCached } from '@/lib/pro-auth'
import { getEntityFieldEdits } from '@/lib/field-edits'
import prisma from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params

    const building = await prisma.building.findUnique({
      where: { id },
      include: {
        neighborhood: {
          select: {
            id: true,
            name: true,
            slug: true,
            grade: true,
            compositeScore: true,
            walkScore: true,
            transitScore: true,
            bikeScore: true,
            description: true,
            highlights: true,
            sentimentSummary: true,
          },
        },
        management: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            website: true,
          },
        },
        units: {
          where: { isAvailable: true },
          orderBy: [{ bedrooms: 'asc' }, { rentMin: 'asc' }],
        },
      },
    })

    if (!building) {
      return NextResponse.json({ error: 'Building not found' }, { status: 404 })
    }

    // Calculate rent range from units
    const rents = building.units.flatMap((u) => [u.rentMin, u.rentMax])
    const rentMin = rents.length > 0 ? Math.min(...rents) : null
    const rentMax = rents.length > 0 ? Math.max(...rents) : null

    // Fetch field edits for this building (included to avoid client-side waterfall)
    const editsMap = await getEntityFieldEdits('building', id)
    const edits: Record<string, unknown> = {}
    editsMap.forEach((value, key) => {
      edits[key] = value
    })

    // Get unique bedroom counts
    const bedroomCounts = [...new Set(building.units.map((u) => u.bedrooms))].sort()
    const bedroomLabels = bedroomCounts.map((c) => {
      if (c === 0) return 'Studio'
      if (c === 1) return '1 BR'
      if (c === 2) return '2 BR'
      return `${c}+ BR`
    })

    return NextResponse.json({
      building: {
        id: building.id,
        name: building.name,
        address: building.address,
        city: building.city,
        state: building.state,
        zipCode: building.zipCode,
        lat: building.lat,
        lng: building.lng,
        neighborhood: building.neighborhood,
        management: building.management,
        googlePlaceId: building.googlePlaceId,
        rating: building.rating,
        reviewCount: building.reviewCount,
        website: building.website,
        phone: building.phone,
        primaryPhotoUrl: building.primaryPhotoUrl,
        photos: building.photos,
        amenities: building.amenities,
        petPolicy: building.petPolicy,
        parkingType: building.parkingType,
        listingUrl: building.listingUrl,
        floorplansUrl: building.floorplansUrl,
        yearBuilt: building.yearBuilt,
        totalUnits: building.totalUnits,
        rentMin,
        rentMax,
        bedrooms: bedroomLabels,
        units: building.units.map((u) => ({
          id: u.id,
          name: u.name,
          bedrooms: u.bedrooms,
          bathrooms: u.bathrooms,
          sqftMin: u.sqftMin,
          sqftMax: u.sqftMax,
          rentMin: u.rentMin,
          rentMax: u.rentMax,
          availableCount: u.availableCount,
          availableDate: u.availableDate,
          photoUrl: u.photoUrl,
        })),
        lastSyncedAt: building.lastSyncedAt,

        // Fees & Policies (from Smart Apartment Data)
        adminFee: building.adminFee,
        applicationFee: building.applicationFee,
        petDeposit: building.petDeposit,
        petRent: building.petRent,
        petFeeNonrefundable: building.petFeeNonrefundable,
        petWeightLimit: building.petWeightLimit,
        petBreedRestrictions: building.petBreedRestrictions,
        maxPets: building.maxPets,
        currentSpecials: building.currentSpecials,
        specialsUpdatedAt: building.specialsUpdatedAt,
        rentRangeStudio: building.rentRangeStudio,
        rentRange1br: building.rentRange1br,
        rentRange2br: building.rentRange2br,
        rentRange3br: building.rentRange3br,
        parkingFee: building.parkingFee,
        trashValetFee: building.trashValetFee,
        utilitiesIncluded: building.utilitiesIncluded,
        shortTermPremium: building.shortTermPremium,
        earlyTerminationFee: building.earlyTerminationFee,
        guarantorPolicy: building.guarantorPolicy,
        incomeRequirement: building.incomeRequirement,
        additionalProvisions: building.additionalProvisions,
        sadDataUpdatedAt: building.sadDataUpdatedAt,
      },
      fieldEdits: edits,
    })
  } catch (error) {
    console.error('Building detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch building' }, { status: 500 })
  }
}
