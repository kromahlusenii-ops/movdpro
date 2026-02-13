import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'
import { createSession, setSessionCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, companyName } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists with a locator profile
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { locatorProfile: true },
    })

    if (existingUser?.locatorProfile) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user if doesn't exist, or use existing
    let user = existingUser
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: name || null,
        },
        include: { locatorProfile: true },
      })
    }

    // Create locator profile with trial
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 7)

    await prisma.locatorProfile.create({
      data: {
        userId: user.id,
        passwordHash,
        companyName: companyName || null,
        subscriptionStatus: 'trialing',
        trialEndsAt,
        creditsRemaining: 50,
        creditsResetAt: trialEndsAt,
      },
    })

    // Create session and set cookie
    const sessionToken = await createSession(user.id)
    await setSessionCookie(sessionToken)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
