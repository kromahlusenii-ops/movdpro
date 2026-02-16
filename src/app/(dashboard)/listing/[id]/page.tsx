import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getListingDetailData, getActiveClientsForDetail } from '@/lib/detail-data'
import { ListingDetailView } from './ListingDetailView'

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [listingData, clients] = await Promise.all([
    getListingDetailData(id),
    getActiveClientsForDetail(),
  ])

  if (!listingData) {
    return (
      <div className="p-4 md:p-8">
        <Link
          href="/search"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to search
        </Link>
        <div className="text-center py-16 bg-background rounded-xl border">
          <p className="text-lg font-medium mb-1">Listing not found</p>
          <p className="text-muted-foreground">This listing may have been removed or is no longer available.</p>
        </div>
      </div>
    )
  }

  const { listing, fieldEdits } = listingData

  return (
    <ListingDetailView
      listing={listing}
      fieldEdits={fieldEdits as Record<string, import('@/types/field-edits').FieldEditRecord>}
      clients={clients}
    />
  )
}
