import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { getSessionUserCached, getLocatorProfileCached } from '@/lib/pro-auth'
import {
  createFieldEdit,
  getFieldEditHistory,
  getFieldWithEdit,
} from '@/lib/field-edits'
import type { EditableFieldName, EditTargetType } from '@/types/field-edits'

// POST - Create a new field edit
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
    const { targetType, targetId, fieldName, newValue } = body as {
      targetType: EditTargetType
      targetId: string
      fieldName: EditableFieldName
      newValue: Prisma.InputJsonValue
    }

    // Validate required fields
    if (!targetType || !targetId || !fieldName || newValue === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: targetType, targetId, fieldName, newValue' },
        { status: 400 }
      )
    }

    // Validate targetType
    if (targetType !== 'unit' && targetType !== 'building') {
      return NextResponse.json(
        { error: 'Invalid targetType. Must be "unit" or "building"' },
        { status: 400 }
      )
    }

    // Create the edit
    const edit = await createFieldEdit(
      targetType,
      targetId,
      fieldName,
      newValue,
      locator.id
    )

    return NextResponse.json({ edit })
  } catch (error) {
    console.error('Create field edit error:', error)
    return NextResponse.json({ error: 'Failed to create field edit' }, { status: 500 })
  }
}

// GET - Get field edit history or current value with edit info
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUserCached()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const targetType = searchParams.get('targetType') as EditTargetType | null
    const targetId = searchParams.get('targetId')
    const fieldName = searchParams.get('fieldName') as EditableFieldName | null
    const mode = searchParams.get('mode') || 'history' // 'history' or 'current'
    const scrapedValue = searchParams.get('scrapedValue')

    if (!targetType || !targetId || !fieldName) {
      return NextResponse.json(
        { error: 'Missing required query params: targetType, targetId, fieldName' },
        { status: 400 }
      )
    }

    if (mode === 'current') {
      // Get current value with edit overlay
      const parsedScrapedValue = scrapedValue ? JSON.parse(scrapedValue) : null
      const fieldWithEdit = await getFieldWithEdit(
        targetType,
        targetId,
        fieldName,
        parsedScrapedValue
      )
      return NextResponse.json({ field: fieldWithEdit })
    } else {
      // Get full edit history
      const history = await getFieldEditHistory(targetType, targetId, fieldName)
      return NextResponse.json({ history })
    }
  } catch (error) {
    console.error('Get field edits error:', error)
    return NextResponse.json({ error: 'Failed to get field edits' }, { status: 500 })
  }
}
