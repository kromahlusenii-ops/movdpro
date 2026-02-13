import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ListingNotesPanel } from '@/components/features/listing-notes/ListingNotesPanel'
import type { ClientListingNote } from '@/components/features/listing-notes/types'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('ListingNotesPanel', () => {
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
      type: 'con',
      content: 'Street noise',
      visibleToClient: true,
      sortOrder: 0,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ]

  beforeEach(() => {
    mockFetch.mockClear()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ note: mockNotes[0] }),
    })
  })

  it('renders three sections: Pros, Cons, Notes', () => {
    render(
      <ListingNotesPanel
        clientId="client-1"
        unitId="unit-1"
        initialNotes={[]}
      />
    )

    expect(screen.getByText('Pros')).toBeInTheDocument()
    expect(screen.getByText('Cons')).toBeInTheDocument()
    expect(screen.getByText('Notes')).toBeInTheDocument()
  })

  it('displays existing notes in their sections', () => {
    render(
      <ListingNotesPanel
        clientId="client-1"
        unitId="unit-1"
        initialNotes={mockNotes}
      />
    )

    expect(screen.getByText('Great location')).toBeInTheDocument()
    expect(screen.getByText('Street noise')).toBeInTheDocument()
  })

  it('shows count badges for sections with notes', () => {
    render(
      <ListingNotesPanel
        clientId="client-1"
        unitId="unit-1"
        initialNotes={mockNotes}
      />
    )

    // Check for count badges (1 pro, 1 con)
    const badges = screen.getAllByText('1')
    expect(badges.length).toBeGreaterThanOrEqual(2) // At least 1 for pro and 1 for con
  })

  it('expands sections that have notes', () => {
    render(
      <ListingNotesPanel
        clientId="client-1"
        unitId="unit-1"
        initialNotes={mockNotes}
      />
    )

    // Notes should be visible since their sections are expanded
    expect(screen.getByText('Great location')).toBeInTheDocument()
  })

  it('shows add input when clicking add button', () => {
    render(
      <ListingNotesPanel
        clientId="client-1"
        unitId="unit-1"
        initialNotes={[]}
      />
    )

    // Click the add button for Pros section
    const addButtons = screen.getAllByLabelText(/Add pros/i)
    fireEvent.click(addButtons[0])

    // Check for input field
    expect(screen.getByPlaceholderText('Add a pro...')).toBeInTheDocument()
  })

  it('adds a note when submitting', async () => {
    const newNote = {
      id: 'new-1',
      clientId: 'client-1',
      unitId: 'unit-1',
      locatorId: 'locator-1',
      type: 'pro',
      content: 'New pro note',
      visibleToClient: true,
      sortOrder: 0,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ note: newNote }),
    })

    render(
      <ListingNotesPanel
        clientId="client-1"
        unitId="unit-1"
        initialNotes={[]}
      />
    )

    // Click the add button for Pros section
    const addButtons = screen.getAllByLabelText(/Add pros/i)
    fireEvent.click(addButtons[0])

    // Type in the input
    const input = screen.getByPlaceholderText('Add a pro...')
    fireEvent.change(input, { target: { value: 'New pro note' } })

    // Click Add button
    const addButton = screen.getByRole('button', { name: 'Add' })
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/clients/client-1/listings/unit-1/notes',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ type: 'pro', content: 'New pro note' }),
        })
      )
    })
  })

  it('hides everything in readOnly mode if no notes', () => {
    const { container } = render(
      <ListingNotesPanel
        clientId="client-1"
        unitId="unit-1"
        initialNotes={[]}
        readOnly
      />
    )

    // Panel should be empty in readOnly mode with no notes
    expect(container.textContent).toBe('')
  })

  it('shows notes but hides add buttons in readOnly mode', () => {
    render(
      <ListingNotesPanel
        clientId="client-1"
        unitId="unit-1"
        initialNotes={mockNotes}
        readOnly
      />
    )

    // Notes should be visible
    expect(screen.getByText('Great location')).toBeInTheDocument()

    // Add buttons should not be present
    expect(screen.queryByLabelText(/Add pros/i)).not.toBeInTheDocument()
  })
})
