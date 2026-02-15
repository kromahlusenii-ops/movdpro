import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import prisma from '@/lib/db'
import { getSessionUserCached } from '@/lib/pro-auth'
import { getClientLastEdits, serializeEditsMap } from '@/lib/client-edits'
import { ArrowLeft, Mail, Phone, FileText, MapPin, Building2, Star, Bed, Bath, Ruler } from 'lucide-react'
import { ClientActions } from './ClientActions'
import { RemoveListingButton } from './RemoveListingButton'
import { ShareButton } from './ShareButton'
import { ListingNotesPanel } from '@/components/features/listing-notes/ListingNotesPanel'
import { ClientEditableDetails } from '@/components/clients'
import type { ClientListingNote } from '@/components/features/listing-notes/types'

async function getClientData(userId: string, clientId: string) {
  const locator = await prisma.locatorProfile.findUnique({
    where: { userId },
    include: {
      clients: {
        where: { id: clientId },
        include: {
          reports: {
            orderBy: { createdAt: 'desc' },
          },
          savedListings: {
            include: {
              unit: {
                include: {
                  building: {
                    include: {
                      neighborhood: {
                        select: { name: true, slug: true, grade: true },
                      },
                      management: {
                        select: { name: true, slug: true },
                      },
                    },
                  },
                  clientNotes: {
                    where: { clientId },
                    orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }],
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          savedBuildings: {
            select: { buildingId: true },
          },
        },
      },
    },
  })

  if (!locator) return null

  const client = locator.clients[0]
  if (!client) return null

  // Fetch last edits for each field
  const lastEditsMap = await getClientLastEdits(client.id)
  const lastEdits = serializeEditsMap(lastEditsMap)

  return { client, lastEdits }
}

function formatBedrooms(bedrooms: number): string {
  if (bedrooms === 0) return 'Studio'
  if (bedrooms === 1) return '1 BR'
  if (bedrooms === 2) return '2 BR'
  return `${bedrooms} BR`
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getSessionUserCached()
  const data = await getClientData(user!.id, id)

  if (!data) {
    notFound()
  }

  const { client, lastEdits } = data

  return (
    <div className="p-8 max-w-3xl">
      {/* Back */}
      <Link
        href="/clients"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to clients
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{client.name}</h1>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                client.status === 'active'
                  ? 'bg-emerald-100 text-emerald-700'
                  : client.status === 'placed'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {client.status}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            {client.email && (
              <a href={`mailto:${client.email}`} className="flex items-center gap-1 hover:text-foreground">
                <Mail className="w-4 h-4" />
                {client.email}
              </a>
            )}
            {client.phone && (
              <a href={`tel:${client.phone}`} className="flex items-center gap-1 hover:text-foreground">
                <Phone className="w-4 h-4" />
                {client.phone}
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ShareButton
            clientId={client.id}
            clientEmail={client.email}
            hasListings={client.savedListings.length > 0 || client.savedBuildings.length > 0}
          />
          <ClientActions clientId={client.id} status={client.status} />
        </div>
      </div>

      {/* Editable Client Details */}
      <ClientEditableDetails
        client={{
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          contactPreference: client.contactPreference,
          budgetMin: client.budgetMin,
          budgetMax: client.budgetMax,
          bedrooms: client.bedrooms,
          neighborhoods: client.neighborhoods,
          amenities: client.amenities,
          moveInDate: client.moveInDate,
          vibes: client.vibes,
          priorities: client.priorities,
          hasDog: client.hasDog,
          hasCat: client.hasCat,
          hasKids: client.hasKids,
          worksFromHome: client.worksFromHome,
          needsParking: client.needsParking,
          commuteAddress: client.commuteAddress,
          commutePreference: client.commutePreference,
          notes: client.notes,
        }}
        lastEdits={lastEdits}
      />

      {/* Saved Listings */}
      <div className="bg-background rounded-xl border mb-6">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="font-semibold">Saved Listings</h2>
          <Link
            href="/search"
            className="text-sm font-medium text-foreground hover:underline flex items-center gap-1"
          >
            <Building2 className="w-4 h-4" />
            Search more
          </Link>
        </div>
        {client.savedListings.length > 0 ? (
          <div className="divide-y">
            {client.savedListings.map(saved => {
              const listing = saved.unit
              const building = listing.building

              return (
                <div key={saved.id} className="p-4">
                  <div className="flex gap-4">
                    <Link href={`/property/${building.id}`} className="w-24 h-20 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                      {building.primaryPhotoUrl ? (
                        <Image
                          src={building.primaryPhotoUrl}
                          alt={building.name}
                          width={96}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Building2 className="w-6 h-6" />
                        </div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">
                              {listing.unitNumber || formatBedrooms(listing.bedrooms)}
                            </span>
                            <span className="text-muted-foreground">at</span>
                            <Link href={`/property/${building.id}`} className="font-medium hover:underline">
                              {building.name}
                            </Link>
                            {building.management && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-medium">
                                {building.management.name}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                            <MapPin className="w-3 h-3" />
                            <span>{building.neighborhood.name}</span>
                            <span className="px-1.5 py-0.5 rounded bg-muted text-xs font-medium">
                              {building.neighborhood.grade}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">${listing.rentMin.toLocaleString()}</span>
                          <RemoveListingButton clientId={client.id} listingId={listing.id} />
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Bed className="w-4 h-4 text-muted-foreground" />
                          <span>{formatBedrooms(listing.bedrooms)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Bath className="w-4 h-4 text-muted-foreground" />
                          <span>{listing.bathrooms} Bath</span>
                        </div>
                        {listing.sqftMin && (
                          <div className="flex items-center gap-1">
                            <Ruler className="w-4 h-4 text-muted-foreground" />
                            <span>{listing.sqftMin.toLocaleString()} sqft</span>
                          </div>
                        )}
                        {building.rating && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            {building.rating.toFixed(1)}
                          </span>
                        )}
                      </div>

                      {saved.notes && (
                        <p className="mt-2 text-sm text-muted-foreground italic">&quot;{saved.notes}&quot;</p>
                      )}

                      {/* Listing Notes Panel */}
                      <ListingNotesPanel
                        clientId={client.id}
                        unitId={listing.id}
                        initialNotes={(listing.clientNotes || []).map((note): ClientListingNote => ({
                          id: note.id,
                          clientId: note.clientId,
                          unitId: note.unitId,
                          locatorId: note.locatorId,
                          type: note.type as 'pro' | 'con' | 'note',
                          content: note.content,
                          visibleToClient: note.visibleToClient,
                          sortOrder: note.sortOrder,
                          createdAt: note.createdAt.toISOString(),
                          updatedAt: note.updatedAt.toISOString(),
                        }))}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-muted-foreground mb-2">No listings saved yet</p>
            <Link
              href="/search"
              className="text-sm font-medium text-foreground hover:underline"
            >
              Search for listings
            </Link>
          </div>
        )}
      </div>

      {/* Reports */}
      <div className="bg-background rounded-xl border">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="font-semibold">Reports</h2>
          <Link
            href={`/reports/new?client=${client.id}`}
            className="text-sm font-medium text-foreground hover:underline flex items-center gap-1"
          >
            <FileText className="w-4 h-4" />
            Create Report
          </Link>
        </div>
        {client.reports.length > 0 ? (
          <ul className="divide-y">
            {client.reports.map(report => (
              <li key={report.id}>
                <Link
                  href={`/reports/${report.id}`}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{report.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {report.viewCount} views · {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-6 text-center">
            <p className="text-muted-foreground">No reports yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
