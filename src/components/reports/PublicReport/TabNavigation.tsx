'use client'

import { useRef, useCallback, useMemo } from 'react'
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
  const tabs = useMemo(() => [
    { id: 'properties' as TabType, label: 'Properties', count: propertyCount },
    { id: 'neighborhoods' as TabType, label: 'Neighborhoods', count: neighborhoodCount },
    { id: 'costs' as TabType, label: 'Move-In Costs' },
  ], [propertyCount, neighborhoodCount])

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    let newIndex: number | null = null

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        newIndex = index === 0 ? tabs.length - 1 : index - 1
        break
      case 'ArrowRight':
        e.preventDefault()
        newIndex = index === tabs.length - 1 ? 0 : index + 1
        break
      case 'Home':
        e.preventDefault()
        newIndex = 0
        break
      case 'End':
        e.preventDefault()
        newIndex = tabs.length - 1
        break
    }

    if (newIndex !== null) {
      tabRefs.current[newIndex]?.focus()
      onTabChange(tabs[newIndex].id)
    }
  }, [tabs, onTabChange])

  return (
    <div className="bg-white border-b border-[#e2e5ea] sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-6">
        <div
          className="flex gap-8"
          role="tablist"
          aria-label="Report sections"
        >
          {tabs.map((tab, index) => {
            const isSelected = activeTab === tab.id

            return (
              <button
                key={tab.id}
                ref={(el) => { tabRefs.current[index] = el }}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isSelected}
                aria-controls={`tabpanel-${tab.id}`}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => onTabChange(tab.id)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={cn(
                  'relative py-4 text-sm font-medium transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-sm',
                  isSelected
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
                        isSelected
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-500'
                      )}
                      aria-label={`${tab.count} ${tab.label.toLowerCase()}`}
                    >
                      {tab.count}
                    </span>
                  )}
                </span>
                {isSelected && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                    aria-hidden="true"
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
