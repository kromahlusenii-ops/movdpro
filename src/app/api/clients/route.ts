import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getSessionUserCached, getLocatorProfileCached } from '@/lib/pro-auth'
import prisma from '@/lib/db'

// GET - List clients
export async function GET() {
  try {
    const user = await getSessionUserCached()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use cached profile for auth check, then fetch clients with saved listings
    const locator = await getLocatorProfileCached(user.id)

    if (!locator) {
      return NextResponse.json({ error: 'No locator profile' }, { status: 404 })
    }

    // Fetch clients with savedListings for the search page save dropdown
    const clients = await prisma.locatorClient.findMany({
      where: { locatorId: locator.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        savedListings: {
          select: { unitId: true },
        },
      },
    })

    // Format clients with savedListings as listingId for frontend compatibility
    const formattedClients = clients.map((client) => ({
      ...client,
      savedListings: client.savedListings.map((sl) => ({ listingId: sl.unitId })),
    }))

    return NextResponse.json({ clients: formattedClients })
  } catch (error) {
    console.error('Get clients error:', error)
    return NextResponse.json({ error: 'Failed to get clients' }, { status: 500 })
  }
}

// POST - Create client
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

    // Check max clients (locator.clients from cache only includes active clients)
    if (locator.clients.length >= 20) {
      return NextResponse.json(
        { error: 'Maximum 20 active clients allowed' },
        { status: 400 }
      )
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
      // Lifestyle preferences
      vibes,
      priorities,
      hasDog,
      hasCat,
      hasKids,
      worksFromHome,
      needsParking,
      commuteAddress,
      commutePreference,
    } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const client = await prisma.locatorClient.create({
      data: {
        locatorId: locator.id,
        name,
        email: email || null,
        phone: phone || null,
        budgetMin: budgetMin || null,
        budgetMax: budgetMax || null,
        bedrooms: bedrooms || [],
        neighborhoods: neighborhoods || [],
        notes: notes || null,
        amenities: [],
        // Lifestyle preferences
        vibes: vibes || [],
        priorities: priorities || [],
        hasDog: hasDog || false,
        hasCat: hasCat || false,
        hasKids: hasKids || false,
        worksFromHome: worksFromHome || false,
        needsParking: needsParking || false,
        commuteAddress: commuteAddress || null,
        commutePreference: commutePreference || null,
      },
    })

    // Bust server-side caches so clients list and locator profile reflect the new client
    revalidateTag(`clients-${user.id}`, 'max')
    revalidateTag(`locator-${user.id}`, 'max')

    return NextResponse.json({ client })
  } catch (error) {
    console.error('Create client error:', error)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}
