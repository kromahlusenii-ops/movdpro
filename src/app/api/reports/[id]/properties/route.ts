import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserCached } from '@/lib/pro-auth'
import prisma from '@/lib/db'

// Helper to verify report ownership
async function verifyReportOwnership(reportId: string, userId: string) {
  const locator = await prisma.locatorProfile.findUnique({
    where: { userId },
  })

  if (!locator) return null

  const report = await prisma.proReport.findFirst({
    where: {
      id: reportId,
      locatorId: locator.id,
    },
  })

  return report
}

// GET - List properties for a report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getSessionUserCached()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const report = await verifyReportOwnership(id, user.id)
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const properties = await prisma.reportProperty.findMany({
      where: { reportId: id },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ properties })
  } catch (error) {
    console.error('Get report properties error:', error)
    return NextResponse.json({ error: 'Failed to get properties' }, { status: 500 })
  }
}

// POST - Add property to report
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getSessionUserCached()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const report = await verifyReportOwnership(id, user.id)
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      buildingId,
      unitId,
      name,
      address,
      neighborhood,
      imageUrl,
      rent,
      bedrooms,
      bathrooms,
      sqft,
      availableDate,
      amenities,
      walkScore,
      isRecommended,
      locatorNote,
      sortOrder,
      deposit,
      adminFee,
      petDeposit,
      petRent,
      promos,
    } = body

    // Validate required fields
    if (!name || !address || !neighborhood || rent === undefined || bedrooms === undefined || bathrooms === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, address, neighborhood, rent, bedrooms, bathrooms' },
        { status: 400 }
      )
    }

    // Get current max sortOrder for this report
    const maxSort = await prisma.reportProperty.aggregate({
      where: { reportId: id },
      _max: { sortOrder: true },
    })
    const nextSortOrder = sortOrder ?? (maxSort._max.sortOrder ?? -1) + 1

    const property = await prisma.reportProperty.create({
      data: {
        reportId: id,
        buildingId: buildingId || null,
        unitId: unitId || null,
        name,
        address,
        neighborhood,
        imageUrl: imageUrl || null,
        rent,
        bedrooms,
        bathrooms,
        sqft: sqft || null,
        availableDate: availableDate || null,
        amenities: amenities || [],
        walkScore: walkScore || null,
        isRecommended: isRecommended || false,
        locatorNote: locatorNote || null,
        sortOrder: nextSortOrder,
        deposit: deposit || null,
        adminFee: adminFee || null,
        petDeposit: petDeposit || null,
        petRent: petRent || null,
        promos: promos || null,
      },
    })

    return NextResponse.json({ property })
  } catch (error) {
    console.error('Create report property error:', error)
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 })
  }
}

// PUT - Update property in report
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getSessionUserCached()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const report = await verifyReportOwnership(id, user.id)
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const body = await request.json()
    const { propertyId, ...updates } = body

    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId is required' }, { status: 400 })
    }

    // Verify property belongs to this report
    const existing = await prisma.reportProperty.findFirst({
      where: { id: propertyId, reportId: id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    const property = await prisma.reportProperty.update({
      where: { id: propertyId },
      data: {
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.address !== undefined && { address: updates.address }),
        ...(updates.neighborhood !== undefined && { neighborhood: updates.neighborhood }),
        ...(updates.imageUrl !== undefined && { imageUrl: updates.imageUrl }),
        ...(updates.rent !== undefined && { rent: updates.rent }),
        ...(updates.bedrooms !== undefined && { bedrooms: updates.bedrooms }),
        ...(updates.bathrooms !== undefined && { bathrooms: updates.bathrooms }),
        ...(updates.sqft !== undefined && { sqft: updates.sqft }),
        ...(updates.availableDate !== undefined && { availableDate: updates.availableDate }),
        ...(updates.amenities !== undefined && { amenities: updates.amenities }),
        ...(updates.walkScore !== undefined && { walkScore: updates.walkScore }),
        ...(updates.isRecommended !== undefined && { isRecommended: updates.isRecommended }),
        ...(updates.locatorNote !== undefined && { locatorNote: updates.locatorNote }),
        ...(updates.sortOrder !== undefined && { sortOrder: updates.sortOrder }),
        ...(updates.deposit !== undefined && { deposit: updates.deposit }),
        ...(updates.adminFee !== undefined && { adminFee: updates.adminFee }),
        ...(updates.petDeposit !== undefined && { petDeposit: updates.petDeposit }),
        ...(updates.petRent !== undefined && { petRent: updates.petRent }),
        ...(updates.promos !== undefined && { promos: updates.promos }),
      },
    })

    return NextResponse.json({ property })
  } catch (error) {
    console.error('Update report property error:', error)
    return NextResponse.json({ error: 'Failed to update property' }, { status: 500 })
  }
}

// DELETE - Remove property from report
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getSessionUserCached()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const report = await verifyReportOwnership(id, user.id)
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')

    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId query param is required' }, { status: 400 })
    }

    // Verify property belongs to this report
    const existing = await prisma.reportProperty.findFirst({
      where: { id: propertyId, reportId: id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    await prisma.reportProperty.delete({
      where: { id: propertyId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete report property error:', error)
    return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 })
  }
}
