'use client'

import { useState } from 'react'
import { ExternalLink, Loader2, Copy, Check } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { ReportFormData } from './types'

type PreviewStepProps = {
  formData: ReportFormData
  onUpdate: (updates: Partial<ReportFormData>) => void
  onBack: () => void
  onPublish: () => Promise<{ shareUrl: string; shareToken: string }>
}

export default function PreviewStep({
  formData,
  onUpdate,
  onBack,
  onPublish,
}: PreviewStepProps) {
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const handlePublish = async () => {
    setIsPublishing(true)
    setError('')

    try {
      const result = await onPublish()
      const fullUrl = `${window.location.origin}${result.shareUrl}`
      setPublishedUrl(fullUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish report')
    } finally {
      setIsPublishing(false)
    }
  }

  const copyLink = async () => {
    if (!publishedUrl) return
    await navigator.clipboard.writeText(publishedUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (publishedUrl) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-emerald-600" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Report Published!</h2>
          <p className="text-muted-foreground">
            Your report is ready to share with {formData.clientName}.
          </p>
        </div>

        {/* Share link */}
        <div className="bg-gray-50 rounded-xl p-4">
          <label htmlFor="shareableLink" className="block text-sm font-medium mb-2">Shareable Link</label>
          <div className="flex gap-2">
            <input
              id="shareableLink"
              type="text"
              value={publishedUrl}
              readOnly
              className="flex-1 px-4 py-3 rounded-lg border bg-white text-sm"
            />
            <button
              onClick={copyLink}
              className="px-4 py-3 rounded-lg bg-foreground text-background font-medium hover:bg-foreground/90 transition-colors flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" aria-hidden="true" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" aria-hidden="true" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Open in new tab */}
        <div className="flex justify-center">
          <a
            href={publishedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:underline"
          >
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
            Open Report
            <span className="sr-only">(opens in new tab)</span>
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Preview & Publish</h2>
        <p className="text-muted-foreground text-sm">
          Review your report before publishing.
        </p>
      </div>

      {/* Summary card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{formData.title}</h3>
          {formData.locatorName && (
            <p className="text-gray-500 text-sm">Curated by {formData.locatorName}</p>
          )}

          <div className="flex flex-wrap gap-3 mt-4 text-sm text-gray-600">
            {formData.clientMoveDate && <span>Moving {formData.clientMoveDate}</span>}
            {formData.clientBudget && <span>Budget: {formData.clientBudget}</span>}
          </div>

          {formData.clientPriorities.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {formData.clientPriorities.map((priority) => (
                <span
                  key={priority}
                  className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                >
                  {priority}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Properties summary */}
        <div className="p-6 border-b border-gray-100">
          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Properties ({formData.properties.length})
          </h4>
          <div className="space-y-3">
            {formData.properties.slice(0, 3).map((property, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{property.name}</p>
                  <p className="text-sm text-gray-500">
                    {property.neighborhood} &bull; {formatCurrency(property.rent)}/mo
                  </p>
                </div>
                {property.isRecommended && (
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                    Top Pick
                  </span>
                )}
              </div>
            ))}
            {formData.properties.length > 3 && (
              <p className="text-sm text-gray-500">
                +{formData.properties.length - 3} more properties
              </p>
            )}
          </div>
        </div>

        {/* Neighborhoods summary */}
        <div className="p-6 border-b border-gray-100">
          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Neighborhoods ({formData.neighborhoods.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {formData.neighborhoods.map((neighborhood, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full"
              >
                {neighborhood.name}
              </span>
            ))}
          </div>
        </div>

        {/* Custom notes */}
        {formData.customNotes && (
          <div className="p-6">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
              Personal Notes
            </h4>
            <p className="text-gray-700 text-sm whitespace-pre-wrap">
              {formData.customNotes}
            </p>
          </div>
        )}
      </div>

      {/* Personal notes input */}
      <div>
        <label htmlFor="personalNotes" className="block text-sm font-medium mb-2">
          Add a Personal Note (optional)
        </label>
        <textarea
          id="personalNotes"
          value={formData.customNotes}
          onChange={(e) => onUpdate({ customNotes: e.target.value })}
          placeholder="Any additional notes or recommendations for your client..."
          rows={4}
          className="w-full px-4 py-3 rounded-lg border bg-background resize-none"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handlePublish}
          disabled={isPublishing || formData.properties.length === 0}
          aria-busy={isPublishing}
          className="px-6 py-3 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isPublishing && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          Publish Report
        </button>
      </div>
    </div>
  )
}
