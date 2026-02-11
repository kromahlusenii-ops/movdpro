/**
 * AI Readability - Data Attribute Constants & Utilities
 *
 * This module provides a consistent convention for data-* attributes
 * that make the DOM easily parseable by AI agents, crawlers, and automated tools.
 */

// Entity types for data-entity attribute
export const ENTITY_TYPES = {
  PROPERTY: 'property',
  BUILDING: 'building',
  UNIT: 'unit',
  CLIENT: 'client',
  LOCATOR: 'locator',
  NEIGHBORHOOD: 'neighborhood',
  REPORT: 'report',
  SPECIAL: 'special',
} as const

export type EntityType = (typeof ENTITY_TYPES)[keyof typeof ENTITY_TYPES]

// Field types for data-field attribute
export const FIELD_TYPES = {
  // Common
  NAME: 'name',
  DESCRIPTION: 'description',
  STATUS: 'status',
  ID: 'id',

  // Property/Unit specific
  PRICE: 'price',
  RENT: 'rent',
  BEDROOMS: 'bedrooms',
  BATHROOMS: 'bathrooms',
  SQFT: 'sqft',
  AVAILABILITY: 'availability',
  AVAILABLE_DATE: 'available-date',
  AMENITIES: 'amenities',
  RATING: 'rating',
  REVIEW_COUNT: 'review-count',

  // Location
  ADDRESS: 'address',
  CITY: 'city',
  STATE: 'state',
  ZIP: 'zip',
  NEIGHBORHOOD: 'neighborhood',
  COORDINATES: 'coordinates',

  // Contact
  PHONE: 'phone',
  EMAIL: 'email',
  WEBSITE: 'website',

  // Scores
  WALK_SCORE: 'walk-score',
  TRANSIT_SCORE: 'transit-score',
  BIKE_SCORE: 'bike-score',
  GRADE: 'grade',
  MATCH_SCORE: 'match-score',

  // Client specific
  BUDGET: 'budget',
  MOVE_DATE: 'move-date',
  PREFERENCES: 'preferences',

  // Management
  MANAGEMENT_COMPANY: 'management-company',
} as const

export type FieldType = (typeof FIELD_TYPES)[keyof typeof FIELD_TYPES]

// Action types for data-action attribute
export const ACTION_TYPES = {
  // Property actions
  SAVE_PROPERTY: 'save-property',
  REMOVE_PROPERTY: 'remove-property',
  VIEW_DETAILS: 'view-details',
  VIEW_FLOORPLANS: 'view-floorplans',
  COMPARE: 'compare',
  CONTACT: 'contact',

  // Client actions
  CREATE_CLIENT: 'create-client',
  EDIT_CLIENT: 'edit-client',
  DELETE_CLIENT: 'delete-client',
  ASSIGN_PROPERTY: 'assign-property',

  // Report actions
  CREATE_REPORT: 'create-report',
  SHARE_REPORT: 'share-report',
  DOWNLOAD_PDF: 'download-pdf',

  // Navigation
  SEARCH: 'search',
  FILTER: 'filter',
  SORT: 'sort',
  PAGINATE: 'paginate',
} as const

export type ActionType = (typeof ACTION_TYPES)[keyof typeof ACTION_TYPES]

// Section types for data-section attribute
export const SECTION_TYPES = {
  // Page sections
  HEADER: 'header',
  NAVIGATION: 'navigation',
  MAIN_CONTENT: 'main-content',
  SIDEBAR: 'sidebar',
  FOOTER: 'footer',

  // Functional sections
  SEARCH_FILTERS: 'search-filters',
  RESULTS_LIST: 'results-list',
  RESULTS_GRID: 'results-grid',
  RESULTS_MAP: 'results-map',
  PAGINATION: 'pagination',

  // Property sections
  PROPERTY_HERO: 'property-hero',
  PROPERTY_SPECS: 'property-specs',
  PROPERTY_AMENITIES: 'property-amenities',
  PROPERTY_GALLERY: 'property-gallery',
  FLOOR_PLANS: 'floor-plans',

  // Client sections
  CLIENT_INFO: 'client-info',
  CLIENT_REQUIREMENTS: 'client-requirements',
  SAVED_PROPERTIES: 'saved-properties',
} as const

export type SectionType = (typeof SECTION_TYPES)[keyof typeof SECTION_TYPES]

// State types for data-state attribute
export const STATE_TYPES = {
  LOADING: 'loading',
  LOADED: 'loaded',
  EMPTY: 'empty',
  ERROR: 'error',
  FILTERED: 'filtered',
  EXPANDED: 'expanded',
  COLLAPSED: 'collapsed',
  SELECTED: 'selected',
  DISABLED: 'disabled',
} as const

export type StateType = (typeof STATE_TYPES)[keyof typeof STATE_TYPES]

/**
 * Helper to generate entity data attributes
 */
export function entityAttrs(type: EntityType, id?: string) {
  return {
    'data-entity': type,
    ...(id && { 'data-entity-id': id }),
  }
}

/**
 * Helper to generate field data attribute
 */
export function fieldAttr(field: FieldType) {
  return { 'data-field': field }
}

/**
 * Helper to generate action data attribute
 */
export function actionAttr(action: ActionType) {
  return { 'data-action': action }
}

/**
 * Helper to generate section data attribute
 */
export function sectionAttr(section: SectionType) {
  return { 'data-section': section }
}

/**
 * Helper to generate state data attribute
 */
export function stateAttr(state: StateType) {
  return { 'data-state': state }
}

/**
 * Helper to generate filter state data attribute
 */
export function filterStateAttr(filters: Record<string, unknown>) {
  return {
    'data-state': STATE_TYPES.FILTERED,
    'data-filters': JSON.stringify(filters),
  }
}

/**
 * Combine multiple data attribute helpers
 */
export function dataAttrs(
  ...attrs: Array<Record<string, string | undefined>>
): Record<string, string | undefined> {
  return Object.assign({}, ...attrs)
}
