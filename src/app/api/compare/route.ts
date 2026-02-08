/**
 * Compare Buildings API
 *
 * Compare up to 3 buildings side by side.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserCached } from '@/lib/pro-auth'
import prisma from '@/lib/db'

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

    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No building IDs provided' }, { status: 400 })
    }

    if (ids.length > 3) {
      return NextResponse.json({ error: 'Maximum 3 buildings can be compared' }, { status: 400 })
    }

    const buildings = await prisma.building.findMany({
      where: {
        id: { in: ids },
      },
      include: {
        neighborhood: {
          select: {
            name: true,
            slug: true,
            grade: true,
            walkScore: true,
            transitScore: true,
          },
        },
        management: {
          select: {
            name: true,
            slug: true,
          },
        },
        units: {
          where: { isAvailable: true },
          orderBy: { bedrooms: 'asc' },
        },
      },
    })

    // Format response
    const formattedBuildings = buildings.map((b) => {
      // Calculate rent range from units
      const rents = b.units.flatMap((u) => [u.rentMin, u.rentMax])
      const rentMin = rents.length > 0 ? Math.min(...rents) : null
      const rentMax = rents.length > 0 ? Math.max(...rents) : null

      // Get unique bedroom counts
      const bedroomCounts = [...new Set(b.units.map((u) => u.bedrooms))].sort()
      const bedroomLabels = bedroomCounts.map((c) => {
        if (c === 0) return 'Studio'
        if (c === 1) return '1 BR'
        if (c === 2) return '2 BR'
        return `${c}+ BR`
      })

      // Get sqft range
      const sqfts = b.units.flatMap((u) => [u.sqftMin, u.sqftMax].filter(Boolean) as number[])
      const sqftMin = sqfts.length > 0 ? Math.min(...sqfts) : null
      const sqftMax = sqfts.length > 0 ? Math.max(...sqfts) : null

      // Get bath range
      const baths = b.units.map((u) => u.bathrooms)
      const bathrooms = baths.length > 0 ? Math.max(...baths) : null

      return {
        id: b.id,
        name: b.name,
        address: b.address,
        neighborhood: b.neighborhood,
        management: b.management,
        rentMin,
        rentMax,
        bedrooms: bedroomLabels,
        bathrooms,
        sqftMin,
        sqftMax,
        amenities: b.amenities,
        rating: b.rating,
        reviewCount: b.reviewCount,
        photoUrl: b.primaryPhotoUrl,
        floorplansUrl: b.floorplansUrl,
        unitCount: b.units.length,
      }
    })

    return NextResponse.json({
      // Keep apartments key for backwards compatibility with compare page
      apartments: formattedBuildings,
    })
  } catch (error) {
    console.error('Compare error:', error)
    return NextResponse.json({ error: 'Compare failed' }, { status: 500 })
  }
}
