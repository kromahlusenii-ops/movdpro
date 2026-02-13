import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserCached, getLocatorProfileCached } from '@/lib/pro-auth'
import { getUnresolvedConflicts, resolveConflict } from '@/lib/field-edits'

// GET - List all unresolved conflicts
export async function GET() {
  try {
    const user = await getSessionUserCached()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const conflicts = await getUnresolvedConflicts()
    return NextResponse.json({ conflicts })
  } catch (error) {
    console.error('Get conflicts error:', error)
    return NextResponse.json({ error: 'Failed to get conflicts' }, { status: 500 })
  }
}

// POST - Resolve a conflict
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
    const { editId, resolution } = body as {
      editId: string
      resolution: 'keep_locator' | 'accept_scraper'
    }

    if (!editId || !resolution) {
      return NextResponse.json(
        { error: 'Missing required fields: editId, resolution' },
        { status: 400 }
      )
    }

    if (resolution !== 'keep_locator' && resolution !== 'accept_scraper') {
      return NextResponse.json(
        { error: 'Invalid resolution. Must be "keep_locator" or "accept_scraper"' },
        { status: 400 }
      )
    }

    await resolveConflict(editId, resolution, locator.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Resolve conflict error:', error)
    const message = error instanceof Error ? error.message : 'Failed to resolve conflict'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
