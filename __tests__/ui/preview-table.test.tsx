import { render, screen } from '@testing-library/react'
import { PreviewTable } from '@/components/features/client-import/PreviewTable'

describe('PreviewTable', () => {
  const headers = ['Name', 'Email', 'Phone']
  const rows = [
    ['John Doe', 'john@test.com', '555-1234'],
    ['Jane Smith', 'jane@test.com', '555-5678'],
    ['Bob Wilson', 'bob@test.com', '555-9012'],
  ]

  it('renders headers', () => {
    render(<PreviewTable headers={headers} rows={rows} />)

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Phone')).toBeInTheDocument()
  })

  it('renders data rows', () => {
    render(<PreviewTable headers={headers} rows={rows} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@test.com')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })

  it('limits rows to maxRows prop', () => {
    render(<PreviewTable headers={headers} rows={rows} maxRows={2} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument()
    expect(screen.getByText('Showing 2 of 3 rows')).toBeInTheDocument()
  })

  it('shows mapping status for headers', () => {
    const mappedFields = new Map([
      ['Name', 'name'],
      ['Email', 'email'],
      ['Phone', null],
    ])

    render(
      <PreviewTable
        headers={headers}
        rows={rows}
        mappedFields={mappedFields}
      />
    )

    expect(screen.getByText('→ name')).toBeInTheDocument()
    expect(screen.getByText('→ email')).toBeInTheDocument()
    expect(screen.getByText('Not mapped')).toBeInTheDocument()
  })

  it('handles empty values', () => {
    const rowsWithEmpty = [
      ['John', '', '555-1234'],
    ]

    render(<PreviewTable headers={headers} rows={rowsWithEmpty} />)

    // Should show placeholder for empty cell
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('has accessible table structure', () => {
    render(<PreviewTable headers={headers} rows={rows} />)

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getAllByRole('columnheader')).toHaveLength(3)
    expect(screen.getAllByRole('row')).toHaveLength(4) // 1 header + 3 data
  })
})
