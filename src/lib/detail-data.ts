/**
 * Server-side data fetchers for detail pages.
 * Used by Server Components to fetch listing/building + clients in one pass.
 */

import { unstable_cache } from 'next/cache'
import prisma from './db'
import { getSessionUserCached, getLocatorProfileCached } from './pro-auth'
import { getEntityFieldEdits } from './field-edits'

/** Client shape for save dropdowns (listing + property detail) */
export interface DetailClient {
  id: string
  name: string
  status: string
  savedListings?: { listingId: string }[]
  savedBuildings?: { buildingId: string }[]
}

/**
 * Fetch active clients with savedListings and savedBuildings for detail page dropdowns.
 * Uses cached locator + unstable_cache for clients (30s revalidation).
 */
export async function getActiveClientsForDetail(): Promise<DetailClient[]> {
  const user = await getSessionUserCached()
  if (!user) return []

  const locator = await getLocatorProfileCached(user.id)
  if (!locator) return []

  const getCachedClients = unstable_cache(
    async (locatorId: string) => {
      const clients = await prisma.locatorClient.findMany({
        where: { locatorId, status: 'active' },
        orderBy: { updatedAt: 'desc' },
        include: {
          savedListings: { select: { unitId: true } },
          savedBuildings: { select: { buildingId: true } },
        },
      })
      return clients.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        savedListings: c.savedListings.map((sl) => ({ listingId: sl.unitId })),
        savedBuildings: c.savedBuildings.map((sb) => ({ buildingId: sb.buildingId })),
      }))
    },
    [`detail-clients-${locator.id}`],
    { revalidate: 30, tags: [`clients-${user.id}`] }
  )

  return getCachedClients(locator.id)
}

/** Listing detail shape (matches API response) */
export interface ListingDetailData {
  id: string
  unitNumber: string | null
  name: string | null
  bedrooms: number
  bathrooms: number
  sqftMin: number | null
  sqftMax: number | null
  rentMin: number
  rentMax: number
  availableCount: number
  availableDate: string | null
  photoUrl: string | null
  building: {
    id: string
    name: string
    address: string
    city: string
    state: string
    zipCode: string | null
    lat: number
    lng: number
    primaryPhotoUrl: string | null
    photos: string[]
    amenities: string[]
    rating: number | null
    reviewCount: number | null
    listingUrl: string | null
    floorplansUrl: string | null
    petPolicy: string | null
    parkingType: string | null
    neighborhood: {
      id: string
      name: string
      slug: string
      grade: string
      walkScore: number | null
      transitScore: number | null
    }
    management: {
      id: string
      name: string
      slug: string
      logoUrl: string | null
    } | null
  }
}

/**
 * Fetch listing detail + field edits for Server Component.
 * Uses unstable_cache (30s revalidation). Listing and field edits fetched in parallel.
 */
export async function getListingDetailData(
  id: string
): Promise<{ listing: ListingDetailData; fieldEdits: Record<string, unknown> } | null> {
  const user = await getSessionUserCached()
  if (!user) return null

  const locator = await getLocatorProfileCached(user.id)
  if (!locator) return null

  const getCachedListing = unstable_cache(
    async (unitId: string) => {
      const [listing, editsMap] = await Promise.all([
        prisma.unit.findUnique({
          where: { id: unitId },
          include: {
            building: {
              include: {
                neighborhood: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    grade: true,
                    walkScore: true,
                    transitScore: true,
                    bikeScore: true,
                  },
                },
                management: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    logoUrl: true,
                    website: true,
                  },
                },
              },
            },
          },
        }),
        getEntityFieldEdits('unit', unitId),
      ])

      if (!listing) return null

      const fieldEdits: Record<string, unknown> = {}
      editsMap.forEach((value, key) => {
        fieldEdits[key] = value
      })

      return {
        listing: {
          id: listing.id,
          unitNumber: listing.unitNumber,
          name: listing.name,
          bedrooms: listing.bedrooms,
          bathrooms: listing.bathrooms,
          sqftMin: listing.sqftMin,
          sqftMax: listing.sqftMax,
          rentMin: listing.rentMin,
          rentMax: listing.rentMax,
          availableCount: listing.availableCount,
          availableDate: listing.availableDate?.toISOString() ?? null,
          photoUrl: listing.photoUrl,
          building: {
            id: listing.building.id,
            name: listing.building.name,
            address: listing.building.address,
            city: listing.building.city,
            state: listing.building.state,
            zipCode: listing.building.zipCode,
            lat: listing.building.lat,
            lng: listing.building.lng,
            primaryPhotoUrl: listing.building.primaryPhotoUrl,
            photos: listing.building.photos,
            amenities: listing.building.amenities,
            rating: listing.building.rating,
            reviewCount: listing.building.reviewCount,
            listingUrl: listing.building.listingUrl,
            floorplansUrl: listing.building.floorplansUrl,
            petPolicy: listing.building.petPolicy,
            parkingType: listing.building.parkingType,
            neighborhood: listing.building.neighborhood,
            management: listing.building.management,
          },
        },
        fieldEdits,
      }
    },
    [`listing-detail-${id}`],
    { revalidate: 30, tags: [`listing-${id}`, `unit-${id}`] }
  )

  return getCachedListing(id)
}

/** Unit shape for building detail */
export interface BuildingUnit {
  id: string
  name: string | null
  bedrooms: number
  bathrooms: number
  sqftMin: number | null
  sqftMax: number | null
  rentMin: number
  rentMax: number
  availableCount: number
  availableDate: string | null
  photoUrl: string | null
}

/** Building detail shape (matches API response) */
export interface BuildingDetailData {
  id: string
  name: string
  address: string
  city: string
  state: string
  zipCode: string | null
  lat: number
  lng: number
  neighborhood: {
    id: string
    name: string
    slug: string
    grade: string
    compositeScore: number
    walkScore: number | null
    transitScore: number | null
    bikeScore: number | null
    description: string | null
    highlights: string[]
    sentimentSummary: string | null
  }
  management: {
    id: string
    name: string
    slug: string
    logoUrl: string | null
    website: string | null
  } | null
  rating: number | null
  reviewCount: number | null
  website: string | null
  phone: string | null
  primaryPhotoUrl: string | null
  photos: string[]
  amenities: string[]
  petPolicy: string | null
  parkingType: string | null
  listingUrl: string | null
  floorplansUrl: string | null
  yearBuilt: number | null
  rentMin: number | null
  rentMax: number | null
  bedrooms: string[]
  units: BuildingUnit[]
  lastSyncedAt: string | null
  adminFee: number | null
  applicationFee: number | null
  petDeposit: string | null
  petRent: string | null
  petFeeNonrefundable: string | null
  petWeightLimit: string | null
  petBreedRestrictions: string | null
  maxPets: number | null
  currentSpecials: string | null
  specialsUpdatedAt: string | null
  rentRangeStudio: string | null
  rentRange1br: string | null
  rentRange2br: string | null
  rentRange3br: string | null
  parkingFee: string | null
  trashValetFee: string | null
  utilitiesIncluded: string | null
  shortTermPremium: string | null
  earlyTerminationFee: string | null
  guarantorPolicy: string | null
  incomeRequirement: string | null
  additionalProvisions: string | null
  sadDataUpdatedAt: string | null
}

/**
 * Fetch building detail + field edits for Server Component.
 * Uses unstable_cache (30s revalidation). Building and field edits fetched in parallel.
 */
export async function getBuildingDetailData(
  id: string
): Promise<{ building: BuildingDetailData; fieldEdits: Record<string, unknown> } | null> {
  const user = await getSessionUserCached()
  if (!user) return null

  const locator = await getLocatorProfileCached(user.id)
  if (!locator) return null

  const getCachedBuilding = unstable_cache(
    async (buildingId: string) => {
      const [building, editsMap] = await Promise.all([
        prisma.building.findUnique({
          where: { id: buildingId },
          include: {
            neighborhood: {
              select: {
                id: true,
                name: true,
                slug: true,
                grade: true,
                compositeScore: true,
                walkScore: true,
                transitScore: true,
                bikeScore: true,
                description: true,
                highlights: true,
                sentimentSummary: true,
              },
            },
            management: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
                website: true,
              },
            },
            units: {
              where: { isAvailable: true },
              orderBy: [{ bedrooms: 'asc' }, { rentMin: 'asc' }],
            },
          },
        }),
        getEntityFieldEdits('building', buildingId),
      ])

      if (!building) return null

      const fieldEdits: Record<string, unknown> = {}
      editsMap.forEach((value, key) => {
        fieldEdits[key] = value
      })

      const rents = building.units.flatMap((u) => [u.rentMin, u.rentMax])
      const rentMin = rents.length > 0 ? Math.min(...rents) : null
      const rentMax = rents.length > 0 ? Math.max(...rents) : null

      const bedroomCounts = [...new Set(building.units.map((u) => u.bedrooms))].sort()
      const bedroomLabels = bedroomCounts.map((c) => {
        if (c === 0) return 'Studio'
        if (c === 1) return '1 BR'
        if (c === 2) return '2 BR'
        return `${c}+ BR`
      })

      return {
        building: {
          id: building.id,
          name: building.name,
          address: building.address,
          city: building.city,
          state: building.state,
          zipCode: building.zipCode,
          lat: building.lat,
          lng: building.lng,
          neighborhood: building.neighborhood,
          management: building.management,
          rating: building.rating,
          reviewCount: building.reviewCount,
          website: building.website,
          phone: building.phone,
          primaryPhotoUrl: building.primaryPhotoUrl,
          photos: building.photos,
          amenities: building.amenities,
          petPolicy: building.petPolicy,
          parkingType: building.parkingType,
          listingUrl: building.listingUrl,
          floorplansUrl: building.floorplansUrl,
          yearBuilt: building.yearBuilt,
          rentMin,
          rentMax,
          bedrooms: bedroomLabels,
          units: building.units.map((u) => ({
            id: u.id,
            name: u.name,
            bedrooms: u.bedrooms,
            bathrooms: u.bathrooms,
            sqftMin: u.sqftMin,
            sqftMax: u.sqftMax,
            rentMin: u.rentMin,
            rentMax: u.rentMax,
            availableCount: u.availableCount,
            availableDate: u.availableDate?.toISOString() ?? null,
            photoUrl: u.photoUrl,
          })),
          lastSyncedAt: building.lastSyncedAt?.toISOString() ?? null,
          adminFee: building.adminFee,
          applicationFee: building.applicationFee,
          petDeposit: building.petDeposit,
          petRent: building.petRent,
          petFeeNonrefundable: building.petFeeNonrefundable,
          petWeightLimit: building.petWeightLimit,
          petBreedRestrictions: building.petBreedRestrictions,
          maxPets: building.maxPets,
          currentSpecials: building.currentSpecials,
          specialsUpdatedAt: building.specialsUpdatedAt?.toISOString() ?? null,
          rentRangeStudio: building.rentRangeStudio,
          rentRange1br: building.rentRange1br,
          rentRange2br: building.rentRange2br,
          rentRange3br: building.rentRange3br,
          parkingFee: building.parkingFee,
          trashValetFee: building.trashValetFee,
          utilitiesIncluded: building.utilitiesIncluded,
          shortTermPremium: building.shortTermPremium,
          earlyTerminationFee: building.earlyTerminationFee,
          guarantorPolicy: building.guarantorPolicy,
          incomeRequirement: building.incomeRequirement,
          additionalProvisions: building.additionalProvisions,
          sadDataUpdatedAt: building.sadDataUpdatedAt?.toISOString() ?? null,
        },
        fieldEdits,
      }
    },
    [`building-detail-${id}`],
    { revalidate: 30, tags: [`building-${id}`] }
  )

  return getCachedBuilding(id)
}
