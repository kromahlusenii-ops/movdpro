import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getSessionUserCached, getLocatorProfileCached } from '@/lib/pro-auth'
import prisma from '@/lib/db'

// PUT - Update account settings
export async function PUT(request: NextRequest) {
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
    const { name, companyName } = body

    // Update user name if provided
    if (name !== undefined) {
      await prisma.user.update({
        where: { id: user.id },
        data: { name: name || null },
      })
    }

    // Update company name if provided
    if (companyName !== undefined) {
      await prisma.locatorProfile.update({
        where: { id: locator.id },
        data: { companyName: companyName || null },
      })
    }

    // Revalidate cache
    revalidateTag(`locator-${user.id}`, 'max')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update account settings error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
