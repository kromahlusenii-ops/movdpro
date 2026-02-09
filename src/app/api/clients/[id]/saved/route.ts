import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserCached } from '@/lib/pro-auth'
import prisma from '@/lib/db'

// GET - Get saved listings and buildings for a client
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

    const locator = await prisma.locatorProfile.findUnique({
      where: { userId: user.id },
    })

    if (!locator) {
      return NextResponse.json({ error: 'No locator profile' }, { status: 404 })
    }

    // Verify client belongs to locator
    const client = await prisma.locatorClient.findFirst({
      where: {
        id,
        locatorId: locator.id,
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Get saved individual listings (units)
    const savedListings = await prisma.clientSavedListing.findMany({
      where: { clientId: id },
      include: {
        unit: {
          include: {
            building: {
              include: {
                neighborhood: {
                  select: {
                    id: true,
                    name: true,
                    walkScore: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    // Get saved buildings
    const savedBuildings = await prisma.clientSavedBuilding.findMany({
      where: { clientId: id },
      include: {
        building: {
          include: {
            neighborhood: {
              select: {
                id: true,
                name: true,
                walkScore: true,
              },
            },
            units: {
              where: { isAvailable: true },
              take: 1,
              orderBy: { rentMin: 'asc' },
            },
          },
        },
      },
    })

    return NextResponse.json({
      savedListings,
      savedBuildings,
    })
  } catch (error) {
    console.error('Get saved listings error:', error)
    return NextResponse.json({ error: 'Failed to get saved listings' }, { status: 500 })
  }
}
