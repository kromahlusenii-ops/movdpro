import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getSessionUserCached, getLocatorProfileCached } from '@/lib/pro-auth'
import prisma from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUserCached()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const locator = await getLocatorProfileCached(user.id)

    if (!locator) {
      return NextResponse.json({ error: 'No locator profile' }, { status: 404 })
    }

    const body = await request.json()
    const { action, clientIds, status } = body as {
      action: 'delete' | 'updateStatus'
      clientIds: string[]
      status?: string
    }

    if (!action || !clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Verify all clients belong to this locator
    const ownedClients = await prisma.locatorClient.findMany({
      where: {
        id: { in: clientIds },
        locatorId: locator.id,
      },
      select: { id: true },
    })

    const ownedIds = ownedClients.map((c) => c.id)
    const unauthorizedIds = clientIds.filter((id) => !ownedIds.includes(id))

    if (unauthorizedIds.length > 0) {
      return NextResponse.json(
        { error: 'Some clients not found or unauthorized' },
        { status: 403 }
      )
    }

    let result: { affected: number }

    switch (action) {
      case 'delete': {
        const deleted = await prisma.locatorClient.deleteMany({
          where: {
            id: { in: ownedIds },
            locatorId: locator.id,
          },
        })
        result = { affected: deleted.count }
        break
      }

      case 'updateStatus': {
        if (!status || !['active', 'placed', 'archived'].includes(status)) {
          return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }
        const updated = await prisma.locatorClient.updateMany({
          where: {
            id: { in: ownedIds },
            locatorId: locator.id,
          },
          data: { status },
        })
        result = { affected: updated.count }
        break
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    revalidateTag(`clients-${user.id}`, 'max')
    revalidateTag(`locator-${user.id}`, 'max')

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Bulk operation error:', error)
    return NextResponse.json({ error: 'Bulk operation failed' }, { status: 500 })
  }
}
