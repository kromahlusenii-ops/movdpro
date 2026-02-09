/**
 * Specials Sync Utility
 *
 * Handles upserting scraped specials to the database and deactivating stale specials.
 */

import prisma from '@/lib/db'
import { ScrapedSpecial, ScrapedBuilding } from './types'

interface UpsertSpecialsOptions {
  buildingId: string
  provider: string
  specials: ScrapedSpecial[]
  sourceUrl: string
}

/**
 * Generate a stable hash for a special to detect duplicates
 */
function hashSpecial(title: string, description: string): string {
  // Simple hash based on title + truncated description
  const content = `${title}|${description.slice(0, 200)}`
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(16)
}

/**
 * Upsert specials for a building
 * - Creates new specials that don't exist
 * - Updates existing specials (by title + description hash)
 * - Returns count of created/updated specials
 */
export async function upsertSpecials({
  buildingId,
  provider,
  specials,
  sourceUrl,
}: UpsertSpecialsOptions): Promise<{ created: number; updated: number }> {
  let created = 0
  let updated = 0

  for (const special of specials) {
    // Generate hash for deduplication
    const hash = hashSpecial(special.title, special.description)

    // Try to find existing special by building + title similarity
    const existing = await prisma.special.findFirst({
      where: {
        buildingId,
        title: special.title,
        isActive: true,
      },
    })

    if (existing) {
      // Update existing special
      await prisma.special.update({
        where: { id: existing.id },
        data: {
          description: special.description,
          discountType: special.discountType,
          discountValue: special.discountValue,
          conditions: special.conditions,
          startDate: special.startDate,
          endDate: special.endDate,
          sourceUrl,
          rawHtml: special.rawHtml,
          scrapedAt: new Date(),
        },
      })
      updated++
    } else {
      // Check if there's an inactive special that matches
      const inactive = await prisma.special.findFirst({
        where: {
          buildingId,
          title: special.title,
          isActive: false,
        },
      })

      if (inactive) {
        // Reactivate and update
        await prisma.special.update({
          where: { id: inactive.id },
          data: {
            description: special.description,
            discountType: special.discountType,
            discountValue: special.discountValue,
            conditions: special.conditions,
            startDate: special.startDate,
            endDate: special.endDate,
            sourceUrl,
            rawHtml: special.rawHtml,
            scrapedAt: new Date(),
            isActive: true,
          },
        })
        updated++
      } else {
        // Create new special
        await prisma.special.create({
          data: {
            buildingId,
            provider,
            title: special.title,
            description: special.description,
            discountType: special.discountType,
            discountValue: special.discountValue,
            conditions: special.conditions,
            startDate: special.startDate,
            endDate: special.endDate,
            sourceUrl,
            rawHtml: special.rawHtml,
            scrapedAt: new Date(),
            isActive: true,
          },
        })
        created++
      }
    }
  }

  return { created, updated }
}

/**
 * Deactivate specials that haven't been scraped recently
 */
export async function deactivateStaleSpecials(
  provider: string,
  hoursThreshold: number = 48
): Promise<number> {
  const threshold = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000)

  const result = await prisma.special.updateMany({
    where: {
      provider,
      isActive: true,
      scrapedAt: { lt: threshold },
    },
    data: {
      isActive: false,
    },
  })

  return result.count
}

/**
 * Deactivate expired specials (past their end date)
 */
export async function deactivateExpiredSpecials(): Promise<number> {
  const now = new Date()

  const result = await prisma.special.updateMany({
    where: {
      isActive: true,
      endDate: { lt: now },
    },
    data: {
      isActive: false,
    },
  })

  return result.count
}

/**
 * Sync specials from scraped buildings to database
 */
export async function syncSpecialsFromBuildings(
  buildings: ScrapedBuilding[],
  provider: string
): Promise<{ totalCreated: number; totalUpdated: number; errors: string[] }> {
  console.log(`[specials-sync] Starting sync for ${provider}, ${buildings.length} buildings`)

  let totalCreated = 0
  let totalUpdated = 0
  const errors: string[] = []

  const buildingsWithSpecials = buildings.filter(b => b.specials && b.specials.length > 0)
  console.log(`[specials-sync] ${buildingsWithSpecials.length} buildings have specials`)

  for (const building of buildingsWithSpecials) {
    console.log(`[specials-sync] Processing ${building.name} with ${building.specials?.length} specials`)

    // Find the building in the database by address and management company
    const dbBuilding = await prisma.building.findFirst({
      where: {
        OR: [
          { listingUrl: building.listingUrl },
          { address: building.address, management: { slug: provider } },
        ],
      },
      select: { id: true },
    })

    if (!dbBuilding) {
      console.log(`[specials-sync] Building not found: ${building.name}`)
      errors.push(`Building not found in database: ${building.name} (${building.address})`)
      continue
    }

    try {
      const { created, updated } = await upsertSpecials({
        buildingId: dbBuilding.id,
        provider,
        specials: building.specials!,
        sourceUrl: building.listingUrl,
      })

      console.log(`[specials-sync] ${building.name}: ${created} created, ${updated} updated`)
      totalCreated += created
      totalUpdated += updated
    } catch (error) {
      const errMsg = `Failed to sync specials for ${building.name}: ${error instanceof Error ? error.message : String(error)}`
      console.error(`[specials-sync] ${errMsg}`)
      errors.push(errMsg)
    }
  }

  console.log(`[specials-sync] Complete: ${totalCreated} created, ${totalUpdated} updated, ${errors.length} errors`)
  return { totalCreated, totalUpdated, errors }
}

/**
 * Get active specials for a building
 */
export async function getActiveSpecialsForBuilding(buildingId: string) {
  return prisma.special.findMany({
    where: {
      buildingId,
      isActive: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Get all active specials with building info
 */
export async function getAllActiveSpecials() {
  return prisma.special.findMany({
    where: { isActive: true },
    include: {
      building: {
        select: {
          id: true,
          name: true,
          address: true,
          primaryPhotoUrl: true,
          neighborhood: {
            select: { name: true, slug: true },
          },
        },
      },
    },
    orderBy: [{ discountValue: 'desc' }, { createdAt: 'desc' }],
  })
}
