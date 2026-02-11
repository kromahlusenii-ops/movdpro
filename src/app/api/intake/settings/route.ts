import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getSessionUserCached, getLocatorProfileCached } from '@/lib/pro-auth'
import prisma from '@/lib/db'
import { slugify } from '@/lib/utils'

// GET - Get intake settings
export async function GET() {
  try {
    const user = await getSessionUserCached()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const locator = await prisma.locatorProfile.findUnique({
      where: { userId: user.id },
      select: {
        intakeSlug: true,
        intakeEnabled: true,
        intakeWelcomeMsg: true,
        companyName: true,
      },
    })

    if (!locator) {
      return NextResponse.json({ error: 'No locator profile' }, { status: 404 })
    }

    return NextResponse.json({
      settings: {
        slug: locator.intakeSlug,
        enabled: locator.intakeEnabled,
        welcomeMessage: locator.intakeWelcomeMsg,
        companyName: locator.companyName,
      },
    })
  } catch (error) {
    console.error('Get intake settings error:', error)
    return NextResponse.json({ error: 'Failed to get settings' }, { status: 500 })
  }
}

// PATCH - Update intake settings
export async function PATCH(request: NextRequest) {
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
    const { slug, enabled, welcomeMessage } = body

    // Build update data
    const updateData: {
      intakeSlug?: string | null
      intakeEnabled?: boolean
      intakeWelcomeMsg?: string | null
    } = {}

    // Validate and set slug if provided
    if (slug !== undefined) {
      if (slug === null || slug === '') {
        updateData.intakeSlug = null
      } else {
        // Slugify the input
        const cleanSlug = slugify(slug)

        if (cleanSlug.length < 3) {
          return NextResponse.json(
            { error: 'Slug must be at least 3 characters' },
            { status: 400 }
          )
        }

        if (cleanSlug.length > 50) {
          return NextResponse.json(
            { error: 'Slug must be 50 characters or less' },
            { status: 400 }
          )
        }

        // Check if slug is already taken (by another locator)
        const existing = await prisma.locatorProfile.findUnique({
          where: { intakeSlug: cleanSlug },
          select: { id: true },
        })

        if (existing && existing.id !== locator.id) {
          return NextResponse.json(
            { error: 'This URL is already taken' },
            { status: 400 }
          )
        }

        updateData.intakeSlug = cleanSlug
      }
    }

    // Set enabled if provided
    if (enabled !== undefined) {
      updateData.intakeEnabled = Boolean(enabled)
    }

    // Set welcome message if provided
    if (welcomeMessage !== undefined) {
      updateData.intakeWelcomeMsg = welcomeMessage || null
    }

    // Update the profile
    const updated = await prisma.locatorProfile.update({
      where: { id: locator.id },
      data: updateData,
      select: {
        intakeSlug: true,
        intakeEnabled: true,
        intakeWelcomeMsg: true,
      },
    })

    // Bust cache
    revalidateTag(`locator-${user.id}`, 'max')

    return NextResponse.json({
      settings: {
        slug: updated.intakeSlug,
        enabled: updated.intakeEnabled,
        welcomeMessage: updated.intakeWelcomeMsg,
      },
    })
  } catch (error) {
    console.error('Update intake settings error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
