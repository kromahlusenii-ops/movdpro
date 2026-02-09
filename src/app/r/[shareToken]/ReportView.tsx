'use client'

import { useState } from 'react'
import ReportHeader from '@/components/reports/PublicReport/ReportHeader'
import TabNavigation, { TabType } from '@/components/reports/PublicReport/TabNavigation'
import PropertiesTab from '@/components/reports/PublicReport/PropertiesTab'
import NeighborhoodsTab from '@/components/reports/PublicReport/NeighborhoodsTab'
import MoveInCostsTab from '@/components/reports/PublicReport/MoveInCostsTab'

type ReportViewProps = {
  report: {
    id: string
    title: string
    locatorName: string | null
    clientBudget: string | null
    clientMoveDate: string | null
    clientPriorities: string[]
    customNotes: string | null
    client: {
      name: string
    } | null
    locator: {
      user: {
        name: string | null
      }
      companyName: string | null
    }
    properties: Array<{
      id: string
      name: string
      address: string
      neighborhood: string
      imageUrl: string | null
      rent: number
      bedrooms: number
      bathrooms: number
      sqft: number | null
      availableDate: string | null
      amenities: string[]
      walkScore: number | null
      isRecommended: boolean
      locatorNote: string | null
      sortOrder: number
      deposit: number | null
      adminFee: number | null
      petDeposit: number | null
      petRent: number | null
      promos: string | null
    }>
    neighborhoods: Array<{
      id: string
      name: string
      vibe: string | null
      walkability: string | null
      safety: string | null
      dogFriendly: string | null
      sortOrder: number
    }>
  }
}

export default function ReportView({ report }: ReportViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('properties')

  const clientName = report.client?.name || 'Client'
  const locatorName =
    report.locatorName ||
    report.locator.user.name ||
    report.locator.companyName ||
    null

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      <ReportHeader
        clientName={clientName}
        locatorName={locatorName}
        moveDate={report.clientMoveDate}
        budget={report.clientBudget}
        priorities={report.clientPriorities}
      />

      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        propertyCount={report.properties.length}
        neighborhoodCount={report.neighborhoods.length}
      />

      <main className="max-w-4xl mx-auto px-6 py-8">
        {activeTab === 'properties' && (
          <PropertiesTab
            properties={report.properties}
            priorities={report.clientPriorities}
          />
        )}

        {activeTab === 'neighborhoods' && (
          <NeighborhoodsTab neighborhoods={report.neighborhoods} />
        )}

        {activeTab === 'costs' && (
          <MoveInCostsTab properties={report.properties} />
        )}

        {/* Custom notes section */}
        {report.customNotes && (
          <div className="mt-8 bg-white rounded-2xl border border-[#e2e5ea] p-6">
            <h3 className="text-[11px] uppercase tracking-wide text-blue-600 font-medium mb-3">
              Notes from Your Locator
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap">{report.customNotes}</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e2e5ea] bg-white mt-12">
        <div className="max-w-4xl mx-auto px-6 py-6 text-center">
          <p className="text-sm text-gray-400">
            Powered by{' '}
            <a
              href="https://movd.pro"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              MOVD Pro
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
