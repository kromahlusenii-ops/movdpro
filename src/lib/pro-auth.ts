import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { cookies } from 'next/headers'
import { hashToken } from './auth'
import prisma from './db'

const PRO_SESSION_COOKIE_NAME = 'movd_pro_session'

/**
 * Cached Pro session user lookup - deduplicates within a single request
 */
export const getSessionUserCached = cache(async (): Promise<{ id: string; email: string } | null> => {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(PRO_SESSION_COOKIE_NAME)?.value

  if (!sessionToken) {
    return null
  }

  const hashedToken = hashToken(sessionToken)

  const session = await prisma.proMagicLink.findUnique({
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

/**
 * Get available listings count with caching (60 second revalidation)
 */
export async function getListingsCountCached() {
  const getCachedCount = unstable_cache(
    async () => {
      return prisma.unit.count({
        where: { isAvailable: true },
      })
    },
    ['listings-count'],
    { revalidate: 60, tags: ['listings-count'] }
  )

  return getCachedCount()
}

/**
 * Get reports for a locator with caching (30 second revalidation)
 */
export async function getReportsCached(userId: string) {
  const getCachedReports = unstable_cache(
    async (uid: string) => {
      const locator = await prisma.locatorProfile.findUnique({
        where: { userId: uid },
        include: {
          reports: {
            orderBy: { createdAt: 'desc' },
            include: {
              client: {
                select: { name: true },
              },
              properties: {
                select: { id: true },
              },
            },
          },
        },
      })
      return locator?.reports ?? []
    },
    [`reports-${userId}`],
    { revalidate: 30, tags: [`locator-${userId}`, `reports-${userId}`] }
  )

  return getCachedReports(userId)
}

/**
 * Get locator profile with email for settings page (30 second revalidation)
 */
export async function getLocatorWithEmailCached(userId: string) {
  const getCachedLocatorWithEmail = unstable_cache(
    async (uid: string) => {
      return prisma.locatorProfile.findUnique({
        where: { userId: uid },
        include: {
          user: {
            select: { email: true, name: true },
          },
        },
      })
    },
    [`locator-email-${userId}`],
    { revalidate: 30, tags: [`locator-${userId}`] }
  )

  return getCachedLocatorWithEmail(userId)
}

/**
 * Get locator profile with intake settings for settings page (30 second revalidation)
 */
export async function getLocatorWithIntakeSettingsCached(userId: string) {
  const getCachedLocatorWithIntake = unstable_cache(
    async (uid: string) => {
      return prisma.locatorProfile.findUnique({
        where: { userId: uid },
        select: {
          intakeSlug: true,
          intakeEnabled: true,
          intakeWelcomeMsg: true,
        },
      })
    },
    [`locator-intake-${userId}`],
    { revalidate: 30, tags: [`locator-${userId}`] }
  )

  return getCachedLocatorWithIntake(userId)
}

export type LocatorData = {
  id: string
  companyName: string | null
  creditsRemaining: number
  subscriptionStatus: string
}
