import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EditableField } from '@/components/listings/EditableField'
import { AuditLabel } from '@/components/listings/AuditLabel'
import type { FieldEditRecord } from '@/types/field-edits'

// Mock fetch for API calls
global.fetch = jest.fn()

const mockEdit: FieldEditRecord = {
  id: 'edit-1',
  unitId: 'unit-1',
  buildingId: null,
  fieldName: 'rentMin',
  previousValue: 1400,
  newValue: 1500,
  source: 'locator',
  editedBy: {
    id: 'locator-1',
    firstName: 'Melissa',
    lastName: 'Parker',
  },
  hasConflict: false,
  conflictValue: null,
  createdAt: new Date(),
}

describe('EditableField', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ edit: mockEdit }),
    })
  })

  it('renders the current value with label', () => {
    render(
      <EditableField
        targetType="unit"
        targetId="unit-1"
        fieldName="rentMin"
        label="Rent (Min)"
        type="number"
        currentValue={1500}
        lastEdit={null}
        prefix="$"
        suffix="/mo"
      />
    )

    expect(screen.getByText('Rent (Min)')).toBeInTheDocument()
    expect(screen.getByText('$1,500/mo')).toBeInTheDocument()
  })

  it('renders "Not set" for null values', () => {
    render(
      <EditableField
        targetType="building"
        targetId="building-1"
        fieldName="deposit"
        label="Security Deposit"
        type="number"
        currentValue={null}
        lastEdit={null}
        prefix="$"
      />
    )

    expect(screen.getByText('Not set')).toBeInTheDocument()
  })

  it('shows pencil icon on hover', async () => {
    render(
      <EditableField
        targetType="unit"
        targetId="unit-1"
        fieldName="rentMin"
        label="Rent (Min)"
        type="number"
        currentValue={1500}
        lastEdit={null}
      />
    )

    const editButton = screen.getByRole('button', { name: /edit rent/i })
    // Button exists but may have opacity-0 by default
    expect(editButton).toBeInTheDocument()
  })

  it('switches to edit mode when clicking pencil', async () => {
    render(
      <EditableField
        targetType="unit"
        targetId="unit-1"
        fieldName="rentMin"
        label="Rent (Min)"
        type="number"
        currentValue={1500}
        lastEdit={null}
      />
    )

    const editButton = screen.getByRole('button', { name: /edit rent/i })
    fireEvent.click(editButton)

    // Should show input field
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })
    expect(screen.getByRole('textbox')).toHaveValue('1500')
  })

  it('saves edit on Enter key', async () => {
    render(
      <EditableField
        targetType="unit"
        targetId="unit-1"
        fieldName="rentMin"
        label="Rent (Min)"
        type="number"
        currentValue={1500}
        lastEdit={null}
      />
    )

    // Enter edit mode
    const editButton = screen.getByRole('button', { name: /edit rent/i })
    fireEvent.click(editButton)

    // Wait for input to appear then change value
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '1600' } })
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/field-edits', expect.objectContaining({
        method: 'POST',
      }))
    })
  })

  it('cancels edit on Escape key', async () => {
    render(
      <EditableField
        targetType="unit"
        targetId="unit-1"
        fieldName="rentMin"
        label="Rent (Min)"
        type="number"
        currentValue={1500}
        lastEdit={null}
      />
    )

    // Enter edit mode
    const editButton = screen.getByRole('button', { name: /edit rent/i })
    fireEvent.click(editButton)

    // Wait for input to appear
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    // Type new value then cancel
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '9999' } })
    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' })

    // Should return to display mode with original value
    await waitFor(() => {
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })
    // Without prefix, just shows the number
    expect(screen.getByText('1,500')).toBeInTheDocument()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('shows validation error for invalid number', async () => {
    render(
      <EditableField
        targetType="unit"
        targetId="unit-1"
        fieldName="rentMin"
        label="Rent (Min)"
        type="number"
        currentValue={1500}
        lastEdit={null}
      />
    )

    // Enter edit mode
    const editButton = screen.getByRole('button', { name: /edit rent/i })
    fireEvent.click(editButton)

    // Wait for input to appear
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    // Type invalid value
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'not a number' } })
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid number')).toBeInTheDocument()
    })
    expect(global.fetch).not.toHaveBeenCalled()
  })
})

describe('AuditLabel', () => {
  it('renders nothing when no edit exists', () => {
    const { container } = render(<AuditLabel lastEdit={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows "Verified by" for locator edits', () => {
    render(<AuditLabel lastEdit={mockEdit} />)
    expect(screen.getByText(/Verified by Melissa P\./)).toBeInTheDocument()
  })

  it('shows "Auto-updated" for scraper edits', () => {
    const scraperEdit: FieldEditRecord = {
      ...mockEdit,
      source: 'scraper',
      editedBy: null,
    }

    render(<AuditLabel lastEdit={scraperEdit} />)
    expect(screen.getByText(/Auto-updated/)).toBeInTheDocument()
  })

  it('shows conflict indicator when hasConflict is true', () => {
    const conflictEdit: FieldEditRecord = {
      ...mockEdit,
      hasConflict: true,
      conflictValue: 1450,
    }

    render(<AuditLabel lastEdit={conflictEdit} />)
    // Should have amber-colored indicator
    const label = screen.getByRole('button')
    expect(label).toHaveClass('text-amber-600')
  })

  it('calls onClick when clicked', async () => {
    const handleClick = jest.fn()

    render(<AuditLabel lastEdit={mockEdit} onClick={handleClick} />)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalled()
  })

  it('shows relative time for recent edits', () => {
    const recentEdit: FieldEditRecord = {
      ...mockEdit,
      createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    }

    render(<AuditLabel lastEdit={recentEdit} />)
    expect(screen.getByText(/5 minutes ago/)).toBeInTheDocument()
  })
})
