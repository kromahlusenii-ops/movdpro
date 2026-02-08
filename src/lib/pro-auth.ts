import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { cookies } from 'next/headers'
import { hashToken } from './auth'
import prisma from './db'

const SESSION_COOKIE_NAME = 'movd_session'

/**
 * Cached session user lookup - deduplicates within a single request
 */
export const getSessionUserCached = cache(async (): Promise<{ id: string; email: string } | null> => {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!sessionToken) {
    return null
  }

  const hashedToken = hashToken(sessionToken)

  const session = await prisma.magicLink.findUnique({
    where: { token: hashedToken },
    include: { user: true },
  })

  if (!session || !session.user) {
    return null
  }

  if (new Date() > session.expiresAt) {
    return null
  }

  return { id: session.user.id, email: session.user.email }
})

/**
 * Get locator profile with data caching (30 second revalidation)
 */
export async function getLocatorProfileCached(userId: string) {
  const getCachedProfile = unstable_cache(
    async (uid: string) => {
      return prisma.locatorProfile.findUnique({
        where: { userId: uid },
        include: {
          clients: {
            where: { status: 'active' },
            orderBy: { updatedAt: 'desc' },
          },
          reports: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      })
    },
    [`locator-profile-${userId}`],
    { revalidate: 30, tags: [`locator-${userId}`] }
  )

  return getCachedProfile(userId)
}

/**
 * Get all clients for a locator with caching
 */
export async function getClientsCached(userId: string) {
  const getCachedClients = unstable_cache(
    async (uid: string) => {
      const locator = await prisma.locatorProfile.findUnique({
        where: { userId: uid },
        include: {
          clients: {
            orderBy: { updatedAt: 'desc' },
          },
        },
      })
      return locator?.clients ?? []
    },
    [`clients-${userId}`],
    { revalidate: 30, tags: [`locator-${userId}`, `clients-${userId}`] }
  )

  return getCachedClients(userId)
}

export type LocatorData = {
  id: string
  companyName: string | null
  creditsRemaining: number
  subscriptionStatus: string
}
