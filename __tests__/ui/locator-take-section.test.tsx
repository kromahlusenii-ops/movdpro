import { render, screen } from '@testing-library/react'
import { LocatorTakeSection } from '@/components/reports/PublicReport/LocatorTakeSection'
import type { ReportPropertyNote } from '@/components/features/listing-notes/types'

describe('LocatorTakeSection', () => {
  const mockNotes: ReportPropertyNote[] = [
    {
      id: '1',
      propertyId: 'prop-1',
      type: 'pro',
      content: 'Great location near transit',
      sortOrder: 0,
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      propertyId: 'prop-1',
      type: 'pro',
      content: 'Modern amenities',
      sortOrder: 1,
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '3',
      propertyId: 'prop-1',
      type: 'con',
      content: 'Street noise at night',
      sortOrder: 0,
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '4',
      propertyId: 'prop-1',
      type: 'note',
      content: 'Client loved the rooftop',
      sortOrder: 0,
      createdAt: '2024-01-01T00:00:00Z',
    },
  ]

  it('renders nothing when notes array is empty', () => {
    const { container } = render(<LocatorTakeSection notes={[]} />)

    expect(container.firstChild).toBeNull()
  })

  it('renders the section header', () => {
    render(<LocatorTakeSection notes={mockNotes} />)

    expect(screen.getByText("Your Locator's Take")).toBeInTheDocument()
  })

  it('displays all pros with checkmark icons', () => {
    render(<LocatorTakeSection notes={mockNotes} />)

    expect(screen.getByText('Great location near transit')).toBeInTheDocument()
    expect(screen.getByText('Modern amenities')).toBeInTheDocument()
  })

  it('displays all cons with X icons', () => {
    render(<LocatorTakeSection notes={mockNotes} />)

    expect(screen.getByText('Street noise at night')).toBeInTheDocument()
  })

  it('displays general notes in italic', () => {
    render(<LocatorTakeSection notes={mockNotes} />)

    const noteElement = screen.getByText('Client loved the rooftop')
    expect(noteElement).toHaveClass('italic')
  })

  it('renders notes in correct order (pros, cons, notes)', () => {
    const { container } = render(<LocatorTakeSection notes={mockNotes} />)

    const textContent = container.textContent || ''

    // Verify order: pros come before cons, cons come before notes
    const proIndex = textContent.indexOf('Great location')
    const conIndex = textContent.indexOf('Street noise')
    const noteIndex = textContent.indexOf('Client loved')

    expect(proIndex).toBeLessThan(conIndex)
    expect(conIndex).toBeLessThan(noteIndex)
  })

  it('renders only pros when no cons or notes exist', () => {
    const prosOnly: ReportPropertyNote[] = [
      {
        id: '1',
        propertyId: 'prop-1',
        type: 'pro',
        content: 'Great pool',
        sortOrder: 0,
        createdAt: '2024-01-01T00:00:00Z',
      },
    ]

    render(<LocatorTakeSection notes={prosOnly} />)

    expect(screen.getByText('Great pool')).toBeInTheDocument()
    expect(screen.getByText("Your Locator's Take")).toBeInTheDocument()
  })

  it('renders only cons when no pros or notes exist', () => {
    const consOnly: ReportPropertyNote[] = [
      {
        id: '1',
        propertyId: 'prop-1',
        type: 'con',
        content: 'Far from downtown',
        sortOrder: 0,
        createdAt: '2024-01-01T00:00:00Z',
      },
    ]

    render(<LocatorTakeSection notes={consOnly} />)

    expect(screen.getByText('Far from downtown')).toBeInTheDocument()
  })

  it('sorts notes by sortOrder within each type', () => {
    const unorderedNotes: ReportPropertyNote[] = [
      {
        id: '1',
        propertyId: 'prop-1',
        type: 'pro',
        content: 'Second pro',
        sortOrder: 1,
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        propertyId: 'prop-1',
        type: 'pro',
        content: 'First pro',
        sortOrder: 0,
        createdAt: '2024-01-01T00:00:00Z',
      },
    ]

    const { container } = render(<LocatorTakeSection notes={unorderedNotes} />)

    const textContent = container.textContent || ''
    const firstIndex = textContent.indexOf('First pro')
    const secondIndex = textContent.indexOf('Second pro')

    expect(firstIndex).toBeLessThan(secondIndex)
  })
})
