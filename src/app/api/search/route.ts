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

    // Check credits
    if (locator.creditsRemaining < 1) {
      return NextResponse.json({ error: 'No credits remaining' }, { status: 402 })
    }

    const body = await request.json()
    const { neighborhoods, budgetMin, budgetMax, bedrooms } = body

    // Build query
    const where: Record<string, unknown> = {
      isAvailable: true,
    }

    // Budget filter
    if (budgetMin || budgetMax) {
      where.rentMin = { lte: budgetMax || 10000 }
      where.rentMax = { gte: budgetMin || 0 }
    }

    // Bedrooms filter
    if (bedrooms && bedrooms.length > 0) {
      where.bedrooms = { hasSome: bedrooms }
    }

    // Neighborhoods filter
    if (neighborhoods && neighborhoods.length > 0) {
      where.neighborhood = {
        name: { in: neighborhoods },
      }
    }

    // Fetch apartments
    const apartments = await prisma.apartmentListing.findMany({
      where,
      include: {
        neighborhood: {
          select: {
            name: true,
            slug: true,
            grade: true,
          },
        },
      },
      orderBy: [
        { rating: 'desc' },
        { rentMin: 'asc' },
      ],
      take: 50,
    })

    // Deduct credit
    const updatedLocator = await prisma.locatorProfile.update({
      where: { id: locator.id },
      data: { creditsRemaining: locator.creditsRemaining - 1 },
    })

    // Log credit usage
    await prisma.creditLedger.create({
      data: {
        locatorId: locator.id,
        action: 'search',
        amount: -1,
        balance: updatedLocator.creditsRemaining,
        metadata: { neighborhoods, budgetMin, budgetMax, bedrooms, resultCount: apartments.length },
      },
    })

    return NextResponse.json({
      apartments: apartments.map(apt => ({
        id: apt.id,
        name: apt.name,
        address: apt.address,
        neighborhood: apt.neighborhood,
        rentMin: apt.rentMin,
        rentMax: apt.rentMax,
        bedrooms: apt.bedrooms,
        amenities: apt.amenities,
        rating: apt.rating,
        reviewCount: apt.reviewCount,
        photoUrl: apt.photoUrl,
        listingUrl: apt.listingUrl,
        // Greystar deep link data
        isGreystar: apt.isGreystar,
        floorplansUrl: apt.floorplansUrl,
      })),
      creditsRemaining: updatedLocator.creditsRemaining,
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
