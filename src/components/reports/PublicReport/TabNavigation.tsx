'use client'

import { cn } from '@/lib/utils'

export type TabType = 'properties' | 'neighborhoods' | 'costs'

type TabNavigationProps = {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  propertyCount: number
  neighborhoodCount: number
}

export default function TabNavigation({
  activeTab,
  onTabChange,
  propertyCount,
  neighborhoodCount,
}: TabNavigationProps) {
  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'properties', label: 'Properties', count: propertyCount },
    { id: 'neighborhoods', label: 'Neighborhoods', count: neighborhoodCount },
    { id: 'costs', label: 'Move-In Costs' },
  ]

  return (
    <div className="bg-white border-b border-[#e2e5ea] sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-6">
        <nav className="flex gap-8" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'relative py-4 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <span className="flex items-center gap-2">
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      'text-xs px-1.5 py-0.5 rounded-full',
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-500'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </span>
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
