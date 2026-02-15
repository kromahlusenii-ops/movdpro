import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getSessionUserCached } from '@/lib/pro-auth'
import prisma from '@/lib/db'
import { createClientFieldEdit } from '@/lib/client-edits'
import { PREFERENCE_FIELDS, type ClientEditableFieldName } from '@/types/client-edits'

// GET - Get single client
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

    const client = await prisma.locatorClient.findFirst({
      where: {
        id,
        locatorId: locator.id,
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json({ client })
  } catch (error) {
    console.error('Get client error:', error)
    return NextResponse.json({ error: 'Failed to get client' }, { status: 500 })
  }
}

// PATCH - Update client
export async function PATCH(
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
    const existing = await prisma.locatorClient.findFirst({
      where: {
        id,
        locatorId: locator.id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      name,
      email,
      phone,
      budgetMin,
      budgetMax,
      bedrooms,
      neighborhoods,
      notes,
      status,
      vibes,
      priorities,
      hasDog,
      hasCat,
      hasKids,
      worksFromHome,
      needsParking,
      commuteAddress,
      commutePreference,
      moveInDate,
      amenities,
      contactPreference,
    } = body

    // Track which fields changed and if any are preference fields
    const changedFields: { fieldName: ClientEditableFieldName; oldValue: unknown; newValue: unknown }[] = []
    let preferencesChanged = false

    // Build update data and track changes
    const updateData: Record<string, unknown> = {}

    const checkAndAddField = (fieldName: ClientEditableFieldName, newVal: unknown) => {
      if (newVal !== undefined) {
        const oldVal = existing[fieldName as keyof typeof existing]
        // Check if value actually changed
        const hasChanged = JSON.stringify(oldVal) !== JSON.stringify(newVal)
        if (hasChanged) {
          updateData[fieldName] = newVal
          changedFields.push({ fieldName, oldValue: oldVal, newValue: newVal })
          if (PREFERENCE_FIELDS.includes(fieldName)) {
            preferencesChanged = true
          }
        }
      }
    }

    // Check all fields
    checkAndAddField('name', name)
    checkAndAddField('email', email)
    checkAndAddField('phone', phone)
    checkAndAddField('budgetMin', budgetMin)
    checkAndAddField('budgetMax', budgetMax)
    checkAndAddField('bedrooms', bedrooms)
    checkAndAddField('neighborhoods', neighborhoods)
    checkAndAddField('notes', notes)
    checkAndAddField('status', status)
    checkAndAddField('vibes', vibes)
    checkAndAddField('priorities', priorities)
    checkAndAddField('hasDog', hasDog)
    checkAndAddField('hasCat', hasCat)
    checkAndAddField('hasKids', hasKids)
    checkAndAddField('worksFromHome', worksFromHome)
    checkAndAddField('needsParking', needsParking)
    checkAndAddField('commuteAddress', commuteAddress)
    checkAndAddField('commutePreference', commutePreference)
    checkAndAddField('moveInDate', moveInDate ? new Date(moveInDate) : null)
    checkAndAddField('amenities', amenities)
    checkAndAddField('contactPreference', contactPreference)

    // Only update if there are changes
    let client = existing
    if (Object.keys(updateData).length > 0) {
      client = await prisma.locatorClient.update({
        where: { id },
        data: updateData,
      })

      // Create edit records for each changed field
      for (const change of changedFields) {
        await createClientFieldEdit(
          id,
          change.fieldName,
          change.newValue as never,
          locator.id,
          change.oldValue as never
        )
      }
    }

    revalidateTag(`clients-${user.id}`, 'max')
    revalidateTag(`locator-${user.id}`, 'max')

    return NextResponse.json({ client, preferencesChanged })
  } catch (error) {
    console.error('Update client error:', error)
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

// DELETE - Delete client
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

    // Verify ownership
    const existing = await prisma.locatorClient.findFirst({
      where: {
        id,
        locatorId: locator.id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    await prisma.locatorClient.delete({
      where: { id },
    })

    revalidateTag(`clients-${user.id}`, 'max')
    revalidateTag(`locator-${user.id}`, 'max')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete client error:', error)
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}
