/**
 * Single Listing API
 *
 * Get detailed information about a specific listing (unit).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserCached } from '@/lib/pro-auth'
import { getEntityFieldEdits } from '@/lib/field-edits'
import prisma from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Fetch the listing with full building and neighborhood context
    const listing = await prisma.unit.findUnique({
      where: { id },
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
                bikeScore: true,
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
          },
        },
      },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Fetch field edits for this unit (included to avoid client-side waterfall)
    const editsMap = await getEntityFieldEdits('unit', id)

    const edits: Record<string, unknown> = {}
    editsMap.forEach((value, key) => {
      edits[key] = value
    })

    // Format response
    const formattedListing = {
      id: listing.id,
      unitNumber: listing.unitNumber,
      name: listing.name,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      sqftMin: listing.sqftMin,
      sqftMax: listing.sqftMax,
      rentMin: listing.rentMin,
      rentMax: listing.rentMax,
      availableCount: listing.availableCount,
      availableDate: listing.availableDate,
      photoUrl: listing.photoUrl,
      building: {
        id: listing.building.id,
        name: listing.building.name,
        address: listing.building.address,
        city: listing.building.city,
        state: listing.building.state,
        zipCode: listing.building.zipCode,
        lat: listing.building.lat,
        lng: listing.building.lng,
        primaryPhotoUrl: listing.building.primaryPhotoUrl,
        photos: listing.building.photos,
        amenities: listing.building.amenities,
        rating: listing.building.rating,
        reviewCount: listing.building.reviewCount,
        listingUrl: listing.building.listingUrl,
        floorplansUrl: listing.building.floorplansUrl,
        petPolicy: listing.building.petPolicy,
        parkingType: listing.building.parkingType,
        neighborhood: listing.building.neighborhood,
        management: listing.building.management,
      },
    }

    return NextResponse.json({ listing: formattedListing, fieldEdits: edits })
  } catch (error) {
    console.error('Listing fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 })
  }
}
