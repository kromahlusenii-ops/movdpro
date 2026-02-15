import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EditableArrayField } from '@/components/clients/EditableArrayField'
import type { ClientFieldEditRecord } from '@/types/client-edits'

// Mock fetch for API calls
global.fetch = jest.fn()

const mockOptions = [
  { id: 'studio', label: 'Studio' },
  { id: '1br', label: '1 Bedroom' },
  { id: '2br', label: '2 Bedrooms' },
  { id: '3br+', label: '3+ Bedrooms' },
]

const mockEdit: ClientFieldEditRecord = {
  id: 'edit-1',
  clientId: 'client-1',
  fieldName: 'bedrooms',
  previousValue: ['1br'],
  newValue: ['1br', '2br'],
  editedBy: {
    id: 'locator-1',
    firstName: 'Melissa',
    lastName: 'Parker',
  },
  createdAt: new Date(),
}

describe('EditableArrayField', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/history')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ edits: { bedrooms: mockEdit } }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ client: {}, preferencesChanged: true }),
      })
    })
  })

  it('renders current values as tags', () => {
    render(
      <EditableArrayField
        clientId="client-1"
        fieldName="bedrooms"
        label="Bedrooms"
        currentValue={['1br', '2br']}
        options={mockOptions}
        lastEdit={null}
      />
    )

    expect(screen.getByText('Bedrooms')).toBeInTheDocument()
    expect(screen.getByText('1 Bedroom')).toBeInTheDocument()
    expect(screen.getByText('2 Bedrooms')).toBeInTheDocument()
  })

  it('renders "Not specified" for empty array', () => {
    render(
      <EditableArrayField
        clientId="client-1"
        fieldName="bedrooms"
        label="Bedrooms"
        currentValue={[]}
        options={mockOptions}
        lastEdit={null}
      />
    )

    expect(screen.getByText('Not specified')).toBeInTheDocument()
  })

  it('shows pencil icon on hover', () => {
    render(
      <EditableArrayField
        clientId="client-1"
        fieldName="bedrooms"
        label="Bedrooms"
        currentValue={['1br']}
        options={mockOptions}
        lastEdit={null}
      />
    )

    const editButton = screen.getByRole('button', { name: /edit bedrooms/i })
    expect(editButton).toBeInTheDocument()
  })

  it('switches to edit mode showing all options', async () => {
    render(
      <EditableArrayField
        clientId="client-1"
        fieldName="bedrooms"
        label="Bedrooms"
        currentValue={['1br']}
        options={mockOptions}
        lastEdit={null}
      />
    )

    const editButton = screen.getByRole('button', { name: /edit bedrooms/i })
    fireEvent.click(editButton)

    await waitFor(() => {
      // All options should be visible
      expect(screen.getByRole('button', { name: 'Studio' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '1 Bedroom' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '2 Bedrooms' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '3+ Bedrooms' })).toBeInTheDocument()
    })
  })

  it('toggles selection when clicking options', async () => {
    render(
      <EditableArrayField
        clientId="client-1"
        fieldName="bedrooms"
        label="Bedrooms"
        currentValue={['1br']}
        options={mockOptions}
        lastEdit={null}
      />
    )

    // Enter edit mode
    const editButton = screen.getByRole('button', { name: /edit bedrooms/i })
    fireEvent.click(editButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '2 Bedrooms' })).toBeInTheDocument()
    })

    // Click to add 2br
    fireEvent.click(screen.getByRole('button', { name: '2 Bedrooms' }))

    // Click save
    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/clients/client-1',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('"bedrooms"'),
        })
      )
    })

    // Verify the body contains both values
    const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
    expect(callBody.bedrooms).toContain('1br')
    expect(callBody.bedrooms).toContain('2br')
  })

  it('cancels edit when clicking cancel button', async () => {
    render(
      <EditableArrayField
        clientId="client-1"
        fieldName="bedrooms"
        label="Bedrooms"
        currentValue={['1br']}
        options={mockOptions}
        lastEdit={null}
      />
    )

    // Enter edit mode
    const editButton = screen.getByRole('button', { name: /edit bedrooms/i })
    fireEvent.click(editButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '2 Bedrooms' })).toBeInTheDocument()
    })

    // Toggle some selections
    fireEvent.click(screen.getByRole('button', { name: '2 Bedrooms' }))
    fireEvent.click(screen.getByRole('button', { name: '3+ Bedrooms' }))

    // Click cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    // Should return to display mode with original value
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument()
    })
    expect(screen.getByText('1 Bedroom')).toBeInTheDocument()
    expect(screen.queryByText('2 Bedrooms')).not.toBeInTheDocument()
  })

  it('calls onSave callback with preferencesChanged flag', async () => {
    const onSave = jest.fn()

    render(
      <EditableArrayField
        clientId="client-1"
        fieldName="bedrooms"
        label="Bedrooms"
        currentValue={['1br']}
        options={mockOptions}
        lastEdit={null}
        onSave={onSave}
      />
    )

    // Enter edit mode
    const editButton = screen.getByRole('button', { name: /edit bedrooms/i })
    fireEvent.click(editButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '2 Bedrooms' })).toBeInTheDocument()
    })

    // Add selection
    fireEvent.click(screen.getByRole('button', { name: '2 Bedrooms' }))

    // Save
    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.arrayContaining(['1br', '2br']),
        true
      )
    })
  })

  it('does not save when values have not changed', async () => {
    render(
      <EditableArrayField
        clientId="client-1"
        fieldName="bedrooms"
        label="Bedrooms"
        currentValue={['1br']}
        options={mockOptions}
        lastEdit={null}
      />
    )

    // Enter edit mode
    const editButton = screen.getByRole('button', { name: /edit bedrooms/i })
    fireEvent.click(editButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    })

    // Save without changes
    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)

    // Should not call API
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument()
    })
    expect(global.fetch).not.toHaveBeenCalledWith(
      '/api/clients/client-1',
      expect.objectContaining({ method: 'PATCH' })
    )
  })
})
