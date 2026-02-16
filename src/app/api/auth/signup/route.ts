import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'
import { createProSession, setProSessionCookie } from '@/lib/auth'
import { signupSchema } from '@/lib/api-schemas'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = signupSchema.safeParse(body)

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid request'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const { email, password, name, companyName } = parsed.data

    // Check if Pro user already exists with a locator profile
    const existingUser = await prisma.proUser.findUnique({
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

    // Create Pro user if doesn't exist, or use existing
    let user = existingUser
    if (!user) {
      user = await prisma.proUser.create({
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

    // Create Pro session and set cookie
    const sessionToken = await createProSession(user.id)
    await setProSessionCookie(sessionToken)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
