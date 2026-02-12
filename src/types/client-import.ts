export interface RawFileData {
  headers: string[]
  rows: string[][]
  totalRows: number
}

export interface ColumnMapping {
  sourceColumn: string
  targetField: string | null
  confidence: number // 0-1
}

export interface MappableField {
  key: string
  label: string
  required: boolean
  aliases: string[]
}

export interface ValidationError {
  row: number
  field: string
  message: string
  value: string
}

export interface ParsedClientRow {
  name: string
  email?: string
  phone?: string
  budgetMin?: number
  budgetMax?: number
  bedrooms?: string[]
  neighborhoods?: string[]
  moveInDate?: Date
  vibes?: string[]
  priorities?: string[]
  hasDog?: boolean
  hasCat?: boolean
  hasKids?: boolean
  worksFromHome?: boolean
  needsParking?: boolean
  commuteAddress?: string
  commutePreference?: string
  contactPreference?: string
  notes?: string
  status?: string
}

export interface DuplicateMatch {
  importedRow: ParsedClientRow
  existingClient: { id: string; name: string; email: string }
  rowIndex: number
  resolution: 'skip' | 'overwrite' | null
}

export interface ValidationResult {
  valid: ParsedClientRow[]
  errors: ValidationError[]
  duplicates: DuplicateMatch[]
}

export interface ImportResult {
  imported: number
  skipped: number
  failed: number
  duplicates: number
  batchId: string
}

export const MAPPABLE_FIELDS: MappableField[] = [
  {
    key: 'name',
    label: 'Name',
    required: true,
    aliases: ['full name', 'client name', 'contact name', 'first name', 'last name', 'client'],
  },
  {
    key: 'email',
    label: 'Email',
    required: false,
    aliases: ['email address', 'e-mail', 'contact email', 'e mail'],
  },
  {
    key: 'phone',
    label: 'Phone',
    required: false,
    aliases: ['phone number', 'mobile', 'cell', 'telephone', 'cell phone', 'mobile phone'],
  },
  {
    key: 'budgetMin',
    label: 'Budget Min',
    required: false,
    aliases: ['min budget', 'minimum budget', 'budget low', 'budget minimum', 'min rent'],
  },
  {
    key: 'budgetMax',
    label: 'Budget Max',
    required: false,
    aliases: ['max budget', 'maximum budget', 'budget high', 'budget maximum', 'max rent', 'budget'],
  },
  {
    key: 'bedrooms',
    label: 'Bedrooms',
    required: false,
    aliases: ['beds', 'br', 'bedroom count', 'bedroom', 'bed count'],
  },
  {
    key: 'neighborhoods',
    label: 'Neighborhoods',
    required: false,
    aliases: ['areas', 'preferred areas', 'location', 'preferred neighborhoods', 'neighborhood'],
  },
  {
    key: 'moveInDate',
    label: 'Move-in Date',
    required: false,
    aliases: ['move date', 'target date', 'move-in', 'moving date', 'desired move date'],
  },
  {
    key: 'vibes',
    label: 'Vibes',
    required: false,
    aliases: ['lifestyle', 'archetype', 'personality', 'lifestyle type'],
  },
  {
    key: 'priorities',
    label: 'Priorities',
    required: false,
    aliases: ['preferences', 'must haves', 'requirements', 'needs'],
  },
  {
    key: 'notes',
    label: 'Notes',
    required: false,
    aliases: ['comments', 'additional info', 'description', 'additional notes', 'other'],
  },
  {
    key: 'status',
    label: 'Status',
    required: false,
    aliases: ['stage', 'lifecycle stage', 'lead status', 'client status'],
  },
  {
    key: 'contactPreference',
    label: 'Contact Preference',
    required: false,
    aliases: ['preferred contact', 'contact method', 'how to contact'],
  },
  {
    key: 'hasDog',
    label: 'Has Dog',
    required: false,
    aliases: ['dog', 'has a dog', 'pet dog', 'dogs'],
  },
  {
    key: 'hasCat',
    label: 'Has Cat',
    required: false,
    aliases: ['cat', 'has a cat', 'pet cat', 'cats'],
  },
  {
    key: 'hasKids',
    label: 'Has Kids',
    required: false,
    aliases: ['kids', 'children', 'has children', 'family'],
  },
  {
    key: 'worksFromHome',
    label: 'Works From Home',
    required: false,
    aliases: ['remote work', 'wfh', 'work from home', 'remote'],
  },
  {
    key: 'needsParking',
    label: 'Needs Parking',
    required: false,
    aliases: ['parking', 'parking needed', 'requires parking', 'car'],
  },
  {
    key: 'commuteAddress',
    label: 'Commute Address',
    required: false,
    aliases: ['work address', 'office address', 'workplace', 'work location'],
  },
]
