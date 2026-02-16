import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getBuildingDetailData, getActiveClientsForDetail } from '@/lib/detail-data'
import { PropertyDetailView } from './PropertyDetailView'

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [buildingData, clients] = await Promise.all([
    getBuildingDetailData(id),
    getActiveClientsForDetail(),
  ])

  if (!buildingData) {
    return (
      <div className="p-4 md:p-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>
        <div className="text-center py-16 bg-background rounded-xl border">
          <p className="text-lg font-medium mb-1">Property not found</p>
          <p className="text-muted-foreground">This property may have been removed or is no longer available.</p>
          <Link
            href="/search"
            className="inline-block mt-4 text-sm font-medium text-foreground hover:underline"
          >
            Search for properties
          </Link>
        </div>
      </div>
    )
  }

  const { building, fieldEdits } = buildingData

  return (
    <PropertyDetailView
      building={building}
      fieldEdits={fieldEdits as Record<string, import('@/types/field-edits').FieldEditRecord>}
      clients={clients}
    />
  )
}
