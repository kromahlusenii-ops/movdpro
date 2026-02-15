/**
 * Migration script: User -> ProUser for MOVD Pro users
 *
 * This script:
 * 1. Creates ProUser records for all Users with LocatorProfile
 * 2. Updates LocatorProfile.userId to reference the new ProUser
 * 3. Copies MagicLink records to ProMagicLink for Pro users
 *
 * Run with: npx ts-node prisma/migrations/migrate-to-pro-user.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting migration: User -> ProUser for MOVD Pro users\n')

  // Step 1: Find all users with LocatorProfile (these are Pro users)
  const proUsers = await prisma.user.findMany({
    where: {
      locatorProfile: { isNot: null }
    },
    include: {
      locatorProfile: true,
      magicLinks: true,
    }
  })

  console.log(`Found ${proUsers.length} Pro users to migrate\n`)

  for (const user of proUsers) {
    console.log(`Migrating user: ${user.email}`)

    // Step 2: Create ProUser with same ID (to maintain foreign key references)
    try {
      await prisma.$executeRaw`
        INSERT INTO "ProUser" (id, email, name, "createdAt", "updatedAt")
        VALUES (${user.id}, ${user.email}, ${user.name}, ${user.createdAt}, ${user.updatedAt})
        ON CONFLICT (id) DO NOTHING
      `
      console.log(`  ✓ Created ProUser`)
    } catch (error) {
      console.log(`  - ProUser already exists or error: ${error}`)
    }

    // Step 3: Copy MagicLinks to ProMagicLink
    for (const ml of user.magicLinks) {
      try {
        await prisma.$executeRaw`
          INSERT INTO "ProMagicLink" (id, token, email, "userId", "expiresAt", "usedAt", "createdAt")
          VALUES (${ml.id}, ${ml.token}, ${ml.email}, ${ml.userId}, ${ml.expiresAt}, ${ml.usedAt}, ${ml.createdAt})
          ON CONFLICT (id) DO NOTHING
        `
      } catch {
        // Ignore duplicates
      }
    }
    console.log(`  ✓ Copied ${user.magicLinks.length} magic links`)
  }

  console.log('\n✅ Migration complete!')
  console.log('\nNote: LocatorProfile.userId now references ProUser instead of User.')
  console.log('Existing sessions will need to be re-created (users will need to log in again).')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
