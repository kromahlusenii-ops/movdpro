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

// GET - List neighborhoods for a report
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

    const neighborhoods = await prisma.reportNeighborhood.findMany({
      where: { reportId: id },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ neighborhoods })
  } catch (error) {
    console.error('Get report neighborhoods error:', error)
    return NextResponse.json({ error: 'Failed to get neighborhoods' }, { status: 500 })
  }
}

// POST - Add neighborhood to report
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
      neighborhoodId,
      name,
      vibe,
      walkability,
      safety,
      dogFriendly,
      sortOrder,
    } = body

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    // Get current max sortOrder for this report
    const maxSort = await prisma.reportNeighborhood.aggregate({
      where: { reportId: id },
      _max: { sortOrder: true },
    })
    const nextSortOrder = sortOrder ?? (maxSort._max.sortOrder ?? -1) + 1

    const neighborhood = await prisma.reportNeighborhood.create({
      data: {
        reportId: id,
        neighborhoodId: neighborhoodId || null,
        name,
        vibe: vibe || null,
        walkability: walkability || null,
        safety: safety || null,
        dogFriendly: dogFriendly || null,
        sortOrder: nextSortOrder,
      },
    })

    return NextResponse.json({ neighborhood })
  } catch (error) {
    console.error('Create report neighborhood error:', error)
    return NextResponse.json({ error: 'Failed to create neighborhood' }, { status: 500 })
  }
}

// PUT - Update neighborhood in report
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
    const { neighborhoodReportId, ...updates } = body

    if (!neighborhoodReportId) {
      return NextResponse.json({ error: 'neighborhoodReportId is required' }, { status: 400 })
    }

    // Verify neighborhood belongs to this report
    const existing = await prisma.reportNeighborhood.findFirst({
      where: { id: neighborhoodReportId, reportId: id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Neighborhood not found' }, { status: 404 })
    }

    const neighborhood = await prisma.reportNeighborhood.update({
      where: { id: neighborhoodReportId },
      data: {
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.vibe !== undefined && { vibe: updates.vibe }),
        ...(updates.walkability !== undefined && { walkability: updates.walkability }),
        ...(updates.safety !== undefined && { safety: updates.safety }),
        ...(updates.dogFriendly !== undefined && { dogFriendly: updates.dogFriendly }),
        ...(updates.sortOrder !== undefined && { sortOrder: updates.sortOrder }),
      },
    })

    return NextResponse.json({ neighborhood })
  } catch (error) {
    console.error('Update report neighborhood error:', error)
    return NextResponse.json({ error: 'Failed to update neighborhood' }, { status: 500 })
  }
}

// DELETE - Remove neighborhood from report
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
    const neighborhoodReportId = searchParams.get('neighborhoodReportId')

    if (!neighborhoodReportId) {
      return NextResponse.json({ error: 'neighborhoodReportId query param is required' }, { status: 400 })
    }

    // Verify neighborhood belongs to this report
    const existing = await prisma.reportNeighborhood.findFirst({
      where: { id: neighborhoodReportId, reportId: id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Neighborhood not found' }, { status: 404 })
    }

    await prisma.reportNeighborhood.delete({
      where: { id: neighborhoodReportId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete report neighborhood error:', error)
    return NextResponse.json({ error: 'Failed to delete neighborhood' }, { status: 500 })
  }
}
