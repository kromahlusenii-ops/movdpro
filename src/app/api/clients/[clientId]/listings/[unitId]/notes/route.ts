import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getSessionUserCached } from '@/lib/pro-auth'
import prisma from '@/lib/db'

type RouteParams = {
  params: Promise<{ clientId: string; unitId: string }>
}

// Helper to verify client ownership and get locator
async function verifyClientOwnership(clientId: string, userId: string) {
  const locator = await prisma.locatorProfile.findUnique({
    where: { userId },
  })

  if (!locator) return null

  const client = await prisma.locatorClient.findFirst({
    where: {
      id: clientId,
      locatorId: locator.id,
    },
  })

  if (!client) return null

  return { locator, client }
}

// GET - List all notes for a client-listing pair
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { clientId, unitId } = await params
    const user = await getSessionUserCached()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ownership = await verifyClientOwnership(clientId, user.id)
    if (!ownership) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const notes = await prisma.clientListingNote.findMany({
      where: {
        clientId,
        unitId,
        locatorId: ownership.locator.id,
      },
      orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }],
    })

    return NextResponse.json({ notes })
  } catch (error) {
    console.error('Get listing notes error:', error)
    return NextResponse.json({ error: 'Failed to get notes' }, { status: 500 })
  }
}

// POST - Create a new note
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { clientId, unitId } = await params
    const user = await getSessionUserCached()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ownership = await verifyClientOwnership(clientId, user.id)
    if (!ownership) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Verify unit exists
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
    })

    if (!unit) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
    }

    const body = await request.json()
    const { type, content, visibleToClient = true } = body

    if (!type || !['pro', 'con', 'note'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be pro, con, or note' },
        { status: 400 }
      )
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Get the max sortOrder for this type
    const maxSort = await prisma.clientListingNote.aggregate({
      where: {
        clientId,
        unitId,
        locatorId: ownership.locator.id,
        type,
      },
      _max: { sortOrder: true },
    })
    const nextSortOrder = (maxSort._max.sortOrder ?? -1) + 1

    const note = await prisma.clientListingNote.create({
      data: {
        clientId,
        unitId,
        locatorId: ownership.locator.id,
        type,
        content: content.trim(),
        visibleToClient,
        sortOrder: nextSortOrder,
      },
    })

    revalidateTag(`clients-${user.id}`, 'max')

    return NextResponse.json({ note })
  } catch (error) {
    console.error('Create listing note error:', error)
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
  }
}

// PUT - Update a note
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { clientId, unitId } = await params
    const user = await getSessionUserCached()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ownership = await verifyClientOwnership(clientId, user.id)
    if (!ownership) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const body = await request.json()
    const { id, content, visibleToClient, sortOrder } = body

    if (!id) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 })
    }

    // Verify note belongs to this locator
    const existing = await prisma.clientListingNote.findFirst({
      where: {
        id,
        clientId,
        unitId,
        locatorId: ownership.locator.id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    const note = await prisma.clientListingNote.update({
      where: { id },
      data: {
        ...(content !== undefined && { content: content.trim() }),
        ...(visibleToClient !== undefined && { visibleToClient }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    })

    revalidateTag(`clients-${user.id}`, 'max')

    return NextResponse.json({ note })
  } catch (error) {
    console.error('Update listing note error:', error)
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 })
  }
}

// DELETE - Delete a note
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { clientId, unitId } = await params
    const user = await getSessionUserCached()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ownership = await verifyClientOwnership(clientId, user.id)
    if (!ownership) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 })
    }

    // Verify note belongs to this locator
    const existing = await prisma.clientListingNote.findFirst({
      where: {
        id,
        clientId,
        unitId,
        locatorId: ownership.locator.id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    await prisma.clientListingNote.delete({
      where: { id },
    })

    revalidateTag(`clients-${user.id}`, 'max')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete listing note error:', error)
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
  }
}
