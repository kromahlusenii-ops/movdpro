import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserCached } from '@/lib/pro-auth'
import prisma from '@/lib/db'

// POST - Publish report (set publishedAt)
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

    const locator = await prisma.locatorProfile.findUnique({
      where: { userId: user.id },
    })

    if (!locator) {
      return NextResponse.json({ error: 'No locator profile' }, { status: 404 })
    }

    // Verify ownership
    const existing = await prisma.proReport.findFirst({
      where: {
        id,
        locatorId: locator.id,
      },
      include: {
        properties: true,
        client: true,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Require at least one property to publish
    if (existing.properties.length === 0) {
      return NextResponse.json(
        { error: 'Report must have at least one property to publish' },
        { status: 400 }
      )
    }

    const report = await prisma.proReport.update({
      where: { id },
      data: {
        publishedAt: new Date(),
        isPublic: true,
      },
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

    // Return the shareable URL
    const shareUrl = `/r/${report.shareToken}`

    return NextResponse.json({
      report,
      shareUrl,
      shareToken: report.shareToken,
    })
  } catch (error) {
    console.error('Publish report error:', error)
    return NextResponse.json({ error: 'Failed to publish report' }, { status: 500 })
  }
}
