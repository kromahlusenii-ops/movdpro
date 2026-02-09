'use client'

type ReportHeaderProps = {
  clientName: string
  locatorName: string | null
  moveDate: string | null
  budget: string | null
  priorities: string[]
}

export default function ReportHeader({
  clientName,
  locatorName,
  moveDate,
  budget,
  priorities,
}: ReportHeaderProps) {
  return (
    <div className="bg-white border-b border-[#e2e5ea]">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
          {clientName}&apos;s Apartment Options
        </h1>
        {locatorName && (
          <p className="text-gray-500 mb-6">
            Curated by {locatorName}
          </p>
        )}

        <div className="flex flex-wrap gap-4 text-sm">
          {moveDate && (
            <div className="flex items-center gap-2 text-gray-600">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>Moving {moveDate}</span>
            </div>
          )}
          {budget && (
            <div className="flex items-center gap-2 text-gray-600">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{budget}</span>
            </div>
          )}
        </div>

        {priorities.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {priorities.map((priority) => (
              <span
                key={priority}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
              >
                {priority}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
