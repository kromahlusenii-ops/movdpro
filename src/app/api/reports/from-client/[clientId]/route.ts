import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserCached } from '@/lib/pro-auth'
import prisma from '@/lib/db'

// POST - Create report pre-populated from client's saved listings
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params
    const user = await getSessionUserCached()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const locator = await prisma.locatorProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: { name: true },
        },
      },
    })

    if (!locator) {
      return NextResponse.json({ error: 'No locator profile' }, { status: 404 })
    }

    // Get client with all their saved listings
    const client = await prisma.locatorClient.findFirst({
      where: {
        id: clientId,
        locatorId: locator.id,
      },
      include: {
        savedListings: {
          include: {
            unit: {
              include: {
                building: {
                  include: {
                    neighborhood: true,
                    management: true,
                  },
                },
              },
            },
          },
        },
        savedBuildings: {
          include: {
            building: {
              include: {
                neighborhood: true,
                management: true,
                units: {
                  where: { isAvailable: true },
                  take: 1,
                  orderBy: { rentMin: 'asc' },
                },
              },
            },
          },
        },
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Format budget string
    const budgetStr =
      client.budgetMin && client.budgetMax
        ? `$${client.budgetMin.toLocaleString()} - $${client.budgetMax.toLocaleString()}`
        : client.budgetMax
          ? `Up to $${client.budgetMax.toLocaleString()}`
          : null

    // Format move date
    const moveDateStr = client.moveInDate
      ? client.moveInDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : null

    // Create the report
    const report = await prisma.proReport.create({
      data: {
        locatorId: locator.id,
        clientId: client.id,
        title: `${client.name}'s Apartment Options`,
        locatorName: locator.user.name || locator.companyName || null,
        clientBudget: budgetStr,
        clientMoveDate: moveDateStr,
        clientPriorities: client.priorities || [],
        neighborhoodIds: [],
        propertyIds: [],
        buildingIds: [],
      },
    })

    // Collect unique neighborhoods from properties
    const neighborhoodMap = new Map<string, { id: string; name: string }>()

    // Add properties from saved listings (individual units)
    let sortOrder = 0
    for (const savedListing of client.savedListings) {
      const unit = savedListing.unit
      const building = unit.building
      const neighborhood = building.neighborhood

      // Track neighborhood
      if (!neighborhoodMap.has(neighborhood.id)) {
        neighborhoodMap.set(neighborhood.id, {
          id: neighborhood.id,
          name: neighborhood.name,
        })
      }

      await prisma.reportProperty.create({
        data: {
          reportId: report.id,
          buildingId: building.id,
          unitId: unit.id,
          name: building.name,
          address: building.address,
          neighborhood: neighborhood.name,
          imageUrl: building.primaryPhotoUrl || null,
          rent: unit.rentMin,
          bedrooms: unit.bedrooms,
          bathrooms: unit.bathrooms,
          sqft: unit.sqftMin || null,
          availableDate: unit.availableDate?.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }) || null,
          amenities: building.amenities || [],
          walkScore: neighborhood.walkScore || null,
          isRecommended: false,
          locatorNote: savedListing.notes || null,
          sortOrder: sortOrder++,
        },
      })
    }

    // Add properties from saved buildings (without specific unit)
    for (const savedBuilding of client.savedBuildings) {
      const building = savedBuilding.building
      const neighborhood = building.neighborhood
      const firstUnit = building.units[0]

      // Track neighborhood
      if (!neighborhoodMap.has(neighborhood.id)) {
        neighborhoodMap.set(neighborhood.id, {
          id: neighborhood.id,
          name: neighborhood.name,
        })
      }

      // Use first available unit for pricing, or skip if no units
      if (firstUnit) {
        await prisma.reportProperty.create({
          data: {
            reportId: report.id,
            buildingId: building.id,
            unitId: null,
            name: building.name,
            address: building.address,
            neighborhood: neighborhood.name,
            imageUrl: building.primaryPhotoUrl || null,
            rent: firstUnit.rentMin,
            bedrooms: firstUnit.bedrooms,
            bathrooms: firstUnit.bathrooms,
            sqft: firstUnit.sqftMin || null,
            availableDate: firstUnit.availableDate?.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            }) || null,
            amenities: building.amenities || [],
            walkScore: neighborhood.walkScore || null,
            isRecommended: false,
            locatorNote: savedBuilding.notes || null,
            sortOrder: sortOrder++,
          },
        })
      }
    }

    // Add neighborhoods with data from the database
    let neighborhoodSortOrder = 0
    for (const [neighborhoodId, { name }] of neighborhoodMap) {
      // Get full neighborhood data
      const fullNeighborhood = await prisma.neighborhood.findUnique({
        where: { id: neighborhoodId },
      })

      await prisma.reportNeighborhood.create({
        data: {
          reportId: report.id,
          neighborhoodId,
          name,
          vibe: fullNeighborhood?.tagline || null,
          walkability: fullNeighborhood?.walkScore
            ? `Walk Score: ${fullNeighborhood.walkScore}`
            : null,
          safety: fullNeighborhood?.safetyScore
            ? `Safety: ${Math.round(fullNeighborhood.safetyScore)}/100`
            : null,
          dogFriendly: null,
          sortOrder: neighborhoodSortOrder++,
        },
      })
    }

    // Fetch the complete report
    const completeReport = await prisma.proReport.findUnique({
      where: { id: report.id },
      include: {
        client: true,
        properties: {
          orderBy: { sortOrder: 'asc' },
        },
        neighborhoods: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    return NextResponse.json({ report: completeReport })
  } catch (error) {
    console.error('Create report from client error:', error)
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
  }
}
