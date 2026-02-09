export interface Client {
  id: string
  name: string
  email: string | null
  budgetMin: number | null
  budgetMax: number | null
  neighborhoods: string[]
  priorities: string[]
  moveInDate: string | null
  hasDog: boolean
  hasCat: boolean
}

export interface Neighborhood {
  id: string
  name: string
  slug: string
  grade: string
  walkScore: number | null
  safetyScore: number
  tagline: string | null
}

export interface SavedListing {
  id: string
  notes: string | null
  unit: {
    id: string
    bedrooms: number
    bathrooms: number
    rentMin: number
    rentMax: number
    sqftMin: number | null
    availableDate: string | null
    building: {
      id: string
      name: string
      address: string
      primaryPhotoUrl: string | null
      amenities: string[]
      neighborhood: {
        id: string
        name: string
        walkScore: number | null
      }
    }
  }
}

export interface SavedBuilding {
  id: string
  notes: string | null
  building: {
    id: string
    name: string
    address: string
    primaryPhotoUrl: string | null
    amenities: string[]
    neighborhood: {
      id: string
      name: string
      walkScore: number | null
    }
    units: Array<{
      id: string
      bedrooms: number
      bathrooms: number
      rentMin: number
      sqftMin: number | null
      availableDate: string | null
    }>
  }
}

export interface ReportProperty {
  id?: string
  buildingId: string | null
  unitId: string | null
  name: string
  address: string
  neighborhood: string
  imageUrl: string | null
  rent: number
  bedrooms: number
  bathrooms: number
  sqft: number | null
  availableDate: string | null
  amenities: string[]
  walkScore: number | null
  isRecommended: boolean
  locatorNote: string | null
  sortOrder: number
  deposit: number | null
  adminFee: number | null
  petDeposit: number | null
  petRent: number | null
  promos: string | null
}

export interface ReportNeighborhood {
  id?: string
  neighborhoodId: string | null
  name: string
  vibe: string | null
  walkability: string | null
  safety: string | null
  dogFriendly: string | null
  sortOrder: number
}

export interface ReportFormData {
  title: string
  clientId: string
  clientName: string
  locatorName: string
  clientBudget: string
  clientMoveDate: string
  clientPriorities: string[]
  customNotes: string
  properties: ReportProperty[]
  neighborhoods: ReportNeighborhood[]
}

export type Step = 'client' | 'properties' | 'neighborhoods' | 'costs' | 'preview'
