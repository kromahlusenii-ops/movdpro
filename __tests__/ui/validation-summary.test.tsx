import { render, screen, fireEvent } from '@testing-library/react'
import { ValidationSummary } from '@/components/features/client-import/ValidationSummary'
import type { ValidationError, DuplicateMatch } from '@/types/client-import'

describe('ValidationSummary', () => {
  const mockOnDuplicateResolution = jest.fn()
  const mockOnBulkDuplicateResolution = jest.fn()

  const errors: ValidationError[] = [
    { row: 2, field: 'email', message: 'Invalid email format', value: 'not-email' },
    { row: 3, field: 'name', message: 'Name is required', value: '' },
  ]

  const duplicates: DuplicateMatch[] = [
    {
      importedRow: { name: 'John Doe', email: 'john@test.com' },
      existingClient: { id: '1', name: 'John D', email: 'john@test.com' },
      rowIndex: 0,
      resolution: null,
    },
    {
      importedRow: { name: 'Jane Smith', email: 'jane@test.com' },
      existingClient: { id: '2', name: 'Jane S', email: 'jane@test.com' },
      rowIndex: 1,
      resolution: 'skip',
    },
  ]

  beforeEach(() => {
    mockOnDuplicateResolution.mockClear()
    mockOnBulkDuplicateResolution.mockClear()
  })

  it('displays summary statistics', () => {
    render(
      <ValidationSummary
        totalRows={10}
        validCount={8}
        errorCount={3}
        errors={errors}
        duplicates={duplicates}
        onDuplicateResolution={mockOnDuplicateResolution}
        onBulkDuplicateResolution={mockOnBulkDuplicateResolution}
      />
    )

    expect(screen.getByText('10')).toBeInTheDocument() // Total
    expect(screen.getByText('8')).toBeInTheDocument() // Valid
    expect(screen.getByText('3')).toBeInTheDocument() // Errors (using 3 to avoid collision with duplicates count)
  })

  it('shows will import count', () => {
    render(
      <ValidationSummary
        totalRows={10}
        validCount={8}
        errorCount={2}
        errors={errors}
        duplicates={duplicates}
        onDuplicateResolution={mockOnDuplicateResolution}
        onBulkDuplicateResolution={mockOnBulkDuplicateResolution}
      />
    )

    // 8 valid - 2 skipped duplicates (one null, one skip) = 6
    expect(screen.getByText(/Ready to import:/)).toBeInTheDocument()
    expect(screen.getByText(/6 clients/)).toBeInTheDocument()
  })

  it('expands error list on click', () => {
    render(
      <ValidationSummary
        totalRows={10}
        validCount={8}
        errorCount={2}
        errors={errors}
        duplicates={[]}
        onDuplicateResolution={mockOnDuplicateResolution}
        onBulkDuplicateResolution={mockOnBulkDuplicateResolution}
      />
    )

    const errorSection = screen.getByText(/Validation Errors/)
    fireEvent.click(errorSection)

    expect(screen.getByText(/Invalid email format/)).toBeInTheDocument()
    expect(screen.getByText(/Name is required/)).toBeInTheDocument()
  })

  it('shows duplicate resolution options', () => {
    render(
      <ValidationSummary
        totalRows={10}
        validCount={8}
        errorCount={0}
        errors={[]}
        duplicates={duplicates}
        onDuplicateResolution={mockOnDuplicateResolution}
        onBulkDuplicateResolution={mockOnBulkDuplicateResolution}
      />
    )

    // Duplicates section should be expanded by default when there are duplicates
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText(/Matches existing client: John D/)).toBeInTheDocument()

    // Should have Skip and Update buttons for each duplicate
    expect(screen.getAllByRole('button', { name: 'Skip' })).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: 'Update' })).toHaveLength(2)
  })

  it('calls onDuplicateResolution when clicking resolution button', () => {
    render(
      <ValidationSummary
        totalRows={10}
        validCount={8}
        errorCount={0}
        errors={[]}
        duplicates={duplicates}
        onDuplicateResolution={mockOnDuplicateResolution}
        onBulkDuplicateResolution={mockOnBulkDuplicateResolution}
      />
    )

    const updateButtons = screen.getAllByRole('button', { name: 'Update' })
    fireEvent.click(updateButtons[0])

    expect(mockOnDuplicateResolution).toHaveBeenCalledWith(0, 'overwrite')
  })

  it('has bulk action buttons for duplicates', () => {
    render(
      <ValidationSummary
        totalRows={10}
        validCount={8}
        errorCount={0}
        errors={[]}
        duplicates={duplicates}
        onDuplicateResolution={mockOnDuplicateResolution}
        onBulkDuplicateResolution={mockOnBulkDuplicateResolution}
      />
    )

    const skipAllButton = screen.getByRole('button', { name: 'Skip All' })
    const updateAllButton = screen.getByRole('button', { name: 'Update All' })

    fireEvent.click(skipAllButton)
    expect(mockOnBulkDuplicateResolution).toHaveBeenCalledWith('skip')

    fireEvent.click(updateAllButton)
    expect(mockOnBulkDuplicateResolution).toHaveBeenCalledWith('overwrite')
  })

  it('handles empty errors and duplicates', () => {
    render(
      <ValidationSummary
        totalRows={5}
        validCount={5}
        errorCount={0}
        errors={[]}
        duplicates={[]}
        onDuplicateResolution={mockOnDuplicateResolution}
        onBulkDuplicateResolution={mockOnBulkDuplicateResolution}
      />
    )

    expect(screen.queryByText(/Validation Errors/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Duplicate Clients/)).not.toBeInTheDocument()
  })
})
