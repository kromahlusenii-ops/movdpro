'use client'

import { cn } from '@/lib/utils'

interface PreviewTableProps {
  headers: string[]
  rows: string[][]
  mappedFields?: Map<string, string | null>
  highlightColumn?: number
  maxRows?: number
}

export function PreviewTable({
  headers,
  rows,
  mappedFields,
  highlightColumn,
  maxRows = 5,
}: PreviewTableProps) {
  const displayRows = rows.slice(0, maxRows)
  const hasMoreRows = rows.length > maxRows

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm" role="table">
          <thead>
            <tr className="border-b bg-muted/50">
              {headers.map((header, index) => {
                const mappedTo = mappedFields?.get(header)
                const isMapped = mappedTo !== null && mappedTo !== undefined
                const isHighlighted = highlightColumn === index

                return (
                  <th
                    key={index}
                    scope="col"
                    className={cn(
                      'px-3 py-2 text-left font-medium',
                      isHighlighted && 'bg-primary/10',
                      !isMapped && mappedFields && 'text-muted-foreground'
                    )}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="truncate max-w-[150px]">{header}</span>
                      {mappedFields && (
                        <span
                          className={cn(
                            'text-xs font-normal',
                            isMapped ? 'text-primary' : 'text-muted-foreground/60'
                          )}
                        >
                          {isMapped ? `→ ${mappedTo}` : 'Not mapped'}
                        </span>
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  'border-b last:border-0',
                  rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                )}
              >
                {headers.map((header, colIndex) => {
                  const isHighlighted = highlightColumn === colIndex
                  const value = row[colIndex] || ''

                  return (
                    <td
                      key={colIndex}
                      className={cn(
                        'px-3 py-2',
                        isHighlighted && 'bg-primary/5'
                      )}
                    >
                      <span className="truncate block max-w-[150px]" title={value}>
                        {value || <span className="text-muted-foreground/40">—</span>}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMoreRows && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {displayRows.length} of {rows.length} rows
        </p>
      )}
    </div>
  )
}
