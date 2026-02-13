// Types for field edits audit tracking system

/**
 * Fields that can be edited by locators
 */
export type EditableFieldName =
  | 'rentMin'
  | 'rentMax'
  | 'deposit'
  | 'adminFee'
  | 'specials'
  | 'petPolicy'
  | 'parkingType'

/**
 * Source of the edit
 */
export type EditSource = 'scraper' | 'locator' | 'admin'

/**
 * Target entity type for a field edit
 */
export type EditTargetType = 'unit' | 'building'

/**
 * Editor information returned from API
 */
export interface FieldEditEditor {
  id: string
  firstName: string
  lastName: string
}

/**
 * A single field edit record from the database
 */
export interface FieldEditRecord {
  id: string
  unitId: string | null
  buildingId: string | null
  fieldName: EditableFieldName
  previousValue: unknown
  newValue: unknown
  source: EditSource
  editedBy: FieldEditEditor | null
  hasConflict: boolean
  conflictValue: unknown
  createdAt: Date
}

/**
 * A field value with its edit overlay information
 */
export interface FieldWithEdit<T> {
  /** The value to display (edited value if exists, otherwise scraped) */
  currentValue: T
  /** The original scraped value */
  scrapedValue: T
  /** The most recent edit record, if any */
  lastEdit: FieldEditRecord | null
  /** Whether there's an unresolved conflict */
  hasConflict: boolean
}

/**
 * Resolution action for a conflict
 */
export interface ConflictResolution {
  editId: string
  resolution: 'keep_locator' | 'accept_scraper'
}

/**
 * Payload for creating a new field edit
 */
export interface CreateFieldEditPayload {
  targetType: EditTargetType
  targetId: string
  fieldName: EditableFieldName
  newValue: unknown
}

/**
 * Field configuration for editable fields
 */
export interface EditableFieldConfig {
  fieldName: EditableFieldName
  label: string
  targetType: EditTargetType
  type: 'number' | 'text'
  prefix?: string
  suffix?: string
  placeholder?: string
}

/**
 * Configurations for all editable fields
 */
export const EDITABLE_FIELD_CONFIGS: Record<EditableFieldName, Omit<EditableFieldConfig, 'fieldName'>> = {
  rentMin: {
    label: 'Monthly Rent (Min)',
    targetType: 'unit',
    type: 'number',
    prefix: '$',
    suffix: '/mo',
    placeholder: 'e.g., 1500',
  },
  rentMax: {
    label: 'Monthly Rent (Max)',
    targetType: 'unit',
    type: 'number',
    prefix: '$',
    suffix: '/mo',
    placeholder: 'e.g., 2000',
  },
  deposit: {
    label: 'Security Deposit',
    targetType: 'building',
    type: 'number',
    prefix: '$',
    placeholder: 'e.g., 500',
  },
  adminFee: {
    label: 'Application Fee',
    targetType: 'building',
    type: 'number',
    prefix: '$',
    placeholder: 'e.g., 75',
  },
  specials: {
    label: 'Current Specials',
    targetType: 'building',
    type: 'text',
    placeholder: 'e.g., 1 month free on 12+ month lease',
  },
  petPolicy: {
    label: 'Pet Policy',
    targetType: 'building',
    type: 'text',
    placeholder: 'e.g., Dogs allowed up to 50lbs',
  },
  parkingType: {
    label: 'Parking',
    targetType: 'building',
    type: 'text',
    placeholder: 'e.g., Covered garage, $100/mo',
  },
}
