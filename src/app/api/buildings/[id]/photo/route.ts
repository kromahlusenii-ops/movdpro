import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserCached } from '@/lib/pro-auth'
import prisma from '@/lib/db'

// Server-only key preferred; NEXT_PUBLIC_ exposes key to client bundle
const GOOGLE_API_KEY =
  process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

type RouteParams = {
  params: Promise<{ id: string }>
}

// GET - Fetch building photo from Google Places API
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSessionUserCached()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get building with googlePlaceId
    const building = await prisma.building.findUnique({
      where: { id },
      select: {
        id: true,
        googlePlaceId: true,
        primaryPhotoUrl: true,
        name: true
      },
    })

    if (!building) {
      return NextResponse.json({ error: 'Building not found' }, { status: 404 })
    }

    // If we already have a photo URL cached, return it
    if (building.primaryPhotoUrl) {
      return NextResponse.json({ photoUrl: building.primaryPhotoUrl })
    }

    // If no googlePlaceId, can't fetch photo
    if (!building.googlePlaceId || !GOOGLE_API_KEY) {
      return NextResponse.json({ photoUrl: null })
    }

    // Fetch place details to get photo reference
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${building.googlePlaceId}&fields=photos&key=${GOOGLE_API_KEY}`

    const detailsRes = await fetch(detailsUrl)
    const detailsData = await detailsRes.json()

    if (detailsData.status !== 'OK' || !detailsData.result?.photos?.length) {
      return NextResponse.json({ photoUrl: null })
    }

    // Get the first photo reference
    const photoReference = detailsData.result.photos[0].photo_reference

    // Construct the photo URL
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoReference}&key=${GOOGLE_API_KEY}`

    // Cache the photo URL in the database
    await prisma.building.update({
      where: { id },
      data: { primaryPhotoUrl: photoUrl },
    })

    return NextResponse.json(
      { photoUrl },
      {
        headers: {
          'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        },
      }
    )
  } catch (error) {
    console.error('Fetch building photo error:', error)
    return NextResponse.json({ error: 'Failed to fetch photo' }, { status: 500 })
  }
}
