import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserCached } from '@/lib/pro-auth'
import prisma from '@/lib/db'

// POST - Add apartment to client
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

    const body = await request.json()
    const { apartmentId } = body

    if (!apartmentId) {
      return NextResponse.json({ error: 'Apartment ID is required' }, { status: 400 })
    }

    // Check if already saved
    if (client.savedApartmentIds.includes(apartmentId)) {
      return NextResponse.json({ error: 'Already saved' }, { status: 400 })
    }

    // Add apartment to client
    const updated = await prisma.locatorClient.update({
      where: { id },
      data: {
        savedApartmentIds: [...client.savedApartmentIds, apartmentId],
      },
    })

    return NextResponse.json({ client: updated })
  } catch (error) {
    console.error('Save apartment error:', error)
    return NextResponse.json({ error: 'Failed to save apartment' }, { status: 500 })
  }
}

// DELETE - Remove apartment from client
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

    const body = await request.json()
    const { apartmentId } = body

    if (!apartmentId) {
      return NextResponse.json({ error: 'Apartment ID is required' }, { status: 400 })
    }

    // Remove apartment from client
    const updated = await prisma.locatorClient.update({
      where: { id },
      data: {
        savedApartmentIds: client.savedApartmentIds.filter(id => id !== apartmentId),
      },
    })

    return NextResponse.json({ client: updated })
  } catch (error) {
    console.error('Remove apartment error:', error)
    return NextResponse.json({ error: 'Failed to remove apartment' }, { status: 500 })
  }
}
