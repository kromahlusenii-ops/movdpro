-- Add intake form fields to LocatorProfile
ALTER TABLE "LocatorProfile" ADD COLUMN "intakeSlug" TEXT;
ALTER TABLE "LocatorProfile" ADD COLUMN "intakeEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "LocatorProfile" ADD COLUMN "intakeWelcomeMsg" TEXT;

-- Add intake source tracking fields to LocatorClient
ALTER TABLE "LocatorClient" ADD COLUMN "source" TEXT;
ALTER TABLE "LocatorClient" ADD COLUMN "intakeRef" TEXT;
ALTER TABLE "LocatorClient" ADD COLUMN "contactPreference" TEXT;

-- Create unique index on intakeSlug
CREATE UNIQUE INDEX "LocatorProfile_intakeSlug_key" ON "LocatorProfile"("intakeSlug");

-- Create index on intakeSlug for fast lookups
CREATE INDEX "LocatorProfile_intakeSlug_idx" ON "LocatorProfile"("intakeSlug");
