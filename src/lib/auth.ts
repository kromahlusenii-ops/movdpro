import { cookies } from 'next/headers'
import { randomBytes, createHash } from 'crypto'
import prisma from './db'

const SESSION_COOKIE_NAME = 'movd_session'
const SESSION_DURATION_DAYS = 30
const MAGIC_LINK_EXPIRY_MINUTES = 15
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 3

export function generateToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function createMagicLink(email: string): Promise<{ token: string; rateLimited: boolean }> {
  const normalizedEmail = email.toLowerCase().trim()

  // Check rate limit
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS)
  const recentRequests = await prisma.magicLink.count({
    where: {
      email: normalizedEmail,
      createdAt: { gte: windowStart },
    },
  })

  if (recentRequests >= RATE_LIMIT_MAX_REQUESTS) {
    return { token: '', rateLimited: true }
  }

  // Find or create user
  let user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  })

  if (!user) {
    user = await prisma.user.create({
      data: { email: normalizedEmail },
    })
  }

  // Generate token
  const token = generateToken()
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000)

  // Store magic link
  await prisma.magicLink.create({
    data: {
      token: hashToken(token),
      email: normalizedEmail,
      userId: user.id,
      expiresAt,
    },
  })

  return { token, rateLimited: false }
}

export async function verifyMagicLink(token: string): Promise<{ userId: string; email: string } | null> {
  const hashedToken = hashToken(token)

  const magicLink = await prisma.magicLink.findUnique({
    where: { token: hashedToken },
    include: { user: true },
  })

  if (!magicLink) {
    return null
  }

  // Check if expired
  if (new Date() > magicLink.expiresAt) {
    return null
  }

  // Check if already used
  if (magicLink.usedAt) {
    return null
  }

  // Mark as used
  await prisma.magicLink.update({
    where: { id: magicLink.id },
    data: { usedAt: new Date() },
  })

  // Link any orphaned sessions to this user
  if (magicLink.user) {
    await prisma.quizSession.updateMany({
      where: {
        email: magicLink.email,
        userId: null,
      },
      data: {
        userId: magicLink.user.id,
      },
    })
  }

  return magicLink.user ? { userId: magicLink.user.id, email: magicLink.email } : null
}

export async function createSession(userId: string): Promise<string> {
  const sessionToken = generateToken()
  const hashedToken = hashToken(sessionToken)
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000)

  // Store session token as a magic link that's already "used" (we repurpose the model)
  await prisma.magicLink.create({
    data: {
      token: hashedToken,
      email: '', // Not needed for session tokens
      userId,
      expiresAt,
      usedAt: new Date(), // Mark as used immediately (this is a session, not a login link)
    },
  })

  return sessionToken
}

export async function setSessionCookie(sessionToken: string): Promise<void> {
  const cookieStore = await cookies()
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000)

  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  })
}

export async function getSessionUser(): Promise<{ id: string; email: string } | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!sessionToken) {
    return null
  }

  const hashedToken = hashToken(sessionToken)

  // Find session (a magic link that's been used)
  const session = await prisma.magicLink.findUnique({
    where: { token: hashedToken },
    include: { user: true },
  })

  if (!session || !session.user) {
    return null
  }

  // Check if session expired
  if (new Date() > session.expiresAt) {
    return null
  }

  return { id: session.user.id, email: session.user.email }
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function findOrCreateUser(email: string, name?: string): Promise<{ id: string; email: string; name: string | null }> {
  const normalizedEmail = email.toLowerCase().trim()

  let user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name || null,
      },
    })
  } else if (name && !user.name) {
    // Update name if user exists but doesn't have a name yet
    user = await prisma.user.update({
      where: { id: user.id },
      data: { name },
    })
  }

  return { id: user.id, email: user.email, name: user.name }
}
