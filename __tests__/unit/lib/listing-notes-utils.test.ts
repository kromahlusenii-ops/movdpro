import type { ClientListingNote, NoteType } from '@/components/features/listing-notes/types'

// Utility functions for grouping and sorting notes
function groupNotesByType(notes: ClientListingNote[]): Record<NoteType, ClientListingNote[]> {
  return {
    pro: notes.filter((n) => n.type === 'pro').sort((a, b) => a.sortOrder - b.sortOrder),
    con: notes.filter((n) => n.type === 'con').sort((a, b) => a.sortOrder - b.sortOrder),
    note: notes.filter((n) => n.type === 'note').sort((a, b) => a.sortOrder - b.sortOrder),
  }
}

function filterVisibleNotes(notes: ClientListingNote[]): ClientListingNote[] {
  return notes.filter((n) => n.visibleToClient)
}

function getNoteCountsByType(notes: ClientListingNote[]): Record<NoteType, number> {
  const grouped = groupNotesByType(notes)
  return {
    pro: grouped.pro.length,
    con: grouped.con.length,
    note: grouped.note.length,
  }
}

describe('Listing Notes Utilities', () => {
  const mockNotes: ClientListingNote[] = [
    {
      id: '1',
      clientId: 'client-1',
      unitId: 'unit-1',
      locatorId: 'locator-1',
      type: 'pro',
      content: 'Great location',
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
      content: 'Modern amenities',
      visibleToClient: true,
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
      content: 'Street noise',
      visibleToClient: true,
      sortOrder: 0,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '4',
      clientId: 'client-1',
      unitId: 'unit-1',
      locatorId: 'locator-1',
      type: 'note',
      content: 'Ask about specials',
      visibleToClient: false,
      sortOrder: 0,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '5',
      clientId: 'client-1',
      unitId: 'unit-1',
      locatorId: 'locator-1',
      type: 'note',
      content: 'Client liked the pool',
      visibleToClient: true,
      sortOrder: 1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ]

  describe('groupNotesByType', () => {
    it('groups notes by their type', () => {
      const grouped = groupNotesByType(mockNotes)

      expect(grouped.pro).toHaveLength(2)
      expect(grouped.con).toHaveLength(1)
      expect(grouped.note).toHaveLength(2)
    })

    it('sorts notes within each group by sortOrder', () => {
      const grouped = groupNotesByType(mockNotes)

      expect(grouped.pro[0].content).toBe('Great location')
      expect(grouped.pro[1].content).toBe('Modern amenities')
    })

    it('handles empty notes array', () => {
      const grouped = groupNotesByType([])

      expect(grouped.pro).toHaveLength(0)
      expect(grouped.con).toHaveLength(0)
      expect(grouped.note).toHaveLength(0)
    })
  })

  describe('filterVisibleNotes', () => {
    it('filters out notes not visible to client', () => {
      const visible = filterVisibleNotes(mockNotes)

      expect(visible).toHaveLength(4)
      expect(visible.every((n) => n.visibleToClient)).toBe(true)
    })

    it('returns empty array if all notes are hidden', () => {
      const hiddenNotes = mockNotes.map((n) => ({ ...n, visibleToClient: false }))
      const visible = filterVisibleNotes(hiddenNotes)

      expect(visible).toHaveLength(0)
    })

    it('returns all notes if all are visible', () => {
      const allVisible = mockNotes.map((n) => ({ ...n, visibleToClient: true }))
      const visible = filterVisibleNotes(allVisible)

      expect(visible).toHaveLength(mockNotes.length)
    })
  })

  describe('getNoteCountsByType', () => {
    it('returns correct counts for each type', () => {
      const counts = getNoteCountsByType(mockNotes)

      expect(counts.pro).toBe(2)
      expect(counts.con).toBe(1)
      expect(counts.note).toBe(2)
    })

    it('returns zeros for empty array', () => {
      const counts = getNoteCountsByType([])

      expect(counts.pro).toBe(0)
      expect(counts.con).toBe(0)
      expect(counts.note).toBe(0)
    })
  })
})
