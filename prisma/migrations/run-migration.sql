-- Migration: Separate MOVD and MOVD Pro users
-- Run this in Supabase SQL Editor or via psql

-- Step 1: Create ProUser table
CREATE TABLE IF NOT EXISTS "ProUser" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ProUser_email_idx" ON "ProUser"(email);

-- Step 2: Create ProMagicLink table
CREATE TABLE IF NOT EXISTS "ProMagicLink" (
  id TEXT PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  "userId" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "ProUser"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "ProMagicLink_token_idx" ON "ProMagicLink"(token);
CREATE INDEX IF NOT EXISTS "ProMagicLink_email_idx" ON "ProMagicLink"(email);

-- Step 3: Copy Users with LocatorProfile to ProUser
INSERT INTO "ProUser" (id, email, name, "createdAt", "updatedAt")
SELECT u.id, u.email, u.name, u."createdAt", u."updatedAt"
FROM "User" u
INNER JOIN "LocatorProfile" lp ON lp."userId" = u.id
ON CONFLICT (id) DO NOTHING;

-- Step 4: Copy MagicLinks for Pro users to ProMagicLink
INSERT INTO "ProMagicLink" (id, token, email, "userId", "expiresAt", "usedAt", "createdAt")
SELECT ml.id, ml.token, ml.email, ml."userId", ml."expiresAt", ml."usedAt", ml."createdAt"
FROM "MagicLink" ml
INNER JOIN "ProUser" pu ON pu.id = ml."userId"
ON CONFLICT (id) DO NOTHING;

-- Step 5: Drop old foreign key constraint on LocatorProfile
ALTER TABLE "LocatorProfile" DROP CONSTRAINT IF EXISTS "LocatorProfile_userId_fkey";

-- Step 6: Add new foreign key constraint pointing to ProUser
ALTER TABLE "LocatorProfile"
ADD CONSTRAINT "LocatorProfile_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "ProUser"(id) ON DELETE CASCADE;

-- Step 7: Remove locatorProfile relation from User (clean up schema)
-- Note: The User.locatorProfile relation is handled by Prisma schema, not DB constraint

-- Verify migration
SELECT 'ProUser count:' as label, COUNT(*) as count FROM "ProUser"
UNION ALL
SELECT 'ProMagicLink count:', COUNT(*) FROM "ProMagicLink"
UNION ALL
SELECT 'LocatorProfile count:', COUNT(*) FROM "LocatorProfile";
