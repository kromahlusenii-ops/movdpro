import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { UploadDropzone } from '@/components/features/client-import/UploadDropzone'

describe('UploadDropzone', () => {
  const mockOnFileSelect = jest.fn()

  beforeEach(() => {
    mockOnFileSelect.mockClear()
  })

  it('renders upload area with instructions', () => {
    render(<UploadDropzone onFileSelect={mockOnFileSelect} />)

    expect(screen.getByText('Drop your file here')).toBeInTheDocument()
    expect(screen.getByText('or click to browse')).toBeInTheDocument()
    expect(screen.getByText(/Supported formats/)).toBeInTheDocument()
  })

  it('shows file info after selection', () => {
    render(<UploadDropzone onFileSelect={mockOnFileSelect} />)

    const file = new File(['test'], 'clients.csv', { type: 'text/csv' })
    const input = screen.getByLabelText('File input')

    fireEvent.change(input, { target: { files: [file] } })

    expect(screen.getByText('clients.csv')).toBeInTheDocument()
    expect(mockOnFileSelect).toHaveBeenCalledWith(file)
  })

  it('validates file type', () => {
    render(<UploadDropzone onFileSelect={mockOnFileSelect} />)

    const file = new File(['test'], 'clients.txt', { type: 'text/plain' })
    const input = screen.getByLabelText('File input')

    fireEvent.change(input, { target: { files: [file] } })

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid file type')
    expect(mockOnFileSelect).not.toHaveBeenCalled()
  })

  it('validates file size', () => {
    render(<UploadDropzone onFileSelect={mockOnFileSelect} maxSizeMB={1} />)

    // Create a mock file larger than 1MB
    const largeContent = 'x'.repeat(2 * 1024 * 1024)
    const file = new File([largeContent], 'large.csv', { type: 'text/csv' })
    const input = screen.getByLabelText('File input')

    fireEvent.change(input, { target: { files: [file] } })

    expect(screen.getByRole('alert')).toHaveTextContent('File too large')
    expect(mockOnFileSelect).not.toHaveBeenCalled()
  })

  it('shows error from props', () => {
    render(
      <UploadDropzone
        onFileSelect={mockOnFileSelect}
        error="Server error occurred"
      />
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Server error occurred')
  })

  it('disables input when loading', () => {
    render(<UploadDropzone onFileSelect={mockOnFileSelect} isLoading />)

    const input = screen.getByLabelText('File input')
    expect(input).toBeDisabled()
  })

  it('allows removing selected file', () => {
    render(<UploadDropzone onFileSelect={mockOnFileSelect} />)

    const file = new File(['test'], 'clients.csv', { type: 'text/csv' })
    const input = screen.getByLabelText('File input')

    fireEvent.change(input, { target: { files: [file] } })
    expect(screen.getByText('clients.csv')).toBeInTheDocument()

    const removeButton = screen.getByLabelText('Remove file')
    fireEvent.click(removeButton)

    expect(screen.queryByText('clients.csv')).not.toBeInTheDocument()
    expect(screen.getByText('Drop your file here')).toBeInTheDocument()
  })

  it('is keyboard accessible', () => {
    render(<UploadDropzone onFileSelect={mockOnFileSelect} />)

    const dropzone = screen.getByRole('button', { name: /upload file dropzone/i })
    expect(dropzone).toHaveAttribute('tabIndex', '0')
  })
})
