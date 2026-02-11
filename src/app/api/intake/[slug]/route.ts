import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { sendIntakeConfirmationEmail, sendLocatorNotificationEmail } from '@/lib/email'

type RouteParams = {
  params: Promise<{ slug: string }>
}

// GET - Get locator info for branding (public)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params

    const locator = await prisma.locatorProfile.findUnique({
      where: { intakeSlug: slug },
      select: {
        id: true,
        companyName: true,
        companyLogo: true,
        intakeEnabled: true,
        intakeWelcomeMsg: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!locator) {
      return NextResponse.json({ error: 'Locator not found' }, { status: 404 })
    }

    if (!locator.intakeEnabled) {
      return NextResponse.json({ error: 'Intake form is disabled' }, { status: 403 })
    }

    return NextResponse.json({
      locator: {
        name: locator.companyName || locator.user.name || 'Your Locator',
        logo: locator.companyLogo,
        welcomeMessage: locator.intakeWelcomeMsg,
      },
    })
  } catch (error) {
    console.error('Get locator info error:', error)
    return NextResponse.json({ error: 'Failed to get locator info' }, { status: 500 })
  }
}

// POST - Submit intake form (public)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params

    const locator = await prisma.locatorProfile.findUnique({
      where: { intakeSlug: slug },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        clients: {
          where: { status: 'active' },
          select: { id: true },
        },
      },
    })

    if (!locator) {
      return NextResponse.json({ error: 'Locator not found' }, { status: 404 })
    }

    if (!locator.intakeEnabled) {
      return NextResponse.json({ error: 'Intake form is disabled' }, { status: 403 })
    }

    // Check max clients
    if (locator.clients.length >= 20) {
      return NextResponse.json(
        { error: 'This locator has reached their client limit' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      name,
      email,
      phone,
      contactPreference,
      moveInDate,
      budgetMin,
      budgetMax,
      vibes,
      intakeRef,
    } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (!email && !phone) {
      return NextResponse.json(
        { error: 'Email or phone is required' },
        { status: 400 }
      )
    }

    // Create the client
    const client = await prisma.locatorClient.create({
      data: {
        locatorId: locator.id,
        name,
        email: email || null,
        phone: phone || null,
        contactPreference: contactPreference || null,
        moveInDate: moveInDate ? new Date(moveInDate) : null,
        budgetMin: budgetMin || null,
        budgetMax: budgetMax || null,
        vibes: vibes || [],
        source: 'intake_form',
        intakeRef: intakeRef || null,
        // Set defaults for other fields
        bedrooms: [],
        neighborhoods: [],
        amenities: [],
        priorities: [],
        savedApartmentIds: [],
      },
    })

    const locatorName = locator.companyName || locator.user.name || 'Your Locator'
    const moveInDateFormatted = moveInDate
      ? new Date(moveInDate).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        })
      : undefined

    // Send confirmation email to client (if email provided)
    if (email) {
      await sendIntakeConfirmationEmail({
        to: email,
        clientName: name,
        locatorName,
        budgetMin,
        budgetMax,
        moveInDate: moveInDateFormatted,
        vibes,
      })
    }

    // Send notification email to locator
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://movdpro.vercel.app'}/clients/${client.id}`
    await sendLocatorNotificationEmail({
      to: locator.user.email,
      clientName: name,
      clientEmail: email,
      clientPhone: phone,
      contactPreference,
      budgetMin,
      budgetMax,
      moveInDate: moveInDateFormatted,
      vibes,
      dashboardUrl,
    })

    return NextResponse.json({ success: true, clientId: client.id })
  } catch (error) {
    console.error('Submit intake form error:', error)
    return NextResponse.json({ error: 'Failed to submit form' }, { status: 500 })
  }
}
