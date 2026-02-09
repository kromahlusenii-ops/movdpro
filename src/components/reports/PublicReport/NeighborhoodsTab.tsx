'use client'

type Neighborhood = {
  id: string
  name: string
  vibe: string | null
  walkability: string | null
  safety: string | null
  dogFriendly: string | null
  sortOrder: number
}

type NeighborhoodsTabProps = {
  neighborhoods: Neighborhood[]
}

function InfoCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex items-center gap-2 text-gray-500 mb-2">
        {icon}
        <span className="text-[11px] uppercase tracking-wide font-medium">{label}</span>
      </div>
      <p className="text-sm text-gray-700">{value}</p>
    </div>
  )
}

function NeighborhoodCard({ neighborhood }: { neighborhood: Neighborhood }) {
  const hasInfo =
    neighborhood.vibe ||
    neighborhood.walkability ||
    neighborhood.safety ||
    neighborhood.dogFriendly

  return (
    <div className="bg-white rounded-2xl border border-[#e2e5ea] overflow-hidden">
      <div className="p-5 md:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{neighborhood.name}</h3>

        {hasInfo ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {neighborhood.vibe && (
              <InfoCard
                label="Vibe"
                value={neighborhood.vibe}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                }
              />
            )}
            {neighborhood.walkability && (
              <InfoCard
                label="Walkability"
                value={neighborhood.walkability}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                }
              />
            )}
            {neighborhood.safety && (
              <InfoCard
                label="Safety"
                value={neighborhood.safety}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                }
              />
            )}
            {neighborhood.dogFriendly && (
              <InfoCard
                label="Dog Friendly"
                value={neighborhood.dogFriendly}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                }
              />
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No additional insights available.</p>
        )}
      </div>
    </div>
  )
}

export default function NeighborhoodsTab({ neighborhoods }: NeighborhoodsTabProps) {
  if (neighborhoods.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No neighborhoods added yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {neighborhoods.map((neighborhood) => (
        <NeighborhoodCard key={neighborhood.id} neighborhood={neighborhood} />
      ))}
    </div>
  )
}
