/**
 * Client Share Report API
 *
 * POST - Create a shareable report link for a client
 * GET - List all share links for a client
 * DELETE - Deactivate a share link
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserCached } from '@/lib/pro-auth'
import prisma from '@/lib/db'
import { sendShareReportEmail } from '@/lib/email'

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://movdaway.com').replace(/\/$/, '')

// POST - Create a new share report
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params
    const user = await getSessionUserCached()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify client belongs to this locator
    const client = await prisma.locatorClient.findFirst({
      where: {
        id: clientId,
        locator: { userId: user.id },
      },
      include: {
        savedListings: {
          include: {
            unit: {
              include: {
                building: {
                  include: {
                    neighborhood: {
                      select: {
                        id: true,
                        name: true,
                        slug: true,
                        grade: true,
                        walkScore: true,
                        transitScore: true,
                      },
                    },
                    management: {
                      select: {
                        id: true,
                        name: true,
                        slug: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        savedBuildings: {
          include: {
            building: {
              include: {
                neighborhood: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    grade: true,
                    walkScore: true,
                    transitScore: true,
                  },
                },
                management: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
                units: {
                  where: { isAvailable: true },
                  orderBy: { bedrooms: 'asc' },
                },
              },
            },
          },
        },
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Check if client has any listings or buildings to share
    if (client.savedListings.length === 0 && client.savedBuildings.length === 0) {
      return NextResponse.json(
        { error: 'No listings or buildings saved for this client' },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { expiresInDays, sendEmail } = body

    // Build preferences snapshot
    const preferences = {
      budgetMin: client.budgetMin,
      budgetMax: client.budgetMax,
      bedrooms: client.bedrooms,
      neighborhoods: client.neighborhoods,
      vibes: client.vibes,
      priorities: client.priorities,
      hasDog: client.hasDog,
      hasCat: client.hasCat,
      hasKids: client.hasKids,
      worksFromHome: client.worksFromHome,
      needsParking: client.needsParking,
      commutePreference: client.commutePreference,
    }

    // Build listings snapshot (combine saved listings and buildings)
    const listings = [
      // Individual listings
      ...client.savedListings.map((saved) => ({
        type: 'listing' as const,
        id: saved.unit.id,
        name: saved.unit.name,
        bedrooms: saved.unit.bedrooms,
        bathrooms: saved.unit.bathrooms,
        sqftMin: saved.unit.sqftMin,
        sqftMax: saved.unit.sqftMax,
        rentMin: saved.unit.rentMin,
        rentMax: saved.unit.rentMax,
        notes: saved.notes,
        building: {
          id: saved.unit.building.id,
          name: saved.unit.building.name,
          address: saved.unit.building.address,
          city: saved.unit.building.city,
          state: saved.unit.building.state,
          primaryPhotoUrl: saved.unit.building.primaryPhotoUrl,
          photos: saved.unit.building.photos,
          amenities: saved.unit.building.amenities,
          rating: saved.unit.building.rating,
          reviewCount: saved.unit.building.reviewCount,
          listingUrl: saved.unit.building.listingUrl,
          floorplansUrl: saved.unit.building.floorplansUrl,
        },
        neighborhood: saved.unit.building.neighborhood,
        management: saved.unit.building.management,
      })),
      // Saved buildings (as building cards)
      ...client.savedBuildings.map((saved) => ({
        type: 'building' as const,
        id: saved.building.id,
        name: saved.building.name,
        address: saved.building.address,
        city: saved.building.city,
        state: saved.building.state,
        primaryPhotoUrl: saved.building.primaryPhotoUrl,
        photos: saved.building.photos,
        amenities: saved.building.amenities,
        rating: saved.building.rating,
        reviewCount: saved.building.reviewCount,
        listingUrl: saved.building.listingUrl,
        floorplansUrl: saved.building.floorplansUrl,
        notes: saved.notes,
        neighborhood: saved.building.neighborhood,
        management: saved.building.management,
        units: saved.building.units.map((u) => ({
          id: u.id,
          name: u.name,
          bedrooms: u.bedrooms,
          bathrooms: u.bathrooms,
          sqftMin: u.sqftMin,
          sqftMax: u.sqftMax,
          rentMin: u.rentMin,
          rentMax: u.rentMax,
        })),
      })),
    ]

    // Calculate expiration
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null

    // Create share report
    const shareReport = await prisma.clientShareReport.create({
      data: {
        clientId,
        clientName: client.name.split(' ')[0], // First name only for privacy
        preferences,
        listings,
        expiresAt,
      },
    })

    const shareUrl = `${APP_URL}/share/${shareReport.shareId}`

    // Send email if requested and client has email
    let emailSent = false
    if (sendEmail && client.email) {
      const emailResult = await sendShareReportEmail({
        to: client.email,
        clientName: client.name.split(' ')[0],
        shareUrl,
        listingCount: listings.length,
      })
      emailSent = emailResult.success
    }

    return NextResponse.json({
      shareId: shareReport.shareId,
      shareUrl,
      expiresAt: shareReport.expiresAt,
      emailSent,
    })
  } catch (error) {
    console.error('Create share report error:', error)
    return NextResponse.json({ error: 'Failed to create share report' }, { status: 500 })
  }
}

// GET - List all share reports for a client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params
    const user = await getSessionUserCached()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify client belongs to this locator
    const client = await prisma.locatorClient.findFirst({
      where: {
        id: clientId,
        locator: { userId: user.id },
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const shareReports = await prisma.clientShareReport.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        shareId: true,
        viewCount: true,
        lastViewedAt: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
      },
    })

    const reports = shareReports.map((report) => ({
      ...report,
      shareUrl: `${APP_URL}/share/${report.shareId}`,
      isExpired: report.expiresAt ? new Date(report.expiresAt) < new Date() : false,
    }))

    return NextResponse.json({ reports })
  } catch (error) {
    console.error('Get share reports error:', error)
    return NextResponse.json({ error: 'Failed to get share reports' }, { status: 500 })
  }
}

// DELETE - Deactivate a share report
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params
    const user = await getSessionUserCached()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { shareId } = body

    if (!shareId) {
      return NextResponse.json({ error: 'Share ID is required' }, { status: 400 })
    }

    // Verify client belongs to this locator
    const client = await prisma.locatorClient.findFirst({
      where: {
        id: clientId,
        locator: { userId: user.id },
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Deactivate the share report
    await prisma.clientShareReport.update({
      where: {
        clientId_shareId: {
          clientId,
          shareId,
        },
      },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete share report error:', error)
    return NextResponse.json({ error: 'Failed to delete share report' }, { status: 500 })
  }
}
