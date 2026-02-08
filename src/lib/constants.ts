// Charlotte Neighborhoods
export const NEIGHBORHOODS = {
  // Tier 1: High Search Volume
  tier1: [
    { name: 'South End', slug: 'south-end', lat: 35.2157, lng: -80.8569 },
    { name: 'NoDa', slug: 'noda', lat: 35.2496, lng: -80.8131 },
    { name: 'Plaza Midwood', slug: 'plaza-midwood', lat: 35.2213, lng: -80.8089 },
    { name: 'Dilworth', slug: 'dilworth', lat: 35.2044, lng: -80.8567 },
    { name: 'Uptown Charlotte', slug: 'uptown', lat: 35.2271, lng: -80.8431 },
    { name: 'Elizabeth', slug: 'elizabeth', lat: 35.2133, lng: -80.8267 },
    { name: 'Myers Park', slug: 'myers-park', lat: 35.1847, lng: -80.8267 },
    { name: 'Camp North End', slug: 'camp-north-end', lat: 35.2398, lng: -80.8556 },
  ],
  // Tier 2: High Demand
  tier2: [
    { name: 'University City', slug: 'university-city', lat: 35.3076, lng: -80.7273 },
    { name: 'Ballantyne', slug: 'ballantyne', lat: 35.0535, lng: -80.8506 },
    { name: 'SouthPark', slug: 'southpark', lat: 35.1531, lng: -80.8292 },
    { name: 'Montford', slug: 'montford', lat: 35.2178, lng: -80.8728 },
    { name: 'Wesley Heights', slug: 'wesley-heights', lat: 35.2334, lng: -80.8678 },
    { name: 'FreeMoreWest', slug: 'freemorewest', lat: 35.2267, lng: -80.8789 },
    { name: 'Sedgefield', slug: 'sedgefield', lat: 35.1912, lng: -80.8567 },
  ],
  // Tier 3: Suburban (Future)
  tier3: [
    { name: 'Matthews', slug: 'matthews', lat: 35.1168, lng: -80.7237 },
    { name: 'Huntersville', slug: 'huntersville', lat: 35.4107, lng: -80.8428 },
    { name: 'Cornelius', slug: 'cornelius', lat: 35.4868, lng: -80.8601 },
    { name: 'Davidson', slug: 'davidson', lat: 35.4993, lng: -80.8487 },
    { name: 'Pineville', slug: 'pineville', lat: 35.0832, lng: -80.8923 },
    { name: 'Mint Hill', slug: 'mint-hill', lat: 35.1793, lng: -80.6473 },
  ],
} as const

export type NeighborhoodSlug =
  | typeof NEIGHBORHOODS.tier1[number]['slug']
  | typeof NEIGHBORHOODS.tier2[number]['slug']
  | typeof NEIGHBORHOODS.tier3[number]['slug']

// Priority Options
export const PRIORITIES = [
  { id: 'quiet', label: 'Quiet', icon: '🤫' },
  { id: 'walkable', label: 'Walkable', icon: '🚶' },
  { id: 'nightlife', label: 'Nightlife', icon: '🍻' },
  { id: 'family-friendly', label: 'Family-Friendly', icon: '👨‍👩‍👧' },
  { id: 'safe', label: 'Safe', icon: '🛡️' },
  { id: 'good-transit', label: 'Good Transit', icon: '🚇' },
  { id: 'parks', label: 'Parks & Green Space', icon: '🌳' },
  { id: 'trendy', label: 'Trendy/Up-and-Coming', icon: '✨' },
  { id: 'well-maintained', label: 'Well-Maintained', icon: '🏠' },
] as const

export type PriorityId = typeof PRIORITIES[number]['id']

// Vibe Options (multi-select, pick up to 3)
export const VIBES = [
  {
    id: 'young-professional',
    label: 'Young Professional',
    description: 'Career-focused, happy hours, networking',
    image: '/images/vibes/young-professional.jpg',
  },
  {
    id: 'remote-worker',
    label: 'Remote Worker',
    description: 'Coffee shops, coworking, home office life',
    image: '/images/vibes/remote-worker.jpg',
  },
  {
    id: 'social-butterfly',
    label: 'Social Butterfly',
    description: 'Always out, loves events and meeting people',
    image: '/images/vibes/social-butterfly.jpg',
  },
  {
    id: 'foodie',
    label: 'Foodie',
    description: 'Restaurant hopping, trying new cuisines',
    image: '/images/vibes/foodie.jpg',
  },
  {
    id: 'creative',
    label: 'Creative',
    description: 'Arts, music, galleries, maker spaces',
    image: '/images/vibes/creative.jpg',
  },
  {
    id: 'nightlife-lover',
    label: 'Nightlife Lover',
    description: 'Bars, clubs, late nights out',
    image: '/images/vibes/nightlife-lover.jpg',
  },
  {
    id: 'outdoorsy',
    label: 'Outdoorsy',
    description: 'Trails, parks, biking, outdoor activities',
    image: '/images/vibes/outdoorsy.jpg',
  },
  {
    id: 'homebody',
    label: 'Homebody',
    description: 'Cozy nights in, quiet neighborhood',
    image: '/images/vibes/homebody.jpg',
  },
  {
    id: 'fitness-focused',
    label: 'Fitness Focused',
    description: 'Gyms, running trails, active lifestyle',
    image: '/images/vibes/fitness-focused.jpg',
  },
  {
    id: 'urban-explorer',
    label: 'Urban Explorer',
    description: 'City life, walkability, dense neighborhoods',
    image: '/images/vibes/urban-explorer.jpg',
  },
] as const

export type VibeId = typeof VIBES[number]['id']

// Age Bracket Options
export const AGE_BRACKETS = [
  { id: '18-24', label: '18-24', description: 'College age / early career' },
  { id: '25-34', label: '25-34', description: 'Young professional' },
  { id: '35-44', label: '35-44', description: 'Established career' },
  { id: '45-54', label: '45-54', description: 'Mid-career' },
  { id: '55+', label: '55+', description: 'Pre-retirement / retired' },
] as const

export type AgeBracketId = typeof AGE_BRACKETS[number]['id']

// Bedroom Options
export const BEDROOM_OPTIONS = [
  { id: 'studio', label: 'Studio', description: 'Open floor plan' },
  { id: '1br', label: '1 Bedroom', description: 'Solo or couple' },
  { id: '2br', label: '2 Bedrooms', description: 'Office or roommate' },
  { id: '3br+', label: '3+ Bedrooms', description: 'Family or extra space' },
] as const

export type BedroomId = typeof BEDROOM_OPTIONS[number]['id']

// Bathroom Options
export const BATHROOM_OPTIONS = [
  { id: '1ba', label: '1 Bathroom', description: 'Standard' },
  { id: '1.5ba', label: '1.5 Bathrooms', description: 'Half bath included' },
  { id: '2ba', label: '2 Bathrooms', description: 'Great for sharing' },
  { id: '2.5ba+', label: '2.5+ Bathrooms', description: 'Extra comfort' },
] as const

export type BathroomId = typeof BATHROOM_OPTIONS[number]['id']

// Lease Length Options
export const LEASE_LENGTH_OPTIONS = [
  { id: '3mo', label: '3 Months', description: 'Short-term flexibility' },
  { id: '6mo', label: '6 Months', description: 'Medium-term commitment' },
  { id: '12mo', label: '1 Year', description: 'Standard lease term' },
] as const

export type LeaseLengthId = typeof LEASE_LENGTH_OPTIONS[number]['id']

// Move Status Options
export const MOVE_STATUS_OPTIONS = [
  { id: 'moving', label: 'Moving to Charlotte', description: 'Relocating from another city', icon: '✈️' },
  { id: 'local', label: 'Already in Charlotte', description: 'Looking for a new neighborhood', icon: '🏠' },
] as const

export type MoveStatusId = typeof MOVE_STATUS_OPTIONS[number]['id']

// Transportation Options
export const TRANSPORTATION_OPTIONS = [
  { id: 'has-car', label: 'I have a car', description: 'Primary transportation is driving', icon: '🚗' },
  { id: 'no-car', label: 'No car', description: 'Will rely on transit, walking, biking', icon: '🚇' },
] as const

export type TransportationId = typeof TRANSPORTATION_OPTIONS[number]['id']

// Cities (Charlotte active, others coming soon)
export const CITIES = [
  { name: 'Charlotte', slug: 'charlotte', state: 'NC', active: true },
  { name: 'Austin', slug: 'austin', state: 'TX', active: false },
  { name: 'Denver', slug: 'denver', state: 'CO', active: false },
  { name: 'Nashville', slug: 'nashville', state: 'TN', active: false },
  { name: 'Raleigh', slug: 'raleigh', state: 'NC', active: false },
  { name: 'Dallas', slug: 'dallas', state: 'TX', active: false },
  { name: 'Tampa', slug: 'tampa', state: 'FL', active: false },
  { name: 'Phoenix', slug: 'phoenix', state: 'AZ', active: false },
] as const

// Commute Options
export const COMMUTE_TIMES = [
  { value: 15, label: '15 min or less' },
  { value: 30, label: '30 min or less' },
  { value: 45, label: '45 min or less' },
  { value: 60, label: '60 min or less' },
] as const

// Scoring Weights
// Note: 311 data is used for warnings/analysis, not heavily weighted in scores
// Uptown has more 311 complaints because more people live there, not because it's worse
export const SCORE_WEIGHTS = {
  safety: 0.30,        // CMPD crime data - most important
  livability: 0.30,    // Walk Score, Transit Score, amenities
  trajectory: 0.20,    // Is the area improving?
  sentiment: 0.15,     // What residents say online
  infrastructure: 0.05, // 311 data - minimal weight, used for warnings instead
} as const

// Priority to Score Mapping
export const PRIORITY_SCORE_BOOSTS: Record<PriorityId, Partial<Record<keyof typeof SCORE_WEIGHTS, number>>> = {
  'quiet': { livability: 0.15, infrastructure: 0.05 },
  'walkable': { livability: 0.20 },
  'nightlife': { livability: 0.10, sentiment: 0.10 },
  'family-friendly': { safety: 0.15, infrastructure: 0.05 },
  'safe': { safety: 0.25 },
  'good-transit': { livability: 0.20 },
  'parks': { livability: 0.15, infrastructure: 0.05 },
  'trendy': { trajectory: 0.15, sentiment: 0.10 },
  'well-maintained': { infrastructure: 0.20 },
}

// Transportation-based neighborhood penalties/boosts
// For users without a car, car-dependent neighborhoods get penalized
export const TRANSIT_ACCESS_SCORES: Record<string, { noCar: number; hasCar: number }> = {
  'excellent': { noCar: 15, hasCar: 0 },    // Bonus for no-car users
  'light-rail': { noCar: 10, hasCar: 0 },   // Good for no-car users
  'bus': { noCar: 0, hasCar: 0 },           // Neutral
  'none': { noCar: -20, hasCar: 5 },        // Penalty for no-car, slight bonus for car owners (less crowded)
}

// Minimum walk/transit scores for no-car users (below this = warning)
export const NO_CAR_THRESHOLDS = {
  minWalkScore: 50,      // Below this, warn user
  minTransitScore: 40,   // Below this, warn user
  idealWalkScore: 70,    // Above this, good fit
  idealTransitScore: 60, // Above this, good fit
}

// Budget Ranges
export const BUDGET = {
  min: 800,
  max: 4000,
  default: 1500,
  step: 100,
} as const

// Product pricing
export const PRICING = {
  reportPrice: 29,
  currency: 'usd',
} as const

// Results limit - only show top 5 to reduce decision fatigue
export const MAX_RESULTS = 5

// Grade thresholds
export const GRADE_THRESHOLDS = {
  'A+': 95,
  'A': 90,
  'A-': 87,
  'B+': 83,
  'B': 80,
  'B-': 77,
  'C+': 73,
  'C': 70,
  'C-': 67,
  'D+': 63,
  'D': 60,
  'F': 0,
} as const

export function getGrade(score: number): string {
  for (const [grade, threshold] of Object.entries(GRADE_THRESHOLDS)) {
    if (score >= threshold) return grade
  }
  return 'F'
}

export function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return 'grade-a'
  if (grade.startsWith('B')) return 'grade-b'
  if (grade.startsWith('C')) return 'grade-c'
  if (grade.startsWith('D')) return 'grade-d'
  return 'grade-f'
}

// Neighborhood lifestyle images (single image used for both hero and thumbnail)
export const NEIGHBORHOOD_IMAGES: Record<string, { image: string; vibe: string }> = {
  'south-end': {
    image: '/images/neighborhoods/south-end.jpg',
    vibe: 'Young professionals, breweries, light rail access',
  },
  'noda': {
    image: '/images/neighborhoods/noda.png',
    vibe: 'Arts district, live music, eclectic vibes',
  },
  'plaza-midwood': {
    image: '/images/neighborhoods/plaza-midwood.avif',
    vibe: 'Quirky, diverse, local businesses',
  },
  'dilworth': {
    image: '/images/neighborhoods/dilworth.jpg',
    vibe: 'Historic homes, tree-lined streets, walkable',
  },
  'uptown': {
    image: '/images/neighborhoods/uptown.jpg',
    vibe: 'Urban core, high-rises, restaurants',
  },
  'elizabeth': {
    image: '/images/neighborhoods/elizabeth.webp',
    vibe: 'Quiet charm, medical district adjacent',
  },
  'myers-park': {
    image: '/images/neighborhoods/myers-park.jpg',
    vibe: 'Upscale, established, beautiful homes',
  },
  'camp-north-end': {
    image: '/images/neighborhoods/camp-north-end.webp',
    vibe: 'Creative hub, adaptive reuse, food halls',
  },
  'university-city': {
    image: '/images/neighborhoods/university-city.jpg',
    vibe: 'College town energy, affordable, diverse',
  },
  'ballantyne': {
    image: '/images/neighborhoods/ballantyne.jpg',
    vibe: 'Suburban luxury, golf courses, corporate',
  },
  'southpark': {
    image: '/images/neighborhoods/southpark.jpg',
    vibe: 'Shopping, dining, upscale suburban',
  },
  'montford': {
    image: '/images/neighborhoods/montford.jpeg',
    vibe: 'Historic charm, walkable to Uptown',
  },
  'wesley-heights': {
    image: '/images/neighborhoods/wesley-heights.jpg',
    vibe: 'Up-and-coming, diverse, affordable',
  },
  'freemorewest': {
    image: '/images/neighborhoods/freemorewest.jpeg',
    vibe: 'Emerging arts scene, creative spaces',
  },
  'sedgefield': {
    image: '/images/neighborhoods/sedgefield.jpg',
    vibe: 'Quiet residential, family-friendly',
  },
  'matthews': {
    image: '/images/neighborhoods/matthews.jpg',
    vibe: 'Suburban downtown, small-town feel',
  },
  'huntersville': {
    image: '/images/neighborhoods/huntersville.jpg',
    vibe: 'Family-oriented, lake access, shopping',
  },
  'cornelius': {
    image: '/images/neighborhoods/cornelius.jpg',
    vibe: 'Lake Norman living, boating lifestyle',
  },
  'davidson': {
    image: '/images/neighborhoods/davidson.jpg',
    vibe: 'College town charm, walkable downtown',
  },
  'pineville': {
    image: '/images/neighborhoods/pineville.jpg',
    vibe: 'Affordable, shopping centers, diverse',
  },
  'mint-hill': {
    image: '/images/neighborhoods/mint-hill.jpg',
    vibe: 'Rural feel, spacious lots, quiet',
  },
}

// Neighborhood matching profiles from research data
// Star ratings from CSV: Walk, Transit, Night, Food, Safety, Family (1-5 scale)
export const NEIGHBORHOOD_PROFILES: Record<string, {
  priceLevel: 'affordable' | 'moderate' | 'expensive' | 'very-expensive'
  walkScore: 1 | 2 | 3 | 4 | 5
  transitScore: 1 | 2 | 3 | 4 | 5
  nightlifeScore: 1 | 2 | 3 | 4 | 5
  foodScore: 1 | 2 | 3 | 4 | 5
  safetyScore: 1 | 2 | 3 | 4 | 5
  familyScore: 1 | 2 | 3 | 4 | 5
  groceryScore: 1 | 2 | 3 | 4 | 5
  ageDemoLow: number
  ageDemoHigh: number
  transitAccess: 'none' | 'bus' | 'light-rail' | 'excellent'
  commuteUptown: number // minutes
  bestVibes: VibeId[]
  avoidVibes: VibeId[]
  dogFriendly: boolean
  kidFriendly: boolean
  keyTags: string[] // Quick vibe tags
  bestFor: string[] // Who this neighborhood is best for
  notIdealFor: string[] // Who should consider other options
}> = {
  'south-end': {
    priceLevel: 'very-expensive',
    walkScore: 5,
    transitScore: 5,
    nightlifeScore: 5,
    foodScore: 5,
    safetyScore: 4,
    familyScore: 2,
    groceryScore: 4,
    ageDemoLow: 22,
    ageDemoHigh: 32,
    transitAccess: 'light-rail',
    commuteUptown: 10,
    bestVibes: ['young-professional', 'social-butterfly', 'urban-explorer', 'nightlife-lover', 'foodie'],
    avoidVibes: ['homebody'],
    dogFriendly: true,
    kidFriendly: false,
    keyTags: ['trendy', 'breweries', 'walkable', 'rail trail', 'young crowd'],
    bestFor: ['Young Professionals', 'Social Butterflies', 'Career Starters', 'Foodies', 'Dog Parents'],
    notIdealFor: ['Families with Kids', 'Retirees', 'Budget Starters'],
  },
  'noda': {
    priceLevel: 'moderate',
    walkScore: 4,
    transitScore: 4,
    nightlifeScore: 5,
    foodScore: 5,
    safetyScore: 4,
    familyScore: 2,
    groceryScore: 3,
    ageDemoLow: 25,
    ageDemoHigh: 35,
    transitAccess: 'light-rail',
    commuteUptown: 18,
    bestVibes: ['creative', 'foodie', 'nightlife-lover', 'social-butterfly'],
    avoidVibes: ['homebody'],
    dogFriendly: true,
    kidFriendly: false,
    keyTags: ['artsy', 'murals', 'live music', 'authentic', 'funky'],
    bestFor: ['Artists & Creatives', 'Social Butterflies', 'Experience Seekers', 'Creative Professionals'],
    notIdealFor: ['Established Families', 'Retirees', 'Corporate Types'],
  },
  'plaza-midwood': {
    priceLevel: 'moderate',
    walkScore: 4,
    transitScore: 2,
    nightlifeScore: 5,
    foodScore: 5,
    safetyScore: 4,
    familyScore: 4,
    groceryScore: 4,
    ageDemoLow: 25,
    ageDemoHigh: 40,
    transitAccess: 'bus',
    commuteUptown: 15,
    bestVibes: ['foodie', 'creative', 'outdoorsy', 'social-butterfly'],
    avoidVibes: [],
    dogFriendly: true,
    kidFriendly: true,
    keyTags: ['eclectic', 'diverse', 'community', 'historic', 'food scene'],
    bestFor: ['Foodies', 'Dog Parents', 'Urban Explorers', 'Young Families', 'Remote Workers'],
    notIdealFor: ['Corporate Professionals', 'Suburban Seekers'],
  },
  'dilworth': {
    priceLevel: 'very-expensive',
    walkScore: 5,
    transitScore: 3,
    nightlifeScore: 3,
    foodScore: 5,
    safetyScore: 5,
    familyScore: 5,
    groceryScore: 4,
    ageDemoLow: 30,
    ageDemoHigh: 45,
    transitAccess: 'light-rail',
    commuteUptown: 12,
    bestVibes: ['young-professional', 'outdoorsy', 'homebody', 'foodie', 'fitness-focused'],
    avoidVibes: ['nightlife-lover'],
    dogFriendly: true,
    kidFriendly: true,
    keyTags: ['historic', 'tree-lined', 'bungalows', 'safe', 'walkable'],
    bestFor: ['Young Families', 'Dog Parents', 'Remote Workers', 'Foodies', 'Urban Explorers'],
    notIdealFor: ['Budget Starters', 'Nightlife Seekers'],
  },
  'uptown': {
    priceLevel: 'very-expensive',
    walkScore: 5,
    transitScore: 5,
    nightlifeScore: 4,
    foodScore: 4,
    safetyScore: 4,  // Property crime inflates stats; personal safety is reasonable
    familyScore: 2,
    groceryScore: 3,
    ageDemoLow: 22,
    ageDemoHigh: 38,
    transitAccess: 'excellent',
    commuteUptown: 0,
    bestVibes: ['young-professional', 'urban-explorer', 'social-butterfly', 'remote-worker', 'foodie'],
    avoidVibes: ['outdoorsy'],  // Removed 'homebody' - you can enjoy uptown living without going out constantly
    dogFriendly: true,  // Many uptown buildings allow small dogs
    kidFriendly: false,
    keyTags: ['urban core', 'high-rise', 'walkable', 'no-car-needed', 'zero-commute'],
    bestFor: ['Career Starters', 'Urban Explorers', 'Walk-to-Work', 'No-Car Lifestyle', 'Young Professionals'],
    notIdealFor: ['Families with Kids', 'Budget Starters', 'Needs Quiet'],
  },
  'elizabeth': {
    priceLevel: 'moderate',
    walkScore: 4,
    transitScore: 3,
    nightlifeScore: 3,
    foodScore: 4,
    safetyScore: 5,
    familyScore: 4,
    groceryScore: 3,
    ageDemoLow: 28,
    ageDemoHigh: 40,
    transitAccess: 'bus',
    commuteUptown: 8,
    bestVibes: ['young-professional', 'homebody', 'fitness-focused', 'remote-worker'],
    avoidVibes: ['nightlife-lover'],
    dogFriendly: true,
    kidFriendly: true,
    keyTags: ['historic', 'victorian', 'safe', 'walkable', 'charming'],
    bestFor: ['Remote Workers', 'Hospital Professionals', 'Safety-First', 'Young Professionals'],
    notIdealFor: ['Nightlife Seekers', 'Budget Starters'],
  },
  'myers-park': {
    priceLevel: 'very-expensive',
    walkScore: 4,
    transitScore: 2,
    nightlifeScore: 2,
    foodScore: 4,
    safetyScore: 5,
    familyScore: 5,
    groceryScore: 4,
    ageDemoLow: 35,
    ageDemoHigh: 55,
    transitAccess: 'none',
    commuteUptown: 15,
    bestVibes: ['homebody', 'outdoorsy'],
    avoidVibes: ['nightlife-lover', 'social-butterfly', 'urban-explorer'],
    dogFriendly: true,
    kidFriendly: true,
    keyTags: ['prestigious', 'elegant', 'top schools', 'safe', 'established'],
    bestFor: ['Established Families', 'Retirees', 'Corporate Professionals', 'Affluent Families'],
    notIdealFor: ['Budget Starters', 'Nightlife Seekers', 'Young Singles', 'Pioneers'],
  },
  'camp-north-end': {
    priceLevel: 'moderate',
    walkScore: 4,
    transitScore: 3,
    nightlifeScore: 4,
    foodScore: 5,
    safetyScore: 4,
    familyScore: 3,
    groceryScore: 2,
    ageDemoLow: 25,
    ageDemoHigh: 40,
    transitAccess: 'bus',
    commuteUptown: 10,
    bestVibes: ['creative', 'foodie', 'social-butterfly'],
    avoidVibes: ['homebody'],
    dogFriendly: true,
    kidFriendly: false,
    keyTags: ['creative hub', 'food halls', 'adaptive reuse', 'events', 'emerging'],
    bestFor: ['Creative Professionals', 'Foodies', 'Experience Seekers', 'Social Butterflies', 'Pioneers'],
    notIdealFor: ['Homebodies', 'Established Families'],
  },
  'university-city': {
    priceLevel: 'affordable',
    walkScore: 3,
    transitScore: 4,
    nightlifeScore: 3,
    foodScore: 3,
    safetyScore: 3,
    familyScore: 3,
    groceryScore: 4,
    ageDemoLow: 18,
    ageDemoHigh: 28,
    transitAccess: 'light-rail',
    commuteUptown: 30,
    bestVibes: ['young-professional', 'fitness-focused'],
    avoidVibes: ['homebody'],
    dogFriendly: true,
    kidFriendly: false,
    keyTags: ['college town', 'diverse', 'affordable', 'energetic', 'light rail'],
    bestFor: ['Students', 'Budget Starters', 'Research Park Workers'],
    notIdealFor: ['Established Families', 'Safety-First', 'Corporate Professionals'],
  },
  'ballantyne': {
    priceLevel: 'expensive',
    walkScore: 2,
    transitScore: 1,
    nightlifeScore: 3,
    foodScore: 4,
    safetyScore: 5,
    familyScore: 5,
    groceryScore: 5,
    ageDemoLow: 35,
    ageDemoHigh: 50,
    transitAccess: 'none',
    commuteUptown: 40,
    bestVibes: ['homebody', 'fitness-focused'],
    avoidVibes: ['nightlife-lover', 'urban-explorer', 'social-butterfly'],
    dogFriendly: true,
    kidFriendly: true,
    keyTags: ['suburban', 'safe', 'schools', 'golf', 'corporate'],
    bestFor: ['Corporate Professionals', 'Established Families', 'Safety-First'],
    notIdealFor: ['Nightlife Seekers', 'Urban Explorers', 'Artists', 'Budget Starters'],
  },
  'southpark': {
    priceLevel: 'very-expensive',
    walkScore: 3,
    transitScore: 2,
    nightlifeScore: 3,
    foodScore: 5,
    safetyScore: 5,
    familyScore: 5,
    groceryScore: 5,
    ageDemoLow: 30,
    ageDemoHigh: 50,
    transitAccess: 'bus',
    commuteUptown: 20,
    bestVibes: ['foodie', 'young-professional'],
    avoidVibes: ['nightlife-lover', 'creative'],
    dogFriendly: true,
    kidFriendly: true,
    keyTags: ['upscale', 'shopping', 'safe', 'polished', 'dining'],
    bestFor: ['Corporate Professionals', 'Shoppers', 'Retirees', 'Affluent Families'],
    notIdealFor: ['Budget Starters', 'Nightlife Seekers', 'Artists'],
  },
  'montford': {
    priceLevel: 'moderate',
    walkScore: 3,
    transitScore: 2,
    nightlifeScore: 4,
    foodScore: 4,
    safetyScore: 4,
    familyScore: 4,
    groceryScore: 3,
    ageDemoLow: 25,
    ageDemoHigh: 40,
    transitAccess: 'none',
    commuteUptown: 15,
    bestVibes: ['nightlife-lover', 'foodie', 'social-butterfly'],
    avoidVibes: ['homebody'],
    dogFriendly: true,
    kidFriendly: false,
    keyTags: ['bar strip', 'restaurants', 'laid-back', 'foodie', 'nightlife'],
    bestFor: ['Social Butterflies', 'Foodies', 'Young Professionals'],
    notIdealFor: ['Families with Kids', 'Quiet Seekers'],
  },
  'wesley-heights': {
    priceLevel: 'moderate',
    walkScore: 4,
    transitScore: 3,
    nightlifeScore: 3,
    foodScore: 4,
    safetyScore: 4,
    familyScore: 4,
    groceryScore: 3,
    ageDemoLow: 28,
    ageDemoHigh: 40,
    transitAccess: 'bus',
    commuteUptown: 8,
    bestVibes: ['urban-explorer', 'young-professional', 'creative'],
    avoidVibes: ['homebody'],
    dogFriendly: true,
    kidFriendly: false,
    keyTags: ['historic', 'gentrifying', 'urban', 'skyline views', 'up-and-coming'],
    bestFor: ['Pioneers & Early Adopters', 'Urban Explorers', 'Young Professionals'],
    notIdealFor: ['Safety-First', 'Suburban Seekers'],
  },
  'freemorewest': {
    priceLevel: 'affordable',
    walkScore: 3,
    transitScore: 2,
    nightlifeScore: 2,
    foodScore: 3,
    safetyScore: 3,
    familyScore: 2,
    groceryScore: 2,
    ageDemoLow: 25,
    ageDemoHigh: 35,
    transitAccess: 'bus',
    commuteUptown: 10,
    bestVibes: ['creative', 'urban-explorer'],
    avoidVibes: ['homebody'],
    dogFriendly: true,
    kidFriendly: false,
    keyTags: ['emerging', 'authentic', 'community', 'affordable', 'potential'],
    bestFor: ['Pioneers & Early Adopters', 'Budget Starters', 'Creative Professionals', 'Artists'],
    notIdealFor: ['Safety-First', 'Established Families', 'Corporate Types'],
  },
  'sedgefield': {
    priceLevel: 'moderate',
    walkScore: 4,
    transitScore: 3,
    nightlifeScore: 4,
    foodScore: 4,
    safetyScore: 4,
    familyScore: 4,
    groceryScore: 3,
    ageDemoLow: 28,
    ageDemoHigh: 40,
    transitAccess: 'light-rail',
    commuteUptown: 12,
    bestVibes: ['young-professional', 'outdoorsy', 'fitness-focused'],
    avoidVibes: [],
    dogFriendly: true,
    kidFriendly: true,
    keyTags: ['charming', 'bungalows', 'rail trail', 'transit', 'walkable'],
    bestFor: ['Young Families', 'Dog Parents', 'Pioneers', 'Transit Commuters'],
    notIdealFor: ['Car-Dependent', 'Suburban Seekers'],
  },
}
