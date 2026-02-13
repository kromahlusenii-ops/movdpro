'use client'

import type { ReportPropertyNote } from '@/components/features/listing-notes/types'

interface LocatorTakeSectionProps {
  notes: ReportPropertyNote[]
}

export function LocatorTakeSection({ notes }: LocatorTakeSectionProps) {
  if (notes.length === 0) return null

  const pros = notes.filter((n) => n.type === 'pro').sort((a, b) => a.sortOrder - b.sortOrder)
  const cons = notes.filter((n) => n.type === 'con').sort((a, b) => a.sortOrder - b.sortOrder)
  const generalNotes = notes.filter((n) => n.type === 'note').sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="pt-4 border-t border-gray-100">
      <p className="text-[11px] uppercase tracking-wide text-blue-600 font-medium mb-3">
        Your Locator&apos;s Take
      </p>

      <div className="space-y-3">
        {/* Pros */}
        {pros.length > 0 && (
          <div className="space-y-1.5">
            {pros.map((note) => (
              <div key={note.id} className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm text-gray-700">{note.content}</span>
              </div>
            ))}
          </div>
        )}

        {/* Cons */}
        {cons.length > 0 && (
          <div className="space-y-1.5">
            {cons.map((note) => (
              <div key={note.id} className="flex items-start gap-2">
                <svg
                  className="w-4 h-4 mt-0.5 text-red-500 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm text-gray-700">{note.content}</span>
              </div>
            ))}
          </div>
        )}

        {/* General Notes */}
        {generalNotes.length > 0 && (
          <div className="space-y-1.5">
            {generalNotes.map((note) => (
              <p key={note.id} className="text-sm text-gray-600 italic pl-6">
                {note.content}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
