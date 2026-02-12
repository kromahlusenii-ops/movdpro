import { render, screen, fireEvent } from '@testing-library/react'
import { ColumnMappingPanel } from '@/components/features/client-import/ColumnMappingPanel'
import type { ColumnMapping } from '@/types/client-import'

describe('ColumnMappingPanel', () => {
  const mockOnMappingChange = jest.fn()
  const mockOnColumnHover = jest.fn()

  const defaultMappings: ColumnMapping[] = [
    { sourceColumn: 'Full Name', targetField: 'name', confidence: 0.95 },
    { sourceColumn: 'Email Address', targetField: 'email', confidence: 1.0 },
    { sourceColumn: 'Unknown Column', targetField: null, confidence: 0 },
  ]

  beforeEach(() => {
    mockOnMappingChange.mockClear()
    mockOnColumnHover.mockClear()
  })

  it('renders all column mappings', () => {
    render(
      <ColumnMappingPanel
        mappings={defaultMappings}
        onMappingChange={mockOnMappingChange}
      />
    )

    expect(screen.getByText('Full Name')).toBeInTheDocument()
    expect(screen.getByText('Email Address')).toBeInTheDocument()
    expect(screen.getByText('Unknown Column')).toBeInTheDocument()
  })

  it('shows mapped field names', () => {
    render(
      <ColumnMappingPanel
        mappings={defaultMappings}
        onMappingChange={mockOnMappingChange}
      />
    )

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it('shows confidence score for fuzzy matches', () => {
    render(
      <ColumnMappingPanel
        mappings={defaultMappings}
        onMappingChange={mockOnMappingChange}
      />
    )

    expect(screen.getByText('95% match confidence')).toBeInTheDocument()
  })

  it('shows warning for unmapped required fields', () => {
    const mappingsWithoutName: ColumnMapping[] = [
      { sourceColumn: 'Email', targetField: 'email', confidence: 1.0 },
    ]

    render(
      <ColumnMappingPanel
        mappings={mappingsWithoutName}
        onMappingChange={mockOnMappingChange}
      />
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Required fields not mapped')
    expect(screen.getByRole('alert')).toHaveTextContent('Name')
  })

  it('opens dropdown on button click', () => {
    render(
      <ColumnMappingPanel
        mappings={defaultMappings}
        onMappingChange={mockOnMappingChange}
      />
    )

    const nameButton = screen.getAllByRole('button')[0]
    fireEvent.click(nameButton)

    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByText("Don't import")).toBeInTheDocument()
  })

  it('calls onMappingChange when field selected', () => {
    render(
      <ColumnMappingPanel
        mappings={defaultMappings}
        onMappingChange={mockOnMappingChange}
      />
    )

    // Open dropdown for unmapped column
    const buttons = screen.getAllByRole('button', { expanded: false })
    const unmappedButton = buttons[2] // Unknown Column
    fireEvent.click(unmappedButton)

    // Select phone field
    fireEvent.click(screen.getByRole('option', { name: /Phone/i }))

    expect(mockOnMappingChange).toHaveBeenCalledWith('Unknown Column', 'phone')
  })

  it('calls onColumnHover on mouse events', () => {
    render(
      <ColumnMappingPanel
        mappings={defaultMappings}
        onMappingChange={mockOnMappingChange}
        onColumnHover={mockOnColumnHover}
      />
    )

    const firstMapping = screen.getByText('Full Name').closest('div[class*="rounded-lg border"]')
    if (firstMapping) {
      fireEvent.mouseEnter(firstMapping)
      expect(mockOnColumnHover).toHaveBeenCalledWith(0)

      fireEvent.mouseLeave(firstMapping)
      expect(mockOnColumnHover).toHaveBeenCalledWith(null)
    }
  })

  it('disables already-mapped fields in dropdown', () => {
    render(
      <ColumnMappingPanel
        mappings={defaultMappings}
        onMappingChange={mockOnMappingChange}
      />
    )

    // Open dropdown for unmapped column
    const buttons = screen.getAllByRole('button', { expanded: false })
    fireEvent.click(buttons[2])

    // Name and Email should be disabled since they're already mapped
    const nameOption = screen.getByRole('option', { name: 'Name' })
    expect(nameOption).toHaveAttribute('disabled')
  })
})
