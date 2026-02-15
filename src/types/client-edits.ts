// Types for client field edits audit tracking system

/**
 * Fields that can be edited on a client
 */
export type ClientEditableFieldName =
  // Contact info
  | 'name'
  | 'email'
  | 'phone'
  | 'contactPreference'
  // Budget
  | 'budgetMin'
  | 'budgetMax'
  // Requirements
  | 'bedrooms'
  | 'neighborhoods'
  | 'amenities'
  | 'moveInDate'
  // Lifestyle
  | 'vibes'
  | 'priorities'
  | 'hasDog'
  | 'hasCat'
  | 'hasKids'
  | 'worksFromHome'
  | 'needsParking'
  // Commute
  | 'commuteAddress'
  | 'commutePreference'
  // Other
  | 'notes'
  | 'status'

/**
 * Fields that trigger a re-match prompt when changed
 */
export const PREFERENCE_FIELDS: ClientEditableFieldName[] = [
  'budgetMin',
  'budgetMax',
  'bedrooms',
  'neighborhoods',
  'amenities',
  'vibes',
  'priorities',
  'hasDog',
  'hasCat',
  'hasKids',
  'worksFromHome',
  'needsParking',
  'commuteAddress',
  'commutePreference',
]

/**
 * Editor information returned from API
 */
export interface ClientFieldEditEditor {
  id: string
  firstName: string
  lastName: string
}

/**
 * A single client field edit record from the database
 */
export interface ClientFieldEditRecord {
  id: string
  clientId: string
  fieldName: ClientEditableFieldName
  previousValue: unknown
  newValue: unknown
  editedBy: ClientFieldEditEditor | null
  createdAt: Date
}

/**
 * A field value with its edit overlay information
 */
export interface ClientFieldWithEdit<T> {
  currentValue: T
  lastEdit: ClientFieldEditRecord | null
}

/**
 * Payload for creating a new client field edit
 */
export interface CreateClientFieldEditPayload {
  clientId: string
  fieldName: ClientEditableFieldName
  newValue: unknown
}

/**
 * Field type for editable client fields
 */
export type ClientFieldType =
  | 'text'
  | 'number'
  | 'array'
  | 'boolean'
  | 'date'
  | 'budget-range'

/**
 * Field configuration for editable client fields
 */
export interface ClientEditableFieldConfig {
  fieldName: ClientEditableFieldName
  label: string
  type: ClientFieldType
  placeholder?: string
  options?: { id: string; label: string }[]
  isPreferenceField: boolean
}

/**
 * All editable field configurations
 */
export const CLIENT_EDITABLE_FIELD_CONFIGS: Record<ClientEditableFieldName, Omit<ClientEditableFieldConfig, 'fieldName'>> = {
  // Contact info
  name: {
    label: 'Name',
    type: 'text',
    placeholder: 'Client name',
    isPreferenceField: false,
  },
  email: {
    label: 'Email',
    type: 'text',
    placeholder: 'email@example.com',
    isPreferenceField: false,
  },
  phone: {
    label: 'Phone',
    type: 'text',
    placeholder: '(555) 555-5555',
    isPreferenceField: false,
  },
  contactPreference: {
    label: 'Contact Preference',
    type: 'text',
    placeholder: 'e.g., Text, Email, Call',
    isPreferenceField: false,
  },
  // Budget
  budgetMin: {
    label: 'Min Budget',
    type: 'number',
    placeholder: '1000',
    isPreferenceField: true,
  },
  budgetMax: {
    label: 'Max Budget',
    type: 'number',
    placeholder: '2000',
    isPreferenceField: true,
  },
  // Requirements
  bedrooms: {
    label: 'Bedrooms',
    type: 'array',
    isPreferenceField: true,
  },
  neighborhoods: {
    label: 'Preferred Neighborhoods',
    type: 'array',
    isPreferenceField: true,
  },
  amenities: {
    label: 'Amenities',
    type: 'array',
    isPreferenceField: true,
  },
  moveInDate: {
    label: 'Move-In Date',
    type: 'date',
    isPreferenceField: false,
  },
  // Lifestyle
  vibes: {
    label: 'Vibes',
    type: 'array',
    isPreferenceField: true,
  },
  priorities: {
    label: 'Priorities',
    type: 'array',
    isPreferenceField: true,
  },
  hasDog: {
    label: 'Has Dog',
    type: 'boolean',
    isPreferenceField: true,
  },
  hasCat: {
    label: 'Has Cat',
    type: 'boolean',
    isPreferenceField: true,
  },
  hasKids: {
    label: 'Has Kids',
    type: 'boolean',
    isPreferenceField: true,
  },
  worksFromHome: {
    label: 'Works From Home',
    type: 'boolean',
    isPreferenceField: true,
  },
  needsParking: {
    label: 'Needs Parking',
    type: 'boolean',
    isPreferenceField: true,
  },
  // Commute
  commuteAddress: {
    label: 'Commute To',
    type: 'text',
    placeholder: 'Work address',
    isPreferenceField: true,
  },
  commutePreference: {
    label: 'Commute Preference',
    type: 'text',
    placeholder: 'e.g., driving, transit',
    isPreferenceField: true,
  },
  // Other
  notes: {
    label: 'Notes',
    type: 'text',
    placeholder: 'Additional notes',
    isPreferenceField: false,
  },
  status: {
    label: 'Status',
    type: 'text',
    isPreferenceField: false,
  },
}
