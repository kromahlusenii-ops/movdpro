/**
 * Seed Script — Charlotte neighborhoods + management companies
 *
 * Enriched with walkability, nightlife, safety, price scores,
 * archetypes, vibes, and transit data from charlotte_neighborhoods_data.csv.
 *
 * Run: npx tsx prisma/seed.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface NeighborhoodSeed {
  name: string
  slug: string
  tier: number
  grade: string
  centerLat: number
  centerLng: number
  walkScore: number
  transitScore: number
  bikeScore: number
  // CSV-enriched fields (1-5 scale → stored as 0-100)
  safetyScore?: number
  livabilityScore?: number
  nightlifeScore?: number
  priceScore?: number
  compositeScore?: number
  // Demographics & transit
  ageDemoLow?: number
  ageDemoHigh?: number
  transitAccess?: string
  commuteUptownMin?: number
  // Archetypes
  bestArchetypes?: string[]
  avoidArchetypes?: string[]
  // Vibes & warnings
  highlights?: string[]
  warnings?: string[]
  characterTags?: string[]
}

const NEIGHBORHOODS: NeighborhoodSeed[] = [
  // ── Core Charlotte (Tier 1) ──
  {
    name: 'South End', slug: 'south-end', tier: 1, grade: 'A',
    centerLat: 35.2101, centerLng: -80.8573,
    walkScore: 82, transitScore: 55, bikeScore: 72,
    safetyScore: 60, livabilityScore: 100, nightlifeScore: 100, priceScore: 60, compositeScore: 80,
    ageDemoLow: 22, ageDemoHigh: 32, transitAccess: 'Light Rail', commuteUptownMin: 10,
    bestArchetypes: ['Young Professional', 'Social Butterfly', 'Urban Seeker'],
    avoidArchetypes: ['Family with Kids', 'Retiree', 'Quiet Seeker'],
    highlights: ['trendy', 'breweries', 'walkable', 'young', 'rail trail'],
    warnings: ['expensive', 'noise', 'transient', 'construction'],
    characterTags: ['TRENDY', 'WALKABLE', 'NIGHTLIFE', 'YOUNG'],
  },
  {
    name: 'NoDa', slug: 'noda', tier: 1, grade: 'A-',
    centerLat: 35.2485, centerLng: -80.8184,
    walkScore: 65, transitScore: 35, bikeScore: 60,
    safetyScore: 40, livabilityScore: 80, nightlifeScore: 80, priceScore: 40, compositeScore: 60,
    ageDemoLow: 25, ageDemoHigh: 35, transitAccess: 'Light Rail', commuteUptownMin: 18,
    bestArchetypes: ['Creative', 'Artist', 'Hipster', 'Craft Beer Lover'],
    avoidArchetypes: ['Family with Kids', 'Safety-First', 'Corporate'],
    highlights: ['artsy', 'murals', 'live music', 'authentic', 'funky'],
    warnings: ['crime nearby', 'parking', 'gentrifying'],
    characterTags: ['ARTSY', 'LIVE MUSIC', 'ECLECTIC', 'HIPSTER'],
  },
  {
    name: 'Plaza Midwood', slug: 'plaza-midwood', tier: 1, grade: 'A-',
    centerLat: 35.2267, centerLng: -80.8071,
    walkScore: 72, transitScore: 38, bikeScore: 65,
    safetyScore: 60, livabilityScore: 80, nightlifeScore: 80, priceScore: 40, compositeScore: 65,
    ageDemoLow: 25, ageDemoHigh: 40, transitAccess: 'Bus', commuteUptownMin: 15,
    bestArchetypes: ['Foodie', 'Community Seeker', 'Dog Owner', 'Young Family'],
    avoidArchetypes: ['Corporate', 'Suburban Seeker'],
    highlights: ['eclectic', 'diverse', 'community', 'historic', 'food scene'],
    warnings: ['traffic', 'parking', 'rising prices'],
    characterTags: ['ECLECTIC', 'FOODIE', 'COMMUNITY', 'HISTORIC'],
  },
  {
    name: 'Dilworth', slug: 'dilworth', tier: 1, grade: 'A',
    centerLat: 35.2098, centerLng: -80.8545,
    walkScore: 76, transitScore: 42, bikeScore: 70,
    safetyScore: 80, livabilityScore: 100, nightlifeScore: 60, priceScore: 60, compositeScore: 75,
    ageDemoLow: 30, ageDemoHigh: 45, transitAccess: 'Near Light Rail', commuteUptownMin: 12,
    bestArchetypes: ['Established Professional', 'Young Family', 'Dog Owner'],
    avoidArchetypes: ['Budget Starter', 'Nightlife Seeker'],
    highlights: ['historic', 'tree-lined', 'bungalows', 'safe', 'walkable'],
    warnings: ['expensive', 'quieter nightlife'],
    characterTags: ['HISTORIC', 'WALKABLE', 'SAFE', 'TREE-LINED'],
  },
  {
    name: 'Uptown Charlotte', slug: 'uptown-charlotte', tier: 1, grade: 'A',
    centerLat: 35.2271, centerLng: -80.8431,
    walkScore: 92, transitScore: 65, bikeScore: 75,
    safetyScore: 40, livabilityScore: 100, nightlifeScore: 80, priceScore: 60, compositeScore: 70,
    ageDemoLow: 25, ageDemoHigh: 35, transitAccess: 'Excellent', commuteUptownMin: 0,
    bestArchetypes: ['Finance Pro', 'Urban Maximalist', 'Walk-to-Work'],
    avoidArchetypes: ['Family with Kids', 'Quiet Seeker', 'Budget Starter'],
    highlights: ['urban core', 'high-rise', 'corporate', 'central'],
    warnings: ['traffic', 'noise', 'safety varies'],
    characterTags: ['URBAN', 'HIGH-RISE', 'CORPORATE', 'CENTRAL'],
  },
  {
    name: 'Elizabeth', slug: 'elizabeth', tier: 1, grade: 'A-',
    centerLat: 35.2159, centerLng: -80.8261,
    walkScore: 74, transitScore: 40, bikeScore: 68,
    safetyScore: 100, livabilityScore: 100, nightlifeScore: 60, priceScore: 50, compositeScore: 78,
    ageDemoLow: 28, ageDemoHigh: 40, transitAccess: 'Streetcar', commuteUptownMin: 8,
    bestArchetypes: ['Safety-First', 'Historic Charm Lover', 'Young Professional'],
    avoidArchetypes: ['Nightlife Seeker', 'Budget Starter'],
    highlights: ['historic', 'victorian', 'safe', 'walkable', 'charming'],
    warnings: ['less transit', 'expensive homes'],
    characterTags: ['HISTORIC', 'SAFE', 'CHARMING', 'VICTORIAN'],
  },
  {
    name: 'Myers Park', slug: 'myers-park', tier: 1, grade: 'A+',
    centerLat: 35.1891, centerLng: -80.8315,
    walkScore: 45, transitScore: 22, bikeScore: 40,
    safetyScore: 100, livabilityScore: 60, nightlifeScore: 40, priceScore: 80, compositeScore: 70,
    ageDemoLow: 35, ageDemoHigh: 55, transitAccess: 'Car + Greenway', commuteUptownMin: 15,
    bestArchetypes: ['Affluent Family', 'Executive', 'School-Focused'],
    avoidArchetypes: ['Budget Starter', 'Nightlife Seeker', 'Young Single'],
    highlights: ['prestigious', 'elegant', 'top schools', 'safe', 'old money'],
    warnings: ['very expensive', 'exclusive'],
    characterTags: ['PRESTIGIOUS', 'SAFE', 'SCHOOLS', 'ELEGANT'],
  },
  // Midtown + Lower South End (no CSV data — keep existing scores)
  {
    name: 'Midtown', slug: 'midtown', tier: 1, grade: 'B+',
    centerLat: 35.2019, centerLng: -80.8340,
    walkScore: 68, transitScore: 38, bikeScore: 55,
  },
  {
    name: 'Lower South End', slug: 'lower-south-end', tier: 1, grade: 'B+',
    centerLat: 35.2050, centerLng: -80.8615,
    walkScore: 70, transitScore: 45, bikeScore: 60,
  },

  // ── Inner Charlotte (Tier 2) ──
  {
    name: 'Optimist Park', slug: 'optimist-park', tier: 2, grade: 'B',
    centerLat: 35.2380, centerLng: -80.8260,
    walkScore: 58, transitScore: 30, bikeScore: 50,
  },
  {
    name: 'Wesley Heights', slug: 'wesley-heights', tier: 2, grade: 'B',
    centerLat: 35.2320, centerLng: -80.8630,
    walkScore: 55, transitScore: 28, bikeScore: 48,
    safetyScore: 40, livabilityScore: 60, nightlifeScore: 40, priceScore: 50, compositeScore: 48,
    ageDemoLow: 28, ageDemoHigh: 40, transitAccess: 'Near Uptown', commuteUptownMin: 8,
    bestArchetypes: ['Urban Pioneer', 'History Buff', 'Young Professional'],
    avoidArchetypes: ['Safety-First', 'Suburban Seeker'],
    highlights: ['historic', 'gentrifying', 'urban', 'skyline views'],
    warnings: ['gentrification', 'rising prices', 'transitional'],
    characterTags: ['GENTRIFYING', 'URBAN', 'HISTORIC', 'SKYLINE'],
  },
  {
    name: 'Cherry', slug: 'cherry', tier: 2, grade: 'B+',
    centerLat: 35.2035, centerLng: -80.8455,
    walkScore: 60, transitScore: 32, bikeScore: 52,
  },
  {
    name: 'Sedgefield', slug: 'sedgefield', tier: 2, grade: 'B+',
    centerLat: 35.1935, centerLng: -80.8590,
    walkScore: 52, transitScore: 25, bikeScore: 45,
    safetyScore: 60, livabilityScore: 100, nightlifeScore: 60, priceScore: 40, compositeScore: 65,
    ageDemoLow: 28, ageDemoHigh: 40, transitAccess: 'Light Rail', commuteUptownMin: 12,
    bestArchetypes: ['Transit Commuter', 'Walkability Seeker', 'South End Adjacent'],
    avoidArchetypes: ['Car-Dependent', 'Suburban Seeker'],
    highlights: ['charming', 'bungalows', 'rail trail', 'transit'],
    warnings: ['mostly rentals', 'rising prices'],
    characterTags: ['CHARMING', 'TRANSIT', 'BUNGALOWS', 'RAIL TRAIL'],
  },
  {
    name: 'Montford', slug: 'montford', tier: 2, grade: 'B',
    centerLat: 35.1990, centerLng: -80.8680,
    walkScore: 48, transitScore: 20, bikeScore: 40,
    safetyScore: 60, livabilityScore: 80, nightlifeScore: 100, priceScore: 40, compositeScore: 70,
    ageDemoLow: 25, ageDemoHigh: 40, transitAccess: 'Car', commuteUptownMin: 15,
    bestArchetypes: ['Nightlife Seeker', 'Foodie', 'Bar Hopper'],
    avoidArchetypes: ['Family with Kids', 'Quiet Seeker'],
    highlights: ['bar strip', 'restaurants', 'laid-back', 'foodie'],
    warnings: ['small community', 'car needed'],
    characterTags: ['NIGHTLIFE', 'FOODIE', 'BAR STRIP', 'LAID-BACK'],
  },
  {
    name: 'FreeMoreWest', slug: 'freemorewest', tier: 2, grade: 'B-',
    centerLat: 35.2250, centerLng: -80.8700,
    walkScore: 50, transitScore: 25, bikeScore: 42,
    safetyScore: 40, livabilityScore: 40, nightlifeScore: 40, priceScore: 30, compositeScore: 38,
    ageDemoLow: 25, ageDemoHigh: 35, transitAccess: 'Near Uptown', commuteUptownMin: 10,
    bestArchetypes: ['Early Adopter', 'Creative', 'Budget Urban'],
    avoidArchetypes: ['Safety-First', 'Established Family'],
    highlights: ['emerging', 'authentic', 'community', 'opportunity zone'],
    warnings: ['still developing', 'some rough areas'],
    characterTags: ['EMERGING', 'AUTHENTIC', 'COMMUNITY', 'URBAN'],
  },

  // ── Outer Charlotte ──
  {
    name: 'University City', slug: 'university-city', tier: 2, grade: 'B',
    centerLat: 35.3077, centerLng: -80.7331,
    walkScore: 35, transitScore: 28, bikeScore: 30,
    safetyScore: 40, livabilityScore: 40, nightlifeScore: 40, priceScore: 20, compositeScore: 35,
    ageDemoLow: 18, ageDemoHigh: 28, transitAccess: 'Light Rail', commuteUptownMin: 30,
    bestArchetypes: ['Student', 'Budget Starter', 'Research Park Worker'],
    avoidArchetypes: ['Affluent Family', 'Safety-First'],
    highlights: ['college town', 'diverse', 'affordable', 'energetic'],
    warnings: ['safety varies', 'lacks community'],
    characterTags: ['COLLEGE', 'AFFORDABLE', 'DIVERSE', 'ENERGETIC'],
  },
  {
    name: 'Ballantyne', slug: 'ballantyne', tier: 2, grade: 'A-',
    centerLat: 35.0530, centerLng: -80.8474,
    walkScore: 25, transitScore: 10, bikeScore: 22,
    safetyScore: 100, livabilityScore: 20, nightlifeScore: 20, priceScore: 60, compositeScore: 50,
    ageDemoLow: 35, ageDemoHigh: 50, transitAccess: 'Car Only', commuteUptownMin: 40,
    bestArchetypes: ['Suburban Family', 'School-Focused', 'Safety-First'],
    avoidArchetypes: ['Nightlife Seeker', 'Urban Seeker', 'Young Single'],
    highlights: ['suburban', 'safe', 'schools', 'golf', 'bubble'],
    warnings: ['traffic', 'isolated', 'limited culture'],
    characterTags: ['SUBURBAN', 'SAFE', 'SCHOOLS', 'FAMILY'],
  },
  {
    name: 'SouthPark', slug: 'southpark', tier: 2, grade: 'A',
    centerLat: 35.1470, centerLng: -80.8275,
    walkScore: 42, transitScore: 18, bikeScore: 32,
    safetyScore: 100, livabilityScore: 60, nightlifeScore: 60, priceScore: 60, compositeScore: 70,
    ageDemoLow: 30, ageDemoHigh: 50, transitAccess: 'Light Rail', commuteUptownMin: 20,
    bestArchetypes: ['Affluent Professional', 'Shopper', 'Family'],
    avoidArchetypes: ['Budget Starter', 'Nightlife Seeker'],
    highlights: ['upscale', 'mall', 'safe', 'polished', 'dining'],
    warnings: ['traffic', 'expensive', 'competitive'],
    characterTags: ['UPSCALE', 'SHOPPING', 'SAFE', 'POLISHED'],
  },
  {
    name: 'Steele Creek', slug: 'steele-creek', tier: 3, grade: 'B-',
    centerLat: 35.1080, centerLng: -80.9550,
    walkScore: 18, transitScore: 8, bikeScore: 15,
  },
  {
    name: 'North Charlotte', slug: 'north-charlotte', tier: 3, grade: 'B-',
    centerLat: 35.2700, centerLng: -80.8400,
    walkScore: 30, transitScore: 15, bikeScore: 25,
  },
  {
    name: 'East Charlotte', slug: 'east-charlotte', tier: 3, grade: 'C+',
    centerLat: 35.2150, centerLng: -80.7500,
    walkScore: 28, transitScore: 12, bikeScore: 20,
  },
  {
    name: 'West Charlotte', slug: 'west-charlotte', tier: 3, grade: 'C+',
    centerLat: 35.2300, centerLng: -80.9100,
    walkScore: 22, transitScore: 10, bikeScore: 18,
  },

  // ── Surrounding towns / metro (Tier 3) ──
  {
    name: 'Huntersville', slug: 'huntersville', tier: 3, grade: 'B+',
    centerLat: 35.4107, centerLng: -80.8428,
    walkScore: 20, transitScore: 5, bikeScore: 18,
    safetyScore: 80, livabilityScore: 20, nightlifeScore: 40, priceScore: 50, compositeScore: 48,
    ageDemoLow: 35, ageDemoHigh: 50, transitAccess: 'Car Only', commuteUptownMin: 45,
    bestArchetypes: ['Lake Lover', 'Outdoor Family', 'Remote Worker'],
    avoidArchetypes: ['Daily Commuter', 'Urban Seeker'],
    highlights: ['lake norman', 'outdoor', 'birkdale', 'family'],
    warnings: ['I-77 traffic brutal', 'crowding'],
    characterTags: ['LAKE', 'OUTDOOR', 'FAMILY', 'SUBURBAN'],
  },
  {
    name: 'Cornelius', slug: 'cornelius', tier: 3, grade: 'B+',
    centerLat: 35.4868, centerLng: -80.8601,
    walkScore: 18, transitScore: 4, bikeScore: 15,
    safetyScore: 100, livabilityScore: 20, nightlifeScore: 20, priceScore: 60, compositeScore: 50,
    ageDemoLow: 40, ageDemoHigh: 60, transitAccess: 'Car Only', commuteUptownMin: 60,
    bestArchetypes: ['Affluent Lake Seeker', 'Retiree', 'Boater'],
    avoidArchetypes: ['Budget Starter', 'Daily Commuter', 'Young Single'],
    highlights: ['lakefront', 'upscale', 'quiet', 'waterfront'],
    warnings: ['I-77 nightmare', 'expensive', 'isolated'],
    characterTags: ['LAKEFRONT', 'UPSCALE', 'QUIET', 'WATERFRONT'],
  },
  {
    name: 'Davidson', slug: 'davidson', tier: 3, grade: 'A-',
    centerLat: 35.4993, centerLng: -80.8487,
    walkScore: 35, transitScore: 5, bikeScore: 30,
    safetyScore: 100, livabilityScore: 100, nightlifeScore: 40, priceScore: 80, compositeScore: 80,
    ageDemoLow: 35, ageDemoHigh: 55, transitAccess: 'Car', commuteUptownMin: 55,
    bestArchetypes: ['Culture Seeker', 'Academic', 'Walkability Priority'],
    avoidArchetypes: ['Budget Starter', 'Nightlife Seeker'],
    highlights: ['college town', 'walkable', 'safest', 'charming', 'cultural'],
    warnings: ['very expensive', 'I-77 commute'],
    characterTags: ['COLLEGE TOWN', 'WALKABLE', 'SAFE', 'CHARMING'],
  },
  {
    name: 'Matthews', slug: 'matthews', tier: 3, grade: 'B',
    centerLat: 35.1168, centerLng: -80.7237,
    walkScore: 30, transitScore: 8, bikeScore: 22,
    safetyScore: 100, livabilityScore: 60, nightlifeScore: 20, priceScore: 40, compositeScore: 55,
    ageDemoLow: 35, ageDemoHigh: 50, transitAccess: 'Car Only', commuteUptownMin: 30,
    bestArchetypes: ['Family', 'Small-Town Seeker', 'Community Lover'],
    avoidArchetypes: ['Nightlife Seeker', 'Urban Seeker'],
    highlights: ['small-town', 'community', 'festivals', 'safe', 'schools'],
    warnings: ['traffic', 'no transit', 'limited nightlife'],
    characterTags: ['SMALL-TOWN', 'COMMUNITY', 'FAMILY', 'SAFE'],
  },
  {
    name: 'Pineville', slug: 'pineville', tier: 3, grade: 'B-',
    centerLat: 35.0832, centerLng: -80.8925,
    walkScore: 22, transitScore: 6, bikeScore: 18,
    safetyScore: 60, livabilityScore: 40, nightlifeScore: 40, priceScore: 20, compositeScore: 40,
    ageDemoLow: 25, ageDemoHigh: 35, transitAccess: 'Car', commuteUptownMin: 20,
    bestArchetypes: ['Budget Starter', 'Young Diverse', 'First-Time Buyer'],
    avoidArchetypes: ['School-Focused', 'Prestigious Seeker'],
    highlights: ['affordable', 'diverse', 'young', 'accessible'],
    warnings: ['roads', 'schools average', 'less prestige'],
    characterTags: ['AFFORDABLE', 'DIVERSE', 'YOUNG', 'ACCESSIBLE'],
  },
  {
    name: 'Mint Hill', slug: 'mint-hill', tier: 3, grade: 'B',
    centerLat: 35.1796, centerLng: -80.6473,
    walkScore: 12, transitScore: 3, bikeScore: 10,
    safetyScore: 100, livabilityScore: 20, nightlifeScore: 20, priceScore: 40, compositeScore: 45,
    ageDemoLow: 35, ageDemoHigh: 50, transitAccess: 'Car Only', commuteUptownMin: 25,
    bestArchetypes: ['Quiet Family', 'Privacy Seeker', 'Elementary School Focus'],
    avoidArchetypes: ['Nightlife Seeker', 'Urban Seeker', 'Young Single'],
    highlights: ['quiet', 'wooded', 'private', 'safe', 'rural-suburban'],
    warnings: ['limited entertainment', 'average middle/high schools'],
    characterTags: ['QUIET', 'WOODED', 'PRIVATE', 'RURAL-SUBURBAN'],
  },
  // Remaining metro towns (no CSV data)
  {
    name: 'Indian Trail', slug: 'indian-trail', tier: 3, grade: 'B-',
    centerLat: 35.0760, centerLng: -80.6693,
    walkScore: 10, transitScore: 2, bikeScore: 8,
  },
  {
    name: 'Concord', slug: 'concord', tier: 3, grade: 'B',
    centerLat: 35.4088, centerLng: -80.5795,
    walkScore: 22, transitScore: 5, bikeScore: 18,
  },
  {
    name: 'Harrisburg', slug: 'harrisburg', tier: 3, grade: 'B',
    centerLat: 35.3235, centerLng: -80.6537,
    walkScore: 10, transitScore: 2, bikeScore: 8,
  },
  {
    name: 'Fort Mill', slug: 'fort-mill', tier: 3, grade: 'B+',
    centerLat: 35.0074, centerLng: -80.9451,
    walkScore: 18, transitScore: 3, bikeScore: 15,
  },
  {
    name: 'Rock Hill', slug: 'rock-hill', tier: 3, grade: 'B-',
    centerLat: 34.9249, centerLng: -81.0251,
    walkScore: 25, transitScore: 5, bikeScore: 20,
  },
  {
    name: 'Mooresville', slug: 'mooresville', tier: 3, grade: 'B',
    centerLat: 35.5849, centerLng: -80.8101,
    walkScore: 15, transitScore: 3, bikeScore: 12,
  },
  {
    name: 'Gastonia', slug: 'gastonia', tier: 3, grade: 'C+',
    centerLat: 35.2621, centerLng: -81.1873,
    walkScore: 28, transitScore: 5, bikeScore: 20,
  },
]

const MANAGEMENT_COMPANIES = [
  { name: 'Greystar', slug: 'greystar', logoUrl: null },
  { name: 'MAA', slug: 'maa', logoUrl: null },
  { name: 'Cortland', slug: 'cortland', logoUrl: null },
]

async function main() {
  console.log('Seeding neighborhoods...')

  for (const hood of NEIGHBORHOODS) {
    await prisma.neighborhood.upsert({
      where: { slug: hood.slug },
      update: {
        name: hood.name,
        tier: hood.tier,
        grade: hood.grade,
        centerLat: hood.centerLat,
        centerLng: hood.centerLng,
        walkScore: hood.walkScore,
        transitScore: hood.transitScore,
        bikeScore: hood.bikeScore,
        // Scores
        ...(hood.safetyScore !== undefined && { safetyScore: hood.safetyScore }),
        ...(hood.livabilityScore !== undefined && { livabilityScore: hood.livabilityScore }),
        ...(hood.nightlifeScore !== undefined && { nightlifeScore: hood.nightlifeScore }),
        ...(hood.priceScore !== undefined && { priceScore: hood.priceScore }),
        ...(hood.compositeScore !== undefined && { compositeScore: hood.compositeScore }),
        // Demographics & transit
        ...(hood.ageDemoLow !== undefined && { ageDemoLow: hood.ageDemoLow }),
        ...(hood.ageDemoHigh !== undefined && { ageDemoHigh: hood.ageDemoHigh }),
        ...(hood.transitAccess !== undefined && { transitAccess: hood.transitAccess }),
        ...(hood.commuteUptownMin !== undefined && { commuteUptownMin: hood.commuteUptownMin }),
        // Archetypes
        ...(hood.bestArchetypes && { bestArchetypes: hood.bestArchetypes }),
        ...(hood.avoidArchetypes && { avoidArchetypes: hood.avoidArchetypes }),
        // Vibes & warnings
        ...(hood.highlights && { highlights: hood.highlights }),
        ...(hood.warnings && { warnings: hood.warnings }),
        ...(hood.characterTags && { characterTags: hood.characterTags }),
      },
      create: {
        name: hood.name,
        slug: hood.slug,
        tier: hood.tier,
        grade: hood.grade,
        centerLat: hood.centerLat,
        centerLng: hood.centerLng,
        walkScore: hood.walkScore,
        transitScore: hood.transitScore,
        bikeScore: hood.bikeScore,
        // Scores
        safetyScore: hood.safetyScore ?? 0,
        livabilityScore: hood.livabilityScore ?? 0,
        nightlifeScore: hood.nightlifeScore ?? 0,
        priceScore: hood.priceScore ?? 0,
        compositeScore: hood.compositeScore ?? 0,
        // Demographics & transit
        ageDemoLow: hood.ageDemoLow ?? null,
        ageDemoHigh: hood.ageDemoHigh ?? null,
        transitAccess: hood.transitAccess ?? null,
        commuteUptownMin: hood.commuteUptownMin ?? null,
        // Archetypes
        bestArchetypes: hood.bestArchetypes ?? [],
        avoidArchetypes: hood.avoidArchetypes ?? [],
        // Vibes & warnings
        highlights: hood.highlights ?? [],
        warnings: hood.warnings ?? [],
        characterTags: hood.characterTags ?? [],
      },
    })
  }

  console.log(`  Seeded ${NEIGHBORHOODS.length} neighborhoods`)

  console.log('Seeding management companies...')

  for (const mgmt of MANAGEMENT_COMPANIES) {
    await prisma.managementCompany.upsert({
      where: { slug: mgmt.slug },
      update: { name: mgmt.name },
      create: {
        name: mgmt.name,
        slug: mgmt.slug,
        logoUrl: mgmt.logoUrl,
      },
    })
  }

  console.log(`  Seeded ${MANAGEMENT_COMPANIES.length} management companies`)
  console.log('Done!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
