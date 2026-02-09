export default function ShareReportLoading() {
  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      {/* Header skeleton */}
      <div className="bg-white border-b border-[#e2e5ea]">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-5 w-48 bg-gray-100 rounded animate-pulse mb-6" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-7 w-24 bg-gray-100 rounded-full animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#e2e5ea] overflow-hidden">
              <div className="h-48 bg-gray-200 animate-pulse" />
              <div className="p-6">
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mb-4" />
                <div className="flex gap-4">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
