import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QuickAddNotesModal } from '@/components/features/listing-notes/QuickAddNotesModal'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('QuickAddNotesModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    clientId: 'client-1',
    unitId: 'unit-1',
    buildingName: 'Test Building',
  }

  beforeEach(() => {
    mockFetch.mockClear()
    defaultProps.onClose.mockClear()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ note: {} }),
    })
  })

  it('renders when isOpen is true', () => {
    render(<QuickAddNotesModal {...defaultProps} />)

    expect(screen.getByText('Add Notes')).toBeInTheDocument()
    expect(screen.getByText('Test Building')).toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    render(<QuickAddNotesModal {...defaultProps} isOpen={false} />)

    expect(screen.queryByText('Add Notes')).not.toBeInTheDocument()
  })

  it('shows three input sections: Pros, Cons, Notes', () => {
    render(<QuickAddNotesModal {...defaultProps} />)

    expect(screen.getByText('Pros')).toBeInTheDocument()
    expect(screen.getByText('Cons')).toBeInTheDocument()
    expect(screen.getByText('Notes')).toBeInTheDocument()
  })

  it('has input fields for each section', () => {
    render(<QuickAddNotesModal {...defaultProps} />)

    expect(screen.getByPlaceholderText(/Great location/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Street noise/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Ask about/i)).toBeInTheDocument()
  })

  it('adds note to pending list when clicking add button', () => {
    render(<QuickAddNotesModal {...defaultProps} />)

    const proInput = screen.getByPlaceholderText(/Great location/i)
    fireEvent.change(proInput, { target: { value: 'Nice pool' } })

    const addButton = screen.getAllByLabelText('Add pro')[0]
    fireEvent.click(addButton)

    expect(screen.getByText('Nice pool')).toBeInTheDocument()
  })

  it('adds note when pressing Enter', () => {
    render(<QuickAddNotesModal {...defaultProps} />)

    const proInput = screen.getByPlaceholderText(/Great location/i)
    fireEvent.change(proInput, { target: { value: 'Nice pool' } })
    fireEvent.keyDown(proInput, { key: 'Enter' })

    expect(screen.getByText('Nice pool')).toBeInTheDocument()
  })

  it('removes pending note when clicking X', () => {
    render(<QuickAddNotesModal {...defaultProps} />)

    // Add a note first
    const proInput = screen.getByPlaceholderText(/Great location/i)
    fireEvent.change(proInput, { target: { value: 'Nice pool' } })
    fireEvent.keyDown(proInput, { key: 'Enter' })

    expect(screen.getByText('Nice pool')).toBeInTheDocument()

    // Remove it
    const removeButton = screen.getByLabelText('Remove')
    fireEvent.click(removeButton)

    expect(screen.queryByText('Nice pool')).not.toBeInTheDocument()
  })

  it('calls onClose when clicking Skip', () => {
    render(<QuickAddNotesModal {...defaultProps} />)

    const skipButton = screen.getByRole('button', { name: 'Skip' })
    fireEvent.click(skipButton)

    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('calls onClose when clicking backdrop', () => {
    render(<QuickAddNotesModal {...defaultProps} />)

    // Click backdrop (the overlay div)
    const backdrop = document.querySelector('.bg-black\\/50')
    fireEvent.click(backdrop!)

    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('saves notes and closes on Save click', async () => {
    render(<QuickAddNotesModal {...defaultProps} />)

    // Add a note
    const proInput = screen.getByPlaceholderText(/Great location/i)
    fireEvent.change(proInput, { target: { value: 'Nice pool' } })
    fireEvent.keyDown(proInput, { key: 'Enter' })

    // Add another note
    const conInput = screen.getByPlaceholderText(/Street noise/i)
    fireEvent.change(conInput, { target: { value: 'Small kitchen' } })
    fireEvent.keyDown(conInput, { key: 'Enter' })

    // Click save
    const saveButton = screen.getByRole('button', { name: /Save 2 Notes/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(defaultProps.onClose).toHaveBeenCalled()
    })
  })

  it('shows Done button when no notes are pending', () => {
    render(<QuickAddNotesModal {...defaultProps} />)

    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument()
  })

  it('shows Save N Notes button when notes are pending', () => {
    render(<QuickAddNotesModal {...defaultProps} />)

    // Add a note
    const proInput = screen.getByPlaceholderText(/Great location/i)
    fireEvent.change(proInput, { target: { value: 'Nice pool' } })
    fireEvent.keyDown(proInput, { key: 'Enter' })

    expect(screen.getByRole('button', { name: 'Save 1 Note' })).toBeInTheDocument()
  })

  it('disables add button when input is empty', () => {
    render(<QuickAddNotesModal {...defaultProps} />)

    const addButton = screen.getAllByLabelText('Add pro')[0]
    expect(addButton).toHaveClass('cursor-not-allowed')
  })
})
