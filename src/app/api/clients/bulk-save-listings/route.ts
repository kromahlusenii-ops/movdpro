import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getSessionUserCached } from '@/lib/pro-auth'
import prisma from '@/lib/db'

// POST - Bulk save multiple units to multiple clients
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUserCached()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { unitIds, clientIds, notes } = body

    if (!unitIds || !Array.isArray(unitIds) || unitIds.length === 0) {
      return NextResponse.json({ error: 'Unit IDs are required' }, { status: 400 })
    }

    if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      return NextResponse.json({ error: 'Client IDs are required' }, { status: 400 })
    }

    // Verify all clients belong to this locator
    const clients = await prisma.locatorClient.findMany({
      where: {
        id: { in: clientIds },
        locator: { userId: user.id },
      },
      select: { id: true },
    })

    if (clients.length !== clientIds.length) {
      return NextResponse.json({ error: 'One or more clients not found' }, { status: 404 })
    }

    // Verify all units exist
    const units = await prisma.unit.findMany({
      where: { id: { in: unitIds } },
      select: { id: true },
    })

    if (units.length !== unitIds.length) {
      return NextResponse.json({ error: 'One or more units not found' }, { status: 404 })
    }

    // Create all combinations of client-unit pairs
    const savedListings = []
    for (const clientId of clientIds) {
      for (const unitId of unitIds) {
        savedListings.push({
          clientId,
          unitId,
          notes: notes || null,
        })
      }
    }

    // Upsert all saved listings (skip existing ones, update notes if provided)
    const results = await Promise.all(
      savedListings.map((data) =>
        prisma.clientSavedListing.upsert({
          where: {
            clientId_unitId: {
              clientId: data.clientId,
              unitId: data.unitId,
            },
          },
          update: {
            notes: data.notes,
          },
          create: data,
        })
      )
    )

    revalidateTag(`clients-${user.id}`, 'max')
    revalidateTag(`locator-${user.id}`, 'max')

    return NextResponse.json({
      success: true,
      savedCount: results.length,
      unitCount: unitIds.length,
      clientCount: clientIds.length,
    })
  } catch (error) {
    console.error('Bulk save listings error:', error)
    return NextResponse.json({ error: 'Failed to save listings' }, { status: 500 })
  }
}
