import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'
import { createProSession, setProSessionCookie } from '@/lib/auth'
import { loginSchema } from '@/lib/api-schemas'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid request'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const { email, password } = parsed.data

    // Find Pro user with locator profile
    const user = await prisma.proUser.findUnique({
      where: { email: email.toLowerCase() },
      include: { locatorProfile: true },
    })

    if (!user?.locatorProfile) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.locatorProfile.passwordHash)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Create Pro session and set cookie
    const sessionToken = await createProSession(user.id)
    await setProSessionCookie(sessionToken)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Failed to sign in' },
      { status: 500 }
    )
  }
}
