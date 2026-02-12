'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Loader2, Upload, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { UploadDropzone } from './UploadDropzone'
import { PreviewTable } from './PreviewTable'
import { ColumnMappingPanel } from './ColumnMappingPanel'
import { ValidationSummary } from './ValidationSummary'
import { updateMapping, getUnmappedRequiredFields } from '@/lib/import/column-matcher'
import {
  updateDuplicateResolution,
  setAllDuplicateResolutions,
} from '@/lib/import/duplicate-detector'
import type { ColumnMapping, ValidationError, DuplicateMatch, ParsedClientRow, ImportResult } from '@/types/client-import'
import { cn } from '@/lib/utils'

type Step = 'upload' | 'map' | 'review' | 'complete'

const STEPS: { key: Step; label: string }[] = [
  { key: 'upload', label: 'Upload' },
  { key: 'map', label: 'Map Columns' },
  { key: 'review', label: 'Review' },
  { key: 'complete', label: 'Complete' },
]

interface ParseResponse {
  headers: string[]
  previewRows: string[][]
  totalRows: number
  suggestedMappings: ColumnMapping[]
  fileName: string
  fileSize: number
}

interface ValidateResponse {
  totalRows: number
  validCount: number
  errorCount: number
  duplicateCount: number
  errors: ValidationError[]
  duplicates: DuplicateMatch[]
  validRows: ParsedClientRow[]
}

export function ImportWizard() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('upload')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // File state
  const [file, setFile] = useState<File | null>(null)
  const [parseData, setParseData] = useState<ParseResponse | null>(null)

  // Mapping state
  const [mappings, setMappings] = useState<ColumnMapping[]>([])
  const [highlightColumn, setHighlightColumn] = useState<number | null>(null)

  // Validation state
  const [validationData, setValidationData] = useState<ValidateResponse | null>(null)
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([])

  // Import result
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile)
    setError(null)
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/import/parse', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse file')
      }

      setParseData(data)
      setMappings(data.suggestedMappings)
      setStep('map')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file')
      setFile(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleMappingChange = useCallback(
    (sourceColumn: string, targetField: string | null) => {
      setMappings((prev) => updateMapping(prev, sourceColumn, targetField))
    },
    []
  )

  const handleValidate = useCallback(async () => {
    if (!file || !mappings.length) return

    // Check required fields
    const unmappedRequired = getUnmappedRequiredFields(mappings)
    if (unmappedRequired.length > 0) {
      setError(`Please map required fields: ${unmappedRequired.map((f) => f.label).join(', ')}`)
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mappings', JSON.stringify(mappings))

      const response = await fetch('/api/import/validate', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to validate file')
      }

      setValidationData(data)
      setDuplicates(data.duplicates)
      setStep('review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate file')
    } finally {
      setIsLoading(false)
    }
  }, [file, mappings])

  const handleDuplicateResolution = useCallback(
    (rowIndex: number, resolution: 'skip' | 'overwrite') => {
      setDuplicates((prev) => updateDuplicateResolution(prev, rowIndex, resolution))
    },
    []
  )

  const handleBulkDuplicateResolution = useCallback((resolution: 'skip' | 'overwrite') => {
    setDuplicates((prev) => setAllDuplicateResolutions(prev, resolution))
  }, [])

  const handleImport = useCallback(async () => {
    if (!file || !mappings.length) return

    setError(null)
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mappings', JSON.stringify(mappings))
      formData.append('duplicateResolutions', JSON.stringify(duplicates))

      const response = await fetch('/api/import/commit', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import clients')
      }

      setImportResult(data)
      setStep('complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import clients')
    } finally {
      setIsLoading(false)
    }
  }, [file, mappings, duplicates])

  const handleBack = useCallback(() => {
    if (step === 'map') setStep('upload')
    else if (step === 'review') setStep('map')
  }, [step])

  const canProceed = useCallback(() => {
    if (step === 'upload') return !!file
    if (step === 'map') {
      const unmapped = getUnmappedRequiredFields(mappings)
      return unmapped.length === 0
    }
    if (step === 'review') return true
    return false
  }, [step, file, mappings])

  const mappedFieldsMap = new Map<string, string | null>()
  mappings.forEach((m) => mappedFieldsMap.set(m.sourceColumn, m.targetField))

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Progress Steps */}
      <nav aria-label="Import progress">
        <ol className="flex items-center justify-center gap-2">
          {STEPS.map((s, index) => {
            const stepIndex = STEPS.findIndex((st) => st.key === step)
            const isComplete = index < stepIndex
            const isCurrent = s.key === step

            return (
              <li key={s.key} className="flex items-center">
                {index > 0 && (
                  <div
                    className={cn(
                      'w-8 h-0.5 mx-2',
                      isComplete ? 'bg-primary' : 'bg-muted'
                    )}
                    aria-hidden="true"
                  />
                )}
                <div
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    isComplete && 'bg-primary/10 text-primary',
                    isCurrent && 'bg-primary text-primary-foreground',
                    !isComplete && !isCurrent && 'bg-muted text-muted-foreground'
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="w-4 text-center">{index + 1}</span>
                  )}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
              </li>
            )
          })}
        </ol>
      </nav>

      {/* Step Content */}
      <Card>
        {step === 'upload' && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Client List
              </CardTitle>
              <CardDescription>
                Upload a CSV or Excel file with your client data. We support exports from
                Zoho, HubSpot, Airtable, and other CRMs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UploadDropzone
                onFileSelect={handleFileSelect}
                isLoading={isLoading}
                error={error}
              />
            </CardContent>
          </>
        )}

        {step === 'map' && parseData && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Map Columns
              </CardTitle>
              <CardDescription>
                Review the detected column mappings. We found {parseData.totalRows} clients
                in {parseData.fileName}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-3">Preview</h3>
                <PreviewTable
                  headers={parseData.headers}
                  rows={parseData.previewRows}
                  mappedFields={mappedFieldsMap}
                  highlightColumn={highlightColumn ?? undefined}
                />
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3">Column Mapping</h3>
                <ColumnMappingPanel
                  mappings={mappings}
                  onMappingChange={handleMappingChange}
                  onColumnHover={setHighlightColumn}
                />
              </div>

              {error && (
                <div role="alert" className="text-sm text-destructive">
                  {error}
                </div>
              )}
            </CardContent>
          </>
        )}

        {step === 'review' && validationData && (
          <>
            <CardHeader>
              <CardTitle>Review Import</CardTitle>
              <CardDescription>
                Review the validation results before importing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ValidationSummary
                totalRows={validationData.totalRows}
                validCount={validationData.validCount}
                errorCount={validationData.errorCount}
                errors={validationData.errors}
                duplicates={duplicates}
                onDuplicateResolution={handleDuplicateResolution}
                onBulkDuplicateResolution={handleBulkDuplicateResolution}
              />

              {error && (
                <div role="alert" className="mt-4 text-sm text-destructive">
                  {error}
                </div>
              )}
            </CardContent>
          </>
        )}

        {step === 'complete' && importResult && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Import Complete</CardTitle>
              <CardDescription>
                Your clients have been successfully imported.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-semibold text-green-600">
                    {importResult.imported}
                  </p>
                  <p className="text-sm text-muted-foreground">Imported</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-semibold text-yellow-600">
                    {importResult.skipped}
                  </p>
                  <p className="text-sm text-muted-foreground">Skipped</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-semibold text-destructive">
                    {importResult.failed}
                  </p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-semibold">{importResult.duplicates}</p>
                  <p className="text-sm text-muted-foreground">Duplicates</p>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    router.refresh()
                    router.push('/clients')
                  }}
                >
                  View Clients
                </Button>
                <Button
                  onClick={() => {
                    setStep('upload')
                    setFile(null)
                    setParseData(null)
                    setMappings([])
                    setValidationData(null)
                    setDuplicates([])
                    setImportResult(null)
                    setError(null)
                  }}
                >
                  Import More
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>

      {/* Navigation */}
      {step !== 'complete' && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 'upload' || isLoading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {step === 'upload' && (
            <Button disabled>
              Upload a file to continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}

          {step === 'map' && (
            <Button onClick={handleValidate} disabled={!canProceed() || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}

          {step === 'review' && (
            <Button onClick={handleImport} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  Import Clients
                  <Check className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
