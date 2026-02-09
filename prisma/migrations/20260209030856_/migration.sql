-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MagicLink" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MagicLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareLink" (
    "id" TEXT NOT NULL,
    "shareId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "showTopN" INTEGER NOT NULL DEFAULT 3,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Neighborhood" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "infrastructureScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "safetyScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "livabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trajectoryScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sentimentScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "compositeScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grade" TEXT NOT NULL DEFAULT 'B',
    "walkScore" INTEGER,
    "transitScore" INTEGER,
    "bikeScore" INTEGER,
    "medianRent" INTEGER,
    "rentMin" INTEGER,
    "rentMax" INTEGER,
    "boundary" JSONB,
    "centerLat" DOUBLE PRECISION NOT NULL,
    "centerLng" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "warnings" TEXT[],
    "highlights" TEXT[],
    "characterTags" TEXT[],
    "tagline" TEXT,
    "civicInsights" TEXT,
    "heroImage" TEXT,
    "thumbImage" TEXT,
    "sentimentSummary" TEXT,
    "lifestyleSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Neighborhood_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SentimentQuote" (
    "id" TEXT NOT NULL,
    "neighborhoodId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sentiment" TEXT NOT NULL,
    "theme" TEXT,
    "postUrl" TEXT,
    "postId" TEXT,
    "author" TEXT,
    "subreddit" TEXT,
    "upvotes" INTEGER,
    "postDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SentimentQuote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizSession" (
    "id" TEXT NOT NULL,
    "budgetMin" INTEGER NOT NULL,
    "budgetMax" INTEGER NOT NULL,
    "priorities" TEXT[],
    "vibes" TEXT[],
    "workAddress" TEXT,
    "maxCommute" INTEGER,
    "ageBracket" TEXT,
    "bedrooms" TEXT,
    "bathrooms" TEXT,
    "hasKids" BOOLEAN NOT NULL DEFAULT false,
    "hasDog" BOOLEAN NOT NULL DEFAULT false,
    "moveStatus" TEXT,
    "transportation" TEXT,
    "additionalNotes" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmTerm" TEXT,
    "utmContent" TEXT,
    "referrer" TEXT,
    "userId" TEXT,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "stripeSessionId" TEXT,
    "stripePaymentId" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "QuizSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizResult" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "neighborhoodId" TEXT NOT NULL,
    "matchScore" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Waitlist" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LifestyleVenue" (
    "id" TEXT NOT NULL,
    "neighborhoodId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "address" TEXT,
    "rating" DOUBLE PRECISION,
    "priceLevel" INTEGER,
    "description" TEXT,
    "googlePlaceId" TEXT,
    "yelpId" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "photoUrl" TEXT,
    "photoRef" TEXT,
    "isHighlight" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LifestyleVenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApartmentListing" (
    "id" TEXT NOT NULL,
    "neighborhoodId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "description" TEXT,
    "rentMin" INTEGER NOT NULL,
    "rentMax" INTEGER NOT NULL,
    "bedrooms" TEXT[],
    "bathrooms" DOUBLE PRECISION,
    "sqftMin" INTEGER,
    "sqftMax" INTEGER,
    "amenities" TEXT[],
    "petPolicy" TEXT,
    "parkingType" TEXT,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "walkScore" INTEGER,
    "transitScore" INTEGER,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "photoUrl" TEXT,
    "photos" TEXT[],
    "rentCastId" TEXT,
    "googlePlaceId" TEXT,
    "listingUrl" TEXT,
    "managementCompany" TEXT,
    "isGreystar" BOOLEAN NOT NULL DEFAULT false,
    "greystarConfidence" TEXT,
    "floorplansUrl" TEXT,
    "greystarDetectedAt" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'rentcast',
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isHighlight" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApartmentListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManagementCompany" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "website" TEXT,
    "logoUrl" TEXT,
    "scrapeStrategy" TEXT,
    "lastScrapedAt" TIMESTAMP(3),
    "scrapeStatus" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManagementCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Building" (
    "id" TEXT NOT NULL,
    "managementId" TEXT,
    "neighborhoodId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Charlotte',
    "state" TEXT NOT NULL DEFAULT 'NC',
    "zipCode" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "googlePlaceId" TEXT,
    "rating" DOUBLE PRECISION,
    "reviewCount" INTEGER,
    "website" TEXT,
    "phone" TEXT,
    "primaryPhotoUrl" TEXT,
    "photos" TEXT[],
    "amenities" TEXT[],
    "petPolicy" TEXT,
    "parkingType" TEXT,
    "listingUrl" TEXT,
    "floorplansUrl" TEXT,
    "yearBuilt" INTEGER,
    "totalUnits" INTEGER,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Special" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "unitId" TEXT,
    "provider" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "discountType" TEXT,
    "discountValue" DOUBLE PRECISION,
    "conditions" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "sourceUrl" TEXT NOT NULL,
    "rawHtml" TEXT,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Special_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "unitNumber" TEXT,
    "name" TEXT,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" DOUBLE PRECISION NOT NULL,
    "sqftMin" INTEGER,
    "sqftMax" INTEGER,
    "rentMin" INTEGER NOT NULL,
    "rentMax" INTEGER NOT NULL,
    "availableCount" INTEGER NOT NULL DEFAULT 0,
    "availableDate" TIMESTAMP(3),
    "photoUrl" TEXT,
    "rentCastId" TEXT,
    "rentCastData" JSONB,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientSavedBuilding" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "notes" TEXT,
    "matchScore" DOUBLE PRECISION,
    "matchReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientSavedBuilding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientSavedListing" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientSavedListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocatorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "companyName" TEXT,
    "companyLogo" TEXT,
    "phone" TEXT,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'trialing',
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "creditsRemaining" INTEGER NOT NULL DEFAULT 50,
    "creditsResetAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocatorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocatorClient" (
    "id" TEXT NOT NULL,
    "locatorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "budgetMin" INTEGER,
    "budgetMax" INTEGER,
    "bedrooms" TEXT[],
    "neighborhoods" TEXT[],
    "amenities" TEXT[],
    "moveInDate" TIMESTAMP(3),
    "vibes" TEXT[],
    "priorities" TEXT[],
    "hasDog" BOOLEAN NOT NULL DEFAULT false,
    "hasCat" BOOLEAN NOT NULL DEFAULT false,
    "hasKids" BOOLEAN NOT NULL DEFAULT false,
    "worksFromHome" BOOLEAN NOT NULL DEFAULT false,
    "needsParking" BOOLEAN NOT NULL DEFAULT false,
    "commuteAddress" TEXT,
    "commutePreference" TEXT,
    "savedApartmentIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocatorClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientShareReport" (
    "id" TEXT NOT NULL,
    "shareId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "preferences" JSONB NOT NULL,
    "listings" JSONB NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientShareReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditLedger" (
    "id" TEXT NOT NULL,
    "locatorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProSavedSearch" (
    "id" TEXT NOT NULL,
    "locatorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "newCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProSavedSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProComparison" (
    "id" TEXT NOT NULL,
    "locatorId" TEXT NOT NULL,
    "name" TEXT,
    "propertyIds" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProComparison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProReport" (
    "id" TEXT NOT NULL,
    "locatorId" TEXT NOT NULL,
    "clientId" TEXT,
    "title" TEXT NOT NULL,
    "propertyIds" TEXT[],
    "buildingIds" TEXT[],
    "neighborhoodIds" TEXT[],
    "customNotes" TEXT,
    "aiSummary" TEXT,
    "shareToken" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MagicLink_token_key" ON "MagicLink"("token");

-- CreateIndex
CREATE INDEX "MagicLink_token_idx" ON "MagicLink"("token");

-- CreateIndex
CREATE INDEX "MagicLink_email_idx" ON "MagicLink"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ShareLink_shareId_key" ON "ShareLink"("shareId");

-- CreateIndex
CREATE INDEX "ShareLink_shareId_idx" ON "ShareLink"("shareId");

-- CreateIndex
CREATE INDEX "ShareLink_sessionId_idx" ON "ShareLink"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Neighborhood_name_key" ON "Neighborhood"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Neighborhood_slug_key" ON "Neighborhood"("slug");

-- CreateIndex
CREATE INDEX "SentimentQuote_neighborhoodId_idx" ON "SentimentQuote"("neighborhoodId");

-- CreateIndex
CREATE UNIQUE INDEX "QuizSession_stripeSessionId_key" ON "QuizSession"("stripeSessionId");

-- CreateIndex
CREATE INDEX "QuizSession_stripeSessionId_idx" ON "QuizSession"("stripeSessionId");

-- CreateIndex
CREATE INDEX "QuizSession_userId_idx" ON "QuizSession"("userId");

-- CreateIndex
CREATE INDEX "QuizSession_email_idx" ON "QuizSession"("email");

-- CreateIndex
CREATE INDEX "QuizResult_sessionId_idx" ON "QuizResult"("sessionId");

-- CreateIndex
CREATE INDEX "QuizResult_neighborhoodId_idx" ON "QuizResult"("neighborhoodId");

-- CreateIndex
CREATE UNIQUE INDEX "Waitlist_email_city_key" ON "Waitlist"("email", "city");

-- CreateIndex
CREATE INDEX "LifestyleVenue_neighborhoodId_idx" ON "LifestyleVenue"("neighborhoodId");

-- CreateIndex
CREATE INDEX "LifestyleVenue_category_idx" ON "LifestyleVenue"("category");

-- CreateIndex
CREATE UNIQUE INDEX "ApartmentListing_rentCastId_key" ON "ApartmentListing"("rentCastId");

-- CreateIndex
CREATE INDEX "ApartmentListing_neighborhoodId_idx" ON "ApartmentListing"("neighborhoodId");

-- CreateIndex
CREATE INDEX "ApartmentListing_rentMin_rentMax_idx" ON "ApartmentListing"("rentMin", "rentMax");

-- CreateIndex
CREATE INDEX "ApartmentListing_isAvailable_idx" ON "ApartmentListing"("isAvailable");

-- CreateIndex
CREATE UNIQUE INDEX "ManagementCompany_name_key" ON "ManagementCompany"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ManagementCompany_slug_key" ON "ManagementCompany"("slug");

-- CreateIndex
CREATE INDEX "ManagementCompany_slug_idx" ON "ManagementCompany"("slug");

-- CreateIndex
CREATE INDEX "Building_neighborhoodId_idx" ON "Building"("neighborhoodId");

-- CreateIndex
CREATE INDEX "Building_lat_lng_idx" ON "Building"("lat", "lng");

-- CreateIndex
CREATE INDEX "Building_isAvailable_idx" ON "Building"("isAvailable");

-- CreateIndex
CREATE UNIQUE INDEX "Building_managementId_address_key" ON "Building"("managementId", "address");

-- CreateIndex
CREATE INDEX "Special_buildingId_idx" ON "Special"("buildingId");

-- CreateIndex
CREATE INDEX "Special_unitId_idx" ON "Special"("unitId");

-- CreateIndex
CREATE INDEX "Special_provider_idx" ON "Special"("provider");

-- CreateIndex
CREATE INDEX "Special_isActive_idx" ON "Special"("isActive");

-- CreateIndex
CREATE INDEX "Special_endDate_idx" ON "Special"("endDate");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_rentCastId_key" ON "Unit"("rentCastId");

-- CreateIndex
CREATE INDEX "Unit_buildingId_idx" ON "Unit"("buildingId");

-- CreateIndex
CREATE INDEX "Unit_bedrooms_idx" ON "Unit"("bedrooms");

-- CreateIndex
CREATE INDEX "Unit_rentCastId_idx" ON "Unit"("rentCastId");

-- CreateIndex
CREATE INDEX "Unit_rentMin_rentMax_idx" ON "Unit"("rentMin", "rentMax");

-- CreateIndex
CREATE INDEX "Unit_isAvailable_bedrooms_rentMin_idx" ON "Unit"("isAvailable", "bedrooms", "rentMin");

-- CreateIndex
CREATE INDEX "Unit_isAvailable_rentMin_rentMax_idx" ON "Unit"("isAvailable", "rentMin", "rentMax");

-- CreateIndex
CREATE INDEX "ClientSavedBuilding_clientId_idx" ON "ClientSavedBuilding"("clientId");

-- CreateIndex
CREATE INDEX "ClientSavedBuilding_buildingId_idx" ON "ClientSavedBuilding"("buildingId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientSavedBuilding_clientId_buildingId_key" ON "ClientSavedBuilding"("clientId", "buildingId");

-- CreateIndex
CREATE INDEX "ClientSavedListing_clientId_idx" ON "ClientSavedListing"("clientId");

-- CreateIndex
CREATE INDEX "ClientSavedListing_unitId_idx" ON "ClientSavedListing"("unitId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientSavedListing_clientId_unitId_key" ON "ClientSavedListing"("clientId", "unitId");

-- CreateIndex
CREATE UNIQUE INDEX "LocatorProfile_userId_key" ON "LocatorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LocatorProfile_stripeCustomerId_key" ON "LocatorProfile"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "LocatorProfile_stripeSubscriptionId_key" ON "LocatorProfile"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "LocatorProfile_stripeCustomerId_idx" ON "LocatorProfile"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "LocatorProfile_subscriptionStatus_idx" ON "LocatorProfile"("subscriptionStatus");

-- CreateIndex
CREATE INDEX "LocatorClient_locatorId_idx" ON "LocatorClient"("locatorId");

-- CreateIndex
CREATE INDEX "LocatorClient_status_idx" ON "LocatorClient"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ClientShareReport_shareId_key" ON "ClientShareReport"("shareId");

-- CreateIndex
CREATE INDEX "ClientShareReport_shareId_idx" ON "ClientShareReport"("shareId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientShareReport_clientId_shareId_key" ON "ClientShareReport"("clientId", "shareId");

-- CreateIndex
CREATE INDEX "CreditLedger_locatorId_idx" ON "CreditLedger"("locatorId");

-- CreateIndex
CREATE INDEX "CreditLedger_createdAt_idx" ON "CreditLedger"("createdAt");

-- CreateIndex
CREATE INDEX "ProSavedSearch_locatorId_idx" ON "ProSavedSearch"("locatorId");

-- CreateIndex
CREATE INDEX "ProComparison_locatorId_idx" ON "ProComparison"("locatorId");

-- CreateIndex
CREATE UNIQUE INDEX "ProReport_shareToken_key" ON "ProReport"("shareToken");

-- CreateIndex
CREATE INDEX "ProReport_locatorId_idx" ON "ProReport"("locatorId");

-- CreateIndex
CREATE INDEX "ProReport_clientId_idx" ON "ProReport"("clientId");

-- CreateIndex
CREATE INDEX "ProReport_shareToken_idx" ON "ProReport"("shareToken");

-- AddForeignKey
ALTER TABLE "MagicLink" ADD CONSTRAINT "MagicLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "QuizSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SentimentQuote" ADD CONSTRAINT "SentimentQuote_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizSession" ADD CONSTRAINT "QuizSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizResult" ADD CONSTRAINT "QuizResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "QuizSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizResult" ADD CONSTRAINT "QuizResult_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LifestyleVenue" ADD CONSTRAINT "LifestyleVenue_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApartmentListing" ADD CONSTRAINT "ApartmentListing_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Building" ADD CONSTRAINT "Building_managementId_fkey" FOREIGN KEY ("managementId") REFERENCES "ManagementCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Building" ADD CONSTRAINT "Building_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Special" ADD CONSTRAINT "Special_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Special" ADD CONSTRAINT "Special_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientSavedBuilding" ADD CONSTRAINT "ClientSavedBuilding_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "LocatorClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientSavedBuilding" ADD CONSTRAINT "ClientSavedBuilding_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientSavedListing" ADD CONSTRAINT "ClientSavedListing_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "LocatorClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientSavedListing" ADD CONSTRAINT "ClientSavedListing_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocatorProfile" ADD CONSTRAINT "LocatorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocatorClient" ADD CONSTRAINT "LocatorClient_locatorId_fkey" FOREIGN KEY ("locatorId") REFERENCES "LocatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientShareReport" ADD CONSTRAINT "ClientShareReport_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "LocatorClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditLedger" ADD CONSTRAINT "CreditLedger_locatorId_fkey" FOREIGN KEY ("locatorId") REFERENCES "LocatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProSavedSearch" ADD CONSTRAINT "ProSavedSearch_locatorId_fkey" FOREIGN KEY ("locatorId") REFERENCES "LocatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProComparison" ADD CONSTRAINT "ProComparison_locatorId_fkey" FOREIGN KEY ("locatorId") REFERENCES "LocatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProReport" ADD CONSTRAINT "ProReport_locatorId_fkey" FOREIGN KEY ("locatorId") REFERENCES "LocatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProReport" ADD CONSTRAINT "ProReport_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "LocatorClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
