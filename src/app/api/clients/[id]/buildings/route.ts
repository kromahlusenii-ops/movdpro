/**
 * Client Saved Buildings API
 *
 * Manage buildings saved to a client.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserCached } from '@/lib/pro-auth'
import prisma from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - List all saved buildings for a client
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

    const { id: clientId } = await params

    // Verify client belongs to locator
    const client = await prisma.locatorClient.findFirst({
      where: {
        id: clientId,
        locatorId: locator.id,
      },
      include: {
        savedBuildings: {
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
                units: {
                  where: { isAvailable: true },
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

    // Format response
    const savedBuildings = client.savedBuildings.map((sb) => {
      const b = sb.building
      const rents = b.units.flatMap((u) => [u.rentMin, u.rentMax])
      const rentMin = rents.length > 0 ? Math.min(...rents) : null
      const rentMax = rents.length > 0 ? Math.max(...rents) : null

      return {
        id: sb.id,
        buildingId: b.id,
        name: b.name,
        address: b.address,
        neighborhood: b.neighborhood,
        management: b.management,
        rentMin,
        rentMax,
        unitCount: b.units.length,
        primaryPhotoUrl: b.primaryPhotoUrl,
        matchScore: sb.matchScore,
        matchReason: sb.matchReason,
        notes: sb.notes,
        savedAt: sb.createdAt,
      }
    })

    return NextResponse.json({ savedBuildings })
  } catch (error) {
    console.error('Get saved buildings error:', error)
    return NextResponse.json({ error: 'Failed to get saved buildings' }, { status: 500 })
  }
}

// POST - Save a building to a client
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const { id: clientId } = await params
    const body = await request.json()
    const { buildingId, notes } = body

    if (!buildingId) {
      return NextResponse.json({ error: 'Building ID required' }, { status: 400 })
    }

    // Verify client belongs to locator
    const client = await prisma.locatorClient.findFirst({
      where: {
        id: clientId,
        locatorId: locator.id,
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Verify building exists
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
    })

    if (!building) {
      return NextResponse.json({ error: 'Building not found' }, { status: 404 })
    }

    // Create saved building (upsert to handle duplicates)
    const savedBuilding = await prisma.clientSavedBuilding.upsert({
      where: {
        clientId_buildingId: {
          clientId,
          buildingId,
        },
      },
      create: {
        clientId,
        buildingId,
        notes,
      },
      update: {
        notes,
      },
    })

    return NextResponse.json({ savedBuilding })
  } catch (error) {
    console.error('Save building error:', error)
    return NextResponse.json({ error: 'Failed to save building' }, { status: 500 })
  }
}

// DELETE - Remove a building from a client
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { id: clientId } = await params
    const body = await request.json()
    const { buildingId } = body

    if (!buildingId) {
      return NextResponse.json({ error: 'Building ID required' }, { status: 400 })
    }

    // Verify client belongs to locator
    const client = await prisma.locatorClient.findFirst({
      where: {
        id: clientId,
        locatorId: locator.id,
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Delete saved building
    await prisma.clientSavedBuilding.delete({
      where: {
        clientId_buildingId: {
          clientId,
          buildingId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove building error:', error)
    return NextResponse.json({ error: 'Failed to remove building' }, { status: 500 })
  }
}
