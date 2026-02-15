import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EditableClientField } from '@/components/clients/EditableClientField'
import { ClientAuditLabel } from '@/components/clients/ClientAuditLabel'
import type { ClientFieldEditRecord } from '@/types/client-edits'

// Mock fetch for API calls
global.fetch = jest.fn()

const mockEdit: ClientFieldEditRecord = {
  id: 'edit-1',
  clientId: 'client-1',
  fieldName: 'budgetMin',
  previousValue: 1400,
  newValue: 1500,
  editedBy: {
    id: 'locator-1',
    firstName: 'Melissa',
    lastName: 'Parker',
  },
  createdAt: new Date(),
}

describe('EditableClientField', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/history')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ edits: { budgetMin: mockEdit } }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ client: {}, preferencesChanged: false }),
      })
    })
  })

  it('renders the current value with label', () => {
    render(
      <EditableClientField
        clientId="client-1"
        fieldName="budgetMin"
        label="Min Budget"
        type="number"
        currentValue={1500}
        lastEdit={null}
        prefix="$"
      />
    )

    expect(screen.getByText('Min Budget')).toBeInTheDocument()
    expect(screen.getByText('$1,500')).toBeInTheDocument()
  })

  it('renders "Not set" for null values', () => {
    render(
      <EditableClientField
        clientId="client-1"
        fieldName="budgetMin"
        label="Min Budget"
        type="number"
        currentValue={null}
        lastEdit={null}
        prefix="$"
      />
    )

    expect(screen.getByText('Not set')).toBeInTheDocument()
  })

  it('shows pencil icon on hover', () => {
    render(
      <EditableClientField
        clientId="client-1"
        fieldName="budgetMin"
        label="Min Budget"
        type="number"
        currentValue={1500}
        lastEdit={null}
      />
    )

    const editButton = screen.getByRole('button', { name: /edit min budget/i })
    expect(editButton).toBeInTheDocument()
  })

  it('switches to edit mode when clicking pencil', async () => {
    render(
      <EditableClientField
        clientId="client-1"
        fieldName="budgetMin"
        label="Min Budget"
        type="number"
        currentValue={1500}
        lastEdit={null}
      />
    )

    const editButton = screen.getByRole('button', { name: /edit min budget/i })
    fireEvent.click(editButton)

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })
    expect(screen.getByRole('textbox')).toHaveValue('1500')
  })

  it('saves edit on Enter key', async () => {
    render(
      <EditableClientField
        clientId="client-1"
        fieldName="budgetMin"
        label="Min Budget"
        type="number"
        currentValue={1500}
        lastEdit={null}
      />
    )

    const editButton = screen.getByRole('button', { name: /edit min budget/i })
    fireEvent.click(editButton)

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '1600' } })
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/clients/client-1',
        expect.objectContaining({
          method: 'PATCH',
        })
      )
    })
  })

  it('cancels edit on Escape key', async () => {
    render(
      <EditableClientField
        clientId="client-1"
        fieldName="budgetMin"
        label="Min Budget"
        type="number"
        currentValue={1500}
        lastEdit={null}
      />
    )

    const editButton = screen.getByRole('button', { name: /edit min budget/i })
    fireEvent.click(editButton)

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '9999' } })
    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' })

    await waitFor(() => {
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })
    expect(screen.getByText('1,500')).toBeInTheDocument()
    // PATCH should not be called on cancel
    expect(global.fetch).not.toHaveBeenCalledWith(
      '/api/clients/client-1',
      expect.objectContaining({ method: 'PATCH' })
    )
  })

  it('shows validation error for invalid number', async () => {
    render(
      <EditableClientField
        clientId="client-1"
        fieldName="budgetMin"
        label="Min Budget"
        type="number"
        currentValue={1500}
        lastEdit={null}
      />
    )

    const editButton = screen.getByRole('button', { name: /edit min budget/i })
    fireEvent.click(editButton)

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'not a number' } })
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid number')).toBeInTheDocument()
    })
  })

  it('calls onSave callback with preferencesChanged flag', async () => {
    const onSave = jest.fn()
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/history')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ edits: {} }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ client: {}, preferencesChanged: true }),
      })
    })

    render(
      <EditableClientField
        clientId="client-1"
        fieldName="budgetMin"
        label="Min Budget"
        type="number"
        currentValue={1500}
        lastEdit={null}
        onSave={onSave}
      />
    )

    const editButton = screen.getByRole('button', { name: /edit min budget/i })
    fireEvent.click(editButton)

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '1600' } })
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(1600, true)
    })
  })
})

describe('ClientAuditLabel', () => {
  it('renders nothing when no edit exists', () => {
    const { container } = render(<ClientAuditLabel lastEdit={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows "Edited by" with editor name', () => {
    render(<ClientAuditLabel lastEdit={mockEdit} />)
    expect(screen.getByText(/Edited by Melissa P\./)).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<ClientAuditLabel lastEdit={mockEdit} onClick={handleClick} />)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalled()
  })

  it('shows relative time for recent edits', () => {
    const recentEdit: ClientFieldEditRecord = {
      ...mockEdit,
      createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    }

    render(<ClientAuditLabel lastEdit={recentEdit} />)
    expect(screen.getByText(/5 minutes ago/)).toBeInTheDocument()
  })
})
