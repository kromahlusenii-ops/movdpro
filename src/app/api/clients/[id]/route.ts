import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getSessionUserCached } from '@/lib/pro-auth'
import prisma from '@/lib/db'

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
    const { name, email, phone, budgetMin, budgetMax, bedrooms, neighborhoods, notes, status } = body

    const client = await prisma.locatorClient.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(budgetMin !== undefined && { budgetMin }),
        ...(budgetMax !== undefined && { budgetMax }),
        ...(bedrooms !== undefined && { bedrooms }),
        ...(neighborhoods !== undefined && { neighborhoods }),
        ...(notes !== undefined && { notes }),
        ...(status !== undefined && { status }),
      },
    })

    revalidateTag(`clients-${user.id}`, 'max')
    revalidateTag(`locator-${user.id}`, 'max')

    return NextResponse.json({ client })
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
