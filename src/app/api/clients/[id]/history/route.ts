import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserCached } from '@/lib/pro-auth'
import prisma from '@/lib/db'
import {
  getClientFieldEditHistory,
  getClientLastEdits,
  serializeEditsMap,
} from '@/lib/client-edits'
import type { ClientEditableFieldName } from '@/types/client-edits'

// GET - Get edit history for a client
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

    // Verify ownership
    const client = await prisma.locatorClient.findFirst({
      where: {
        id,
        locatorId: locator.id,
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const fieldName = searchParams.get('fieldName') as ClientEditableFieldName | null
    const mode = searchParams.get('mode') || 'last' // 'last' or 'history'

    if (mode === 'history' && fieldName) {
      // Get full history for a specific field
      const history = await getClientFieldEditHistory(id, fieldName)
      return NextResponse.json({ history })
    } else {
      // Get last edit for each field
      const editsMap = await getClientLastEdits(id)
      const edits = serializeEditsMap(editsMap)
      return NextResponse.json({ edits })
    }
  } catch (error) {
    console.error('Get client history error:', error)
    return NextResponse.json({ error: 'Failed to get history' }, { status: 500 })
  }
}
