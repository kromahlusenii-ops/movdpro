import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserCached } from '@/lib/pro-auth'
import prisma from '@/lib/db'

// GET - List reports
export async function GET() {
  try {
    const user = await getSessionUserCached()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const locator = await prisma.locatorProfile.findUnique({
      where: { userId: user.id },
      include: {
        reports: {
          orderBy: { createdAt: 'desc' },
          include: {
            client: {
              select: { name: true },
            },
            properties: {
              select: { id: true },
            },
          },
        },
      },
    })

    if (!locator) {
      return NextResponse.json({ error: 'No locator profile' }, { status: 404 })
    }

    return NextResponse.json({ reports: locator.reports })
  } catch (error) {
    console.error('Get reports error:', error)
    return NextResponse.json({ error: 'Failed to get reports' }, { status: 500 })
  }
}

// POST - Create report
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
    const {
      title,
      clientId,
      neighborhoodIds,
      propertyIds,
      buildingIds,
      customNotes,
      locatorName,
      clientBudget,
      clientMoveDate,
      clientPriorities,
    } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Reports must be tied to a client
    if (!clientId) {
      return NextResponse.json({ error: 'Client is required' }, { status: 400 })
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

    const report = await prisma.proReport.create({
      data: {
        locatorId: locator.id,
        clientId,
        title,
        neighborhoodIds: neighborhoodIds || [],
        propertyIds: propertyIds || [], // Legacy field
        buildingIds: buildingIds || [], // v3 field
        customNotes: customNotes || null,
        locatorName: locatorName || null,
        clientBudget: clientBudget || null,
        clientMoveDate: clientMoveDate || null,
        clientPriorities: clientPriorities || [],
      },
    })

    return NextResponse.json({ report })
  } catch (error) {
    console.error('Create report error:', error)
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
  }
}
