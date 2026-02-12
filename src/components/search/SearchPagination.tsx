'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { sectionAttr, SECTION_TYPES } from '@/lib/ai-readability'

interface SearchPaginationProps {
  page: number
  totalPages: number
  loading: boolean
  onPageChange: (page: number) => void
}

export function SearchPagination({
  page,
  totalPages,
  loading,
  onPageChange,
}: SearchPaginationProps) {
  return (
    <nav
      className="flex items-center justify-center mt-6 pt-4 border-t"
      aria-label="Pagination"
      {...sectionAttr(SECTION_TYPES.PAGINATION)}
      data-current-page={page}
      data-total-pages={totalPages}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1 || loading}
          aria-label="Go to previous page"
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          Previous
        </button>
        <div className="flex items-center gap-1" role="group" aria-label="Page numbers">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number

            if (totalPages <= 5) {
              pageNum = i + 1
            } else if (page <= 3) {
              pageNum = i + 1
            } else if (page >= totalPages - 2) {
              pageNum = totalPages - 4 + i
            } else {
              pageNum = page - 2 + i
            }

            const isCurrent = page === pageNum

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                disabled={loading}
                aria-label={`Page ${pageNum}${isCurrent ? ', current page' : ''}`}
                aria-current={isCurrent ? 'page' : undefined}
                className={cn(
                  'w-8 h-8 rounded-lg text-sm font-medium transition-colors disabled:opacity-50',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  isCurrent
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {pageNum}
              </button>
            )
          })}
        </div>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || loading}
          aria-label="Go to next page"
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Next
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
}
