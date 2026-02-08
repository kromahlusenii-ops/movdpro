import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'
import { createSession, setSessionCookie } from '@/lib/auth'

// DEV ONLY - Auto-login for testing Pro features
export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const testEmail = 'pro-test@movdaway.com'
  const testPassword = 'testpassword123'

  try {
    // Find or create test user
    let user = await prisma.user.findUnique({
      where: { email: testEmail },
      include: { locatorProfile: true },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: testEmail,
          name: 'Pro Test User',
        },
        include: { locatorProfile: true },
      })
    }

    // Create locator profile if doesn't exist
    if (!user.locatorProfile) {
      const trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + 14)

      const passwordHash = await bcrypt.hash(testPassword, 12)

      await prisma.locatorProfile.create({
        data: {
          userId: user.id,
          passwordHash,
          companyName: 'Test Locator Co',
          subscriptionStatus: 'trialing',
          trialEndsAt,
          creditsRemaining: 50,
          creditsResetAt: trialEndsAt,
        },
      })
    }

    // Create session
    const sessionToken = await createSession(user.id)
    await setSessionCookie(sessionToken)

    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
  } catch (error) {
    console.error('Dev login error:', error)
    return NextResponse.json({ error: 'Failed to create test session' }, { status: 500 })
  }
}
