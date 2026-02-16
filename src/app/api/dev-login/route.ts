import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'
import { createProSession, setProSessionCookie } from '@/lib/auth'

// DEV ONLY - Auto-login for testing Pro features. Disabled in production.
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const testEmail = 'pro-test@movdaway.com'
  const testPassword = process.env.DEV_LOGIN_PASSWORD ?? 'testpassword123'

  try {
    let user = await prisma.proUser.findUnique({
      where: { email: testEmail },
      include: { locatorProfile: true },
    })

    if (!user) {
      user = await prisma.proUser.create({
        data: {
          email: testEmail,
          name: 'Pro Test User',
        },
        include: { locatorProfile: true },
      })
    }

    if (!user.locatorProfile) {
      const trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + 7)
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

    const sessionToken = await createProSession(user.id)
    await setProSessionCookie(sessionToken)

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
    return NextResponse.redirect(new URL('/dashboard', baseUrl))
  } catch (error) {
    console.error('Dev login error:', error)
    return NextResponse.json({ error: 'Failed to create test session' }, { status: 500 })
  }
}
