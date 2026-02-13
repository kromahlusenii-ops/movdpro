import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserCached } from '@/lib/pro-auth'
import { getEntityFieldEdits } from '@/lib/field-edits'
import type { EditTargetType } from '@/types/field-edits'

// GET - Get all field edits for an entity (unit or building)
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUserCached()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const targetType = searchParams.get('targetType') as EditTargetType | null
    const targetId = searchParams.get('targetId')

    if (!targetType || !targetId) {
      return NextResponse.json(
        { error: 'Missing required query params: targetType, targetId' },
        { status: 400 }
      )
    }

    const editsMap = await getEntityFieldEdits(targetType, targetId)

    // Convert Map to plain object for JSON serialization
    const edits: Record<string, unknown> = {}
    editsMap.forEach((value, key) => {
      edits[key] = value
    })

    return NextResponse.json({ edits })
  } catch (error) {
    console.error('Get entity field edits error:', error)
    return NextResponse.json({ error: 'Failed to get field edits' }, { status: 500 })
  }
}
