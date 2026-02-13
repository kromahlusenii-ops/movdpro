export type NoteType = 'pro' | 'con' | 'note'

export interface ClientListingNote {
  id: string
  clientId: string
  unitId: string
  locatorId: string
  type: NoteType
  content: string
  visibleToClient: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface ReportPropertyNote {
  id: string
  propertyId: string
  type: NoteType
  content: string
  sortOrder: number
  createdAt: string
}

export interface CreateNoteInput {
  type: NoteType
  content: string
  visibleToClient?: boolean
}

export interface UpdateNoteInput {
  id: string
  content?: string
  visibleToClient?: boolean
  sortOrder?: number
}

export interface ReorderNotesInput {
  noteIds: string[]
}
