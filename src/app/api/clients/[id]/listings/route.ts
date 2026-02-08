import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserCached } from '@/lib/pro-auth'
import prisma from '@/lib/db'

// GET - List saved listings for a client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params
    const user = await getSessionUserCached()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify client belongs to this locator
    const client = await prisma.locatorClient.findFirst({
      where: {
        id: clientId,
        locator: { userId: user.id },
      },
      include: {
        savedListings: {
          include: {
            unit: {
              include: {
                building: {
                  include: {
                    neighborhood: {
                      select: {
                        id: true,
                        name: true,
                        slug: true,
                        grade: true,
                      },
                    },
                    management: {
                      select: {
                        id: true,
                        name: true,
                        slug: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Format listings with full context
    const listings = client.savedListings.map((saved) => ({
      id: saved.unit.id,
      unitNumber: saved.unit.unitNumber,
      name: saved.unit.name,
      bedrooms: saved.unit.bedrooms,
      bathrooms: saved.unit.bathrooms,
      sqftMin: saved.unit.sqftMin,
      sqftMax: saved.unit.sqftMax,
      rentMin: saved.unit.rentMin,
      rentMax: saved.unit.rentMax,
      notes: saved.notes,
      savedAt: saved.createdAt,
      building: {
        id: saved.unit.building.id,
        name: saved.unit.building.name,
        address: saved.unit.building.address,
        city: saved.unit.building.city,
        primaryPhotoUrl: saved.unit.building.primaryPhotoUrl,
        rating: saved.unit.building.rating,
        reviewCount: saved.unit.building.reviewCount,
        listingUrl: saved.unit.building.listingUrl,
        floorplansUrl: saved.unit.building.floorplansUrl,
      },
      neighborhood: saved.unit.building.neighborhood,
      management: saved.unit.building.management,
    }))

    return NextResponse.json({ listings })
  } catch (error) {
    console.error('Get saved listings error:', error)
    return NextResponse.json({ error: 'Failed to get listings' }, { status: 500 })
  }
}

// POST - Save a listing to a client
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params
    const user = await getSessionUserCached()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify client belongs to this locator
    const client = await prisma.locatorClient.findFirst({
      where: {
        id: clientId,
        locator: { userId: user.id },
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const body = await request.json()
    const { listingId, notes } = body

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 })
    }

    // Verify listing exists
    const unit = await prisma.unit.findUnique({
      where: { id: listingId },
    })

    if (!unit) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Create or update saved listing
    const savedListing = await prisma.clientSavedListing.upsert({
      where: {
        clientId_unitId: {
          clientId,
          unitId: listingId,
        },
      },
      update: {
        notes: notes || null,
      },
      create: {
        clientId,
        unitId: listingId,
        notes: notes || null,
      },
    })

    return NextResponse.json({ savedListing })
  } catch (error) {
    console.error('Save listing error:', error)
    return NextResponse.json({ error: 'Failed to save listing' }, { status: 500 })
  }
}

// DELETE - Remove a listing from a client
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params
    const user = await getSessionUserCached()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify client belongs to this locator
    const client = await prisma.locatorClient.findFirst({
      where: {
        id: clientId,
        locator: { userId: user.id },
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const body = await request.json()
    const { listingId } = body

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 })
    }

    // Delete the saved listing
    await prisma.clientSavedListing.delete({
      where: {
        clientId_unitId: {
          clientId,
          unitId: listingId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove listing error:', error)
    return NextResponse.json({ error: 'Failed to remove listing' }, { status: 500 })
  }
}
