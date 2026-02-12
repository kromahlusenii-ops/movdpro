'use client'

import { useState } from 'react'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ValidationError, DuplicateMatch, ParsedClientRow } from '@/types/client-import'

interface ValidationSummaryProps {
  totalRows: number
  validCount: number
  errorCount: number
  errors: ValidationError[]
  duplicates: DuplicateMatch[]
  onDuplicateResolution: (rowIndex: number, resolution: 'skip' | 'overwrite') => void
  onBulkDuplicateResolution: (resolution: 'skip' | 'overwrite') => void
}

export function ValidationSummary({
  totalRows,
  validCount,
  errorCount,
  errors,
  duplicates,
  onDuplicateResolution,
  onBulkDuplicateResolution,
}: ValidationSummaryProps) {
  const [showErrors, setShowErrors] = useState(false)
  const [showDuplicates, setShowDuplicates] = useState(duplicates.length > 0)

  const willImport = validCount - duplicates.filter((d) => d.resolution === 'skip' || d.resolution === null).length

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="h-4 w-4" />
            <span className="text-sm">Total Rows</span>
          </div>
          <p className="text-2xl font-semibold">{totalRows}</p>
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm">Valid</span>
          </div>
          <p className="text-2xl font-semibold text-green-600">{validCount}</p>
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-destructive mb-1">
            <XCircle className="h-4 w-4" />
            <span className="text-sm">Errors</span>
          </div>
          <p className="text-2xl font-semibold text-destructive">{errorCount}</p>
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-yellow-600 mb-1">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">Duplicates</span>
          </div>
          <p className="text-2xl font-semibold text-yellow-600">{duplicates.length}</p>
        </div>
      </div>

      {/* Will Import Summary */}
      <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
        <p className="text-lg font-medium">
          Ready to import: <span className="text-primary">{willImport} clients</span>
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {duplicates.filter((d) => d.resolution === 'skip' || d.resolution === null).length > 0 &&
            `${duplicates.filter((d) => d.resolution === 'skip' || d.resolution === null).length} duplicates will be skipped. `}
          {duplicates.filter((d) => d.resolution === 'overwrite').length > 0 &&
            `${duplicates.filter((d) => d.resolution === 'overwrite').length} existing clients will be updated. `}
          {errorCount > 0 && `${errorCount} rows with errors will be skipped.`}
        </p>
      </div>

      {/* Errors Section */}
      {errors.length > 0 && (
        <div className="rounded-lg border">
          <button
            type="button"
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50"
            onClick={() => setShowErrors(!showErrors)}
            aria-expanded={showErrors}
          >
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="font-medium">Validation Errors ({errors.length})</span>
            </div>
            {showErrors ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {showErrors && (
            <div className="border-t p-4 space-y-2 max-h-60 overflow-auto">
              {errors.slice(0, 50).map((error, index) => (
                <div
                  key={index}
                  className="text-sm flex items-start gap-2 p-2 bg-destructive/5 rounded"
                >
                  <span className="text-muted-foreground shrink-0">Row {error.row}:</span>
                  <span>
                    <span className="font-medium">{error.field}</span> - {error.message}
                    {error.value && (
                      <span className="text-muted-foreground"> (value: &quot;{error.value}&quot;)</span>
                    )}
                  </span>
                </div>
              ))}
              {errors.length > 50 && (
                <p className="text-sm text-muted-foreground text-center">
                  ...and {errors.length - 50} more errors
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Duplicates Section */}
      {duplicates.length > 0 && (
        <div className="rounded-lg border">
          <button
            type="button"
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50"
            onClick={() => setShowDuplicates(!showDuplicates)}
            aria-expanded={showDuplicates}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="font-medium">Duplicate Clients ({duplicates.length})</span>
            </div>
            {showDuplicates ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {showDuplicates && (
            <div className="border-t">
              {/* Bulk Actions */}
              <div className="p-3 bg-muted/30 flex items-center justify-between gap-4 border-b">
                <span className="text-sm text-muted-foreground">Apply to all:</span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onBulkDuplicateResolution('skip')}
                  >
                    Skip All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onBulkDuplicateResolution('overwrite')}
                  >
                    Update All
                  </Button>
                </div>
              </div>

              {/* Individual Duplicates */}
              <div className="divide-y max-h-80 overflow-auto">
                {duplicates.map((duplicate) => (
                  <div key={duplicate.rowIndex} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {duplicate.importedRow.name}
                          <span className="text-muted-foreground font-normal ml-2">
                            ({duplicate.importedRow.email})
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Matches existing client: {duplicate.existingClient.name}
                        </p>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <Button
                          type="button"
                          variant={duplicate.resolution === 'skip' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => onDuplicateResolution(duplicate.rowIndex, 'skip')}
                        >
                          Skip
                        </Button>
                        <Button
                          type="button"
                          variant={duplicate.resolution === 'overwrite' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => onDuplicateResolution(duplicate.rowIndex, 'overwrite')}
                        >
                          Update
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
