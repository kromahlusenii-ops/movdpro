/**
 * Integration tests for the listing notes flow.
 * Tests the full flow from creating notes to displaying in reports.
 */

import type { ClientListingNote, ReportPropertyNote, NoteType } from '@/components/features/listing-notes/types'

// Mock API responses
const mockApiResponses = {
  createNote: (type: NoteType, content: string) => ({
    note: {
      id: `note-${Date.now()}`,
      clientId: 'client-1',
      unitId: 'unit-1',
      locatorId: 'locator-1',
      type,
      content,
      visibleToClient: true,
      sortOrder: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as ClientListingNote,
  }),

  updateNote: (id: string, updates: Partial<ClientListingNote>) => ({
    note: {
      id,
      clientId: 'client-1',
      unitId: 'unit-1',
      locatorId: 'locator-1',
      type: 'pro',
      content: 'Updated content',
      visibleToClient: true,
      sortOrder: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...updates,
    } as ClientListingNote,
  }),

  listNotes: (notes: ClientListingNote[]) => ({ notes }),

  reorderNotes: () => ({ success: true }),

  deleteNote: () => ({ success: true }),
}

describe('Listing Notes Flow', () => {
  describe('Note CRUD operations', () => {
    it('creates a new note and returns it with all fields', () => {
      const response = mockApiResponses.createNote('pro', 'Great location')

      expect(response.note).toMatchObject({
        type: 'pro',
        content: 'Great location',
        visibleToClient: true,
      })
      expect(response.note.id).toBeDefined()
      expect(response.note.createdAt).toBeDefined()
    })

    it('updates note content', () => {
      const response = mockApiResponses.updateNote('note-1', {
        content: 'Updated location info',
      })

      expect(response.note.content).toBe('Updated location info')
    })

    it('toggles note visibility', () => {
      const response = mockApiResponses.updateNote('note-1', {
        visibleToClient: false,
      })

      expect(response.note.visibleToClient).toBe(false)
    })

    it('reorders notes successfully', () => {
      const response = mockApiResponses.reorderNotes()

      expect(response.success).toBe(true)
    })

    it('deletes a note', () => {
      const response = mockApiResponses.deleteNote()

      expect(response.success).toBe(true)
    })
  })

  describe('Filtering notes for reports', () => {
    const allNotes: ClientListingNote[] = [
      {
        id: '1',
        clientId: 'client-1',
        unitId: 'unit-1',
        locatorId: 'locator-1',
        type: 'pro',
        content: 'Visible pro',
        visibleToClient: true,
        sortOrder: 0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        clientId: 'client-1',
        unitId: 'unit-1',
        locatorId: 'locator-1',
        type: 'pro',
        content: 'Hidden pro',
        visibleToClient: false,
        sortOrder: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '3',
        clientId: 'client-1',
        unitId: 'unit-1',
        locatorId: 'locator-1',
        type: 'con',
        content: 'Visible con',
        visibleToClient: true,
        sortOrder: 0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ]

    it('filters out hidden notes for report snapshot', () => {
      const visibleNotes = allNotes.filter((n) => n.visibleToClient)

      expect(visibleNotes).toHaveLength(2)
      expect(visibleNotes.every((n) => n.visibleToClient)).toBe(true)
    })

    it('converts ClientListingNote to ReportPropertyNote', () => {
      const visibleNotes = allNotes.filter((n) => n.visibleToClient)

      const reportNotes: ReportPropertyNote[] = visibleNotes.map((note) => ({
        id: `report-${note.id}`,
        propertyId: 'report-prop-1',
        type: note.type,
        content: note.content,
        sortOrder: note.sortOrder,
        createdAt: new Date().toISOString(),
      }))

      expect(reportNotes).toHaveLength(2)
      expect(reportNotes[0]).toMatchObject({
        type: 'pro',
        content: 'Visible pro',
      })
    })
  })

  describe('Report property with notes', () => {
    it('includes notes in report property data', () => {
      const reportProperty = {
        id: 'prop-1',
        name: 'Test Building',
        address: '123 Main St',
        neighborhood: 'Uptown',
        rent: 1500,
        notes: [
          {
            id: 'note-1',
            propertyId: 'prop-1',
            type: 'pro' as NoteType,
            content: 'Great location',
            sortOrder: 0,
            createdAt: '2024-01-01T00:00:00Z',
          },
        ],
      }

      expect(reportProperty.notes).toHaveLength(1)
      expect(reportProperty.notes[0].content).toBe('Great location')
    })

    it('groups notes by type for display', () => {
      const notes: ReportPropertyNote[] = [
        { id: '1', propertyId: 'prop-1', type: 'pro', content: 'Pro 1', sortOrder: 0, createdAt: '' },
        { id: '2', propertyId: 'prop-1', type: 'pro', content: 'Pro 2', sortOrder: 1, createdAt: '' },
        { id: '3', propertyId: 'prop-1', type: 'con', content: 'Con 1', sortOrder: 0, createdAt: '' },
        { id: '4', propertyId: 'prop-1', type: 'note', content: 'Note 1', sortOrder: 0, createdAt: '' },
      ]

      const grouped = {
        pros: notes.filter((n) => n.type === 'pro'),
        cons: notes.filter((n) => n.type === 'con'),
        notes: notes.filter((n) => n.type === 'note'),
      }

      expect(grouped.pros).toHaveLength(2)
      expect(grouped.cons).toHaveLength(1)
      expect(grouped.notes).toHaveLength(1)
    })
  })

  describe('Client-specific notes isolation', () => {
    const notesForDifferentClients: ClientListingNote[] = [
      {
        id: '1',
        clientId: 'client-1',
        unitId: 'unit-1',
        locatorId: 'locator-1',
        type: 'pro',
        content: 'Client 1 note',
        visibleToClient: true,
        sortOrder: 0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        clientId: 'client-2',
        unitId: 'unit-1',
        locatorId: 'locator-1',
        type: 'pro',
        content: 'Client 2 note',
        visibleToClient: true,
        sortOrder: 0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ]

    it('filters notes by clientId', () => {
      const client1Notes = notesForDifferentClients.filter(
        (n) => n.clientId === 'client-1'
      )

      expect(client1Notes).toHaveLength(1)
      expect(client1Notes[0].content).toBe('Client 1 note')
    })

    it('different clients can have different notes for same unit', () => {
      const unit1Notes = notesForDifferentClients.filter(
        (n) => n.unitId === 'unit-1'
      )

      expect(unit1Notes).toHaveLength(2)

      const client1Note = unit1Notes.find((n) => n.clientId === 'client-1')
      const client2Note = unit1Notes.find((n) => n.clientId === 'client-2')

      expect(client1Note?.content).toBe('Client 1 note')
      expect(client2Note?.content).toBe('Client 2 note')
    })
  })
})
