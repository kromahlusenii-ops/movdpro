'use client'

import { useState } from 'react'
import { Check, ChevronDown, AlertCircle, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ColumnMapping } from '@/types/client-import'
import { MAPPABLE_FIELDS } from '@/types/client-import'

interface ColumnMappingPanelProps {
  mappings: ColumnMapping[]
  onMappingChange: (sourceColumn: string, targetField: string | null) => void
  onColumnHover?: (columnIndex: number | null) => void
}

export function ColumnMappingPanel({
  mappings,
  onMappingChange,
  onColumnHover,
}: ColumnMappingPanelProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const mappedTargets = new Set(
    mappings.filter((m) => m.targetField).map((m) => m.targetField)
  )

  const requiredFields = MAPPABLE_FIELDS.filter((f) => f.required)
  const unmappedRequired = requiredFields.filter((f) => !mappedTargets.has(f.key))

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600'
    if (confidence >= 0.7) return 'text-yellow-600'
    if (confidence >= 0.4) return 'text-orange-500'
    return 'text-muted-foreground'
  }

  const handleSelectField = (sourceColumn: string, targetField: string | null) => {
    onMappingChange(sourceColumn, targetField)
    setOpenDropdown(null)
  }

  return (
    <div className="space-y-4">
      {unmappedRequired.length > 0 && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-3"
        >
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-destructive">Required fields not mapped</p>
            <p className="text-muted-foreground">
              Please map: {unmappedRequired.map((f) => f.label).join(', ')}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {mappings.map((mapping, index) => (
          <div
            key={mapping.sourceColumn}
            className="flex items-center gap-3 rounded-lg border p-3"
            onMouseEnter={() => onColumnHover?.(index)}
            onMouseLeave={() => onColumnHover?.(null)}
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{mapping.sourceColumn}</p>
              {mapping.confidence > 0 && mapping.confidence < 1 && (
                <p className={cn('text-xs', getConfidenceColor(mapping.confidence))}>
                  {Math.round(mapping.confidence * 100)}% match confidence
                </p>
              )}
            </div>

            <div className="text-muted-foreground">→</div>

            <div className="relative w-48">
              <Button
                type="button"
                variant="outline"
                className={cn(
                  'w-full justify-between',
                  mapping.targetField && 'text-primary border-primary/50'
                )}
                onClick={() =>
                  setOpenDropdown(
                    openDropdown === mapping.sourceColumn ? null : mapping.sourceColumn
                  )
                }
                aria-expanded={openDropdown === mapping.sourceColumn}
                aria-haspopup="listbox"
              >
                <span className="truncate">
                  {mapping.targetField
                    ? MAPPABLE_FIELDS.find((f) => f.key === mapping.targetField)?.label ||
                      mapping.targetField
                    : 'Select field...'}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>

              {openDropdown === mapping.sourceColumn && (
                <div
                  role="listbox"
                  className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-60 overflow-auto"
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={!mapping.targetField}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center justify-between',
                      !mapping.targetField && 'bg-accent'
                    )}
                    onClick={() => handleSelectField(mapping.sourceColumn, null)}
                  >
                    <span className="text-muted-foreground">Don&apos;t import</span>
                    {!mapping.targetField && <Check className="h-4 w-4" />}
                  </button>

                  <div className="border-t my-1" />

                  {requiredFields.length > 0 && (
                    <>
                      <div className="px-3 py-1 text-xs text-muted-foreground font-medium">
                        Required
                      </div>
                      {requiredFields.map((field) => {
                        const isDisabled =
                          mappedTargets.has(field.key) && mapping.targetField !== field.key
                        return (
                          <button
                            key={field.key}
                            type="button"
                            role="option"
                            aria-selected={mapping.targetField === field.key}
                            disabled={isDisabled}
                            className={cn(
                              'w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center justify-between',
                              mapping.targetField === field.key && 'bg-accent',
                              isDisabled && 'opacity-50 cursor-not-allowed'
                            )}
                            onClick={() =>
                              !isDisabled && handleSelectField(mapping.sourceColumn, field.key)
                            }
                          >
                            <span>{field.label}</span>
                            {mapping.targetField === field.key && <Check className="h-4 w-4" />}
                          </button>
                        )
                      })}
                      <div className="border-t my-1" />
                    </>
                  )}

                  <div className="px-3 py-1 text-xs text-muted-foreground font-medium">
                    Optional
                  </div>
                  {MAPPABLE_FIELDS.filter((f) => !f.required).map((field) => {
                    const isDisabled =
                      mappedTargets.has(field.key) && mapping.targetField !== field.key
                    return (
                      <button
                        key={field.key}
                        type="button"
                        role="option"
                        aria-selected={mapping.targetField === field.key}
                        disabled={isDisabled}
                        className={cn(
                          'w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center justify-between',
                          mapping.targetField === field.key && 'bg-accent',
                          isDisabled && 'opacity-50 cursor-not-allowed'
                        )}
                        onClick={() =>
                          !isDisabled && handleSelectField(mapping.sourceColumn, field.key)
                        }
                      >
                        <span>{field.label}</span>
                        {mapping.targetField === field.key && <Check className="h-4 w-4" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 text-sm text-muted-foreground">
        <HelpCircle className="h-4 w-4 mt-0.5 shrink-0" />
        <p>
          We automatically detected column mappings. Review and adjust as needed.
          Only &quot;Name&quot; is required.
        </p>
      </div>
    </div>
  )
}
