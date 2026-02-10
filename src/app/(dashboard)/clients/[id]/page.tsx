import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import prisma from '@/lib/db'
import { getSessionUserCached } from '@/lib/pro-auth'
import { ArrowLeft, Mail, Phone, FileText, MapPin, Building2, Star, Dog, Cat, Baby, Home, Car, Bed, Bath, Ruler, Footprints, Shield, Volume2, TrendingUp, MessageCircle, ThumbsUp, ThumbsDown } from 'lucide-react'
import { ClientActions } from './ClientActions'
import { RemoveListingButton } from './RemoveListingButton'
import { ShareButton } from './ShareButton'

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

  // Fetch detailed neighborhood data for client's preferred neighborhoods
  let neighborhoodInsights: Array<{
    id: string
    name: string
    grade: string
    tagline: string | null
    walkScore: number | null
    transitScore: number | null
    safetyScore: number
    nightlifeScore: number
    sentimentScore: number
    characterTags: string[]
    highlights: string[]
    warnings: string[]
    civicInsights: string | null
    sentimentSummary: string | null
    lifestyleSummary: string | null
    bestArchetypes: string[]
    medianRent: number | null
    quotes: Array<{
      id: string
      content: string
      source: string
      sentiment: string
      theme: string | null
    }>
  }> = []

  if (client.neighborhoods.length > 0) {
    const neighborhoods = await prisma.neighborhood.findMany({
      where: {
        name: { in: client.neighborhoods }
      },
      include: {
        sentimentQuotes: {
          take: 3,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            content: true,
            source: true,
            sentiment: true,
            theme: true,
          }
        }
      }
    })

    neighborhoodInsights = neighborhoods.map(n => ({
      id: n.id,
      name: n.name,
      grade: n.grade,
      tagline: n.tagline,
      walkScore: n.walkScore,
      transitScore: n.transitScore,
      safetyScore: n.safetyScore,
      nightlifeScore: n.nightlifeScore,
      sentimentScore: n.sentimentScore,
      characterTags: n.characterTags,
      highlights: n.highlights,
      warnings: n.warnings,
      civicInsights: n.civicInsights,
      sentimentSummary: n.sentimentSummary,
      lifestyleSummary: n.lifestyleSummary,
      bestArchetypes: n.bestArchetypes,
      medianRent: n.medianRent,
      quotes: n.sentimentQuotes,
    }))
  }

  return { client, neighborhoodInsights }
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

  const { client, neighborhoodInsights } = data

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

      {/* Requirements */}
      <div className="bg-background rounded-xl border p-6 mb-6">
        <h2 className="font-semibold mb-4">Requirements</h2>
        <dl className="grid sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-muted-foreground">Budget</dt>
            <dd className="font-medium">
              {client.budgetMin && client.budgetMax
                ? `$${client.budgetMin.toLocaleString()} - $${client.budgetMax.toLocaleString()}`
                : 'Not specified'}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Bedrooms</dt>
            <dd className="font-medium">
              {client.bedrooms.length > 0 ? client.bedrooms.join(', ') : 'Not specified'}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm text-muted-foreground">Preferred Neighborhoods</dt>
            <dd className="font-medium">
              {client.neighborhoods.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {client.neighborhoods.map(hood => (
                    <span key={hood} className="px-2 py-0.5 rounded bg-muted text-sm">
                      {hood}
                    </span>
                  ))}
                </div>
              ) : (
                'Not specified'
              )}
            </dd>
          </div>
        </dl>
      </div>

      {/* Lifestyle Preferences */}
      {((client.vibes?.length ?? 0) > 0 || client.hasDog || client.hasCat || client.hasKids || client.worksFromHome || client.needsParking || client.commuteAddress) && (
        <div className="bg-background rounded-xl border p-6 mb-6">
          <h2 className="font-semibold mb-4">Lifestyle Preferences</h2>
          <div className="space-y-4">
            {client.vibes && client.vibes.length > 0 && (
              <div>
                <dt className="text-sm text-muted-foreground mb-1">Vibes</dt>
                <div className="flex flex-wrap gap-1.5">
                  {client.vibes.map((vibe: string) => (
                    <span key={vibe} className="px-2 py-0.5 rounded bg-muted text-sm capitalize">
                      {vibe.replace('-', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              {client.hasDog && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-sm font-medium">
                  <Dog className="w-4 h-4" />
                  Dog
                </span>
              )}
              {client.hasCat && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-sm font-medium">
                  <Cat className="w-4 h-4" />
                  Cat
                </span>
              )}
              {client.hasKids && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-sm font-medium">
                  <Baby className="w-4 h-4" />
                  Kids
                </span>
              )}
              {client.worksFromHome && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 text-sm font-medium">
                  <Home className="w-4 h-4" />
                  Works from Home
                </span>
              )}
              {client.needsParking && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-sm font-medium">
                  <Car className="w-4 h-4" />
                  Needs Parking
                </span>
              )}
            </div>
            {client.commuteAddress && (
              <div>
                <dt className="text-sm text-muted-foreground">Commute to</dt>
                <dd className="font-medium mt-0.5">
                  {client.commuteAddress}
                  {client.commutePreference && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      (prefers {client.commutePreference})
                    </span>
                  )}
                </dd>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Neighborhood Insights */}
      {neighborhoodInsights.length > 0 && (
        <div className="bg-background rounded-xl border p-6 mb-6">
          <h2 className="font-semibold mb-4">Neighborhood Insights</h2>
          <div className="space-y-6">
            {neighborhoodInsights.map((hood) => (
              <div key={hood.id} className="border-b last:border-b-0 pb-6 last:pb-0">
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="font-medium text-lg">{hood.name}</h3>
                  <span className="px-2 py-0.5 rounded bg-muted text-sm font-medium">
                    {hood.grade}
                  </span>
                  {hood.medianRent && (
                    <span className="text-sm text-muted-foreground">
                      ~${hood.medianRent.toLocaleString()}/mo median
                    </span>
                  )}
                </div>

                {hood.tagline && (
                  <p className="text-muted-foreground mb-3">{hood.tagline}</p>
                )}

                {/* Scores Grid - Relevance-based */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {hood.walkScore && (
                    <div className={`p-3 rounded-lg ${client.vibes?.includes('walkable') || client.priorities?.includes('walkable') ? 'bg-blue-50 border border-blue-200' : 'bg-muted/50'}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Footprints className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Walk Score</span>
                      </div>
                      <span className="text-xl font-bold">{hood.walkScore}</span>
                    </div>
                  )}
                  {hood.transitScore && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Car className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Transit</span>
                      </div>
                      <span className="text-xl font-bold">{hood.transitScore}</span>
                    </div>
                  )}
                  <div className={`p-3 rounded-lg ${client.hasKids ? 'bg-green-50 border border-green-200' : 'bg-muted/50'}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Safety</span>
                    </div>
                    <span className="text-xl font-bold">{hood.safetyScore}/10</span>
                  </div>
                  {hood.nightlifeScore > 0 && (
                    <div className={`p-3 rounded-lg ${client.vibes?.includes('nightlife') ? 'bg-purple-50 border border-purple-200' : 'bg-muted/50'}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Volume2 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Nightlife</span>
                      </div>
                      <span className="text-xl font-bold">{hood.nightlifeScore}/10</span>
                    </div>
                  )}
                </div>

                {/* Pet-Friendly Indicator for dog owners */}
                {client.hasDog && hood.bestArchetypes.some(a => a.toLowerCase().includes('dog') || a.toLowerCase().includes('pet')) && (
                  <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-amber-50 border border-amber-200">
                    <Dog className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">Dog-friendly neighborhood</span>
                  </div>
                )}

                {/* Character Tags */}
                {hood.characterTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {hood.characterTags.slice(0, 6).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full bg-muted text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Highlights & Warnings */}
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  {hood.highlights.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <ThumbsUp className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">Highlights</span>
                      </div>
                      <ul className="space-y-1">
                        {hood.highlights.slice(0, 3).map((h, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                            <span className="text-green-500 mt-1">•</span>
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {hood.warnings.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <ThumbsDown className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-medium">Heads Up</span>
                      </div>
                      <ul className="space-y-1">
                        {hood.warnings.slice(0, 3).map((w, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                            <span className="text-amber-500 mt-1">•</span>
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Lifestyle Summary for WFH clients */}
                {client.worksFromHome && hood.lifestyleSummary && (
                  <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 mb-4">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Home className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800">WFH Lifestyle</span>
                    </div>
                    <p className="text-sm text-purple-700">{hood.lifestyleSummary}</p>
                  </div>
                )}

                {/* Sentiment Quotes */}
                {hood.quotes.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <MessageCircle className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">What Residents Say</span>
                      {hood.sentimentScore > 0 && (
                        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                          <TrendingUp className="w-3 h-3" />
                          {hood.sentimentScore}% positive
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {hood.quotes.map((quote) => (
                        <div
                          key={quote.id}
                          className={`p-3 rounded-lg border ${
                            quote.sentiment === 'positive'
                              ? 'bg-green-50 border-green-200'
                              : quote.sentiment === 'negative'
                              ? 'bg-red-50 border-red-200'
                              : 'bg-muted/50 border-muted'
                          }`}
                        >
                          <p className="text-sm italic">&ldquo;{quote.content}&rdquo;</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <span className="capitalize">{quote.source}</span>
                            {quote.theme && (
                              <>
                                <span>•</span>
                                <span className="capitalize">{quote.theme}</span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {client.notes && (
        <div className="bg-background rounded-xl border p-6 mb-6">
          <h2 className="font-semibold mb-2">Notes</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">{client.notes}</p>
        </div>
      )}

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
