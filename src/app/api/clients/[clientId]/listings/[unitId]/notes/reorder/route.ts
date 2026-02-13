import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getSessionUserCached } from '@/lib/pro-auth'
import prisma from '@/lib/db'

type RouteParams = {
  params: Promise<{ clientId: string; unitId: string }>
}

// PUT - Reorder notes
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { clientId, unitId } = await params
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

    // Verify client belongs to this locator
    const client = await prisma.locatorClient.findFirst({
      where: {
        id: clientId,
        locatorId: locator.id,
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const body = await request.json()
    const { noteIds } = body

    if (!noteIds || !Array.isArray(noteIds)) {
      return NextResponse.json(
        { error: 'noteIds array is required' },
        { status: 400 }
      )
    }

    // Verify all notes belong to this locator, client, and unit
    const existingNotes = await prisma.clientListingNote.findMany({
      where: {
        id: { in: noteIds },
        clientId,
        unitId,
        locatorId: locator.id,
      },
    })

    if (existingNotes.length !== noteIds.length) {
      return NextResponse.json(
        { error: 'Some notes not found or unauthorized' },
        { status: 400 }
      )
    }

    // Update sortOrder for each note based on position in array
    await prisma.$transaction(
      noteIds.map((id, index) =>
        prisma.clientListingNote.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    )

    revalidateTag(`clients-${user.id}`, 'max')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reorder notes error:', error)
    return NextResponse.json({ error: 'Failed to reorder notes' }, { status: 500 })
  }
}
