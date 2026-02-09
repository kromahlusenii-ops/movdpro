import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import prisma from '@/lib/db'
import { getSessionUserCached } from '@/lib/pro-auth'
import { ArrowLeft, Eye, ExternalLink, Building2, MapPin } from 'lucide-react'
import { CopyButton } from './CopyButton'
import { DeleteButton } from './DeleteButton'

async function getReportData(userId: string, reportId: string) {
  const locator = await prisma.locatorProfile.findUnique({
    where: { userId },
    include: {
      reports: {
        where: { id: reportId },
        include: {
          client: true,
          properties: {
            orderBy: { sortOrder: 'asc' },
          },
          neighborhoods: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
    },
  })

  if (!locator) return null

  const report = locator.reports[0]
  if (!report) return null

  // Fetch legacy neighborhoods included in report (if any)
  const legacyNeighborhoods = report.neighborhoodIds.length > 0
    ? await prisma.neighborhood.findMany({
        where: {
          id: { in: report.neighborhoodIds },
        },
      })
    : []

  // Fetch legacy buildings included in report (v3)
  const buildings = report.buildingIds.length > 0
    ? await prisma.building.findMany({
        where: { id: { in: report.buildingIds } },
        include: {
          neighborhood: {
            select: { name: true, grade: true },
          },
          management: {
            select: { name: true },
          },
          units: {
            where: { isAvailable: true },
          },
        },
      })
    : []

  return { report, legacyNeighborhoods, buildings }
}

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getSessionUserCached()
  const data = await getReportData(user!.id, id)

  if (!data) {
    notFound()
  }

  const { report, legacyNeighborhoods, buildings } = data
  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://movdpro.vercel.app'}/r/${report.shareToken}`
  const isPublished = !!report.publishedAt

  // Use new report properties/neighborhoods if available, otherwise fall back to legacy
  const hasNewProperties = report.properties.length > 0
  const hasNewNeighborhoods = report.neighborhoods.length > 0

  return (
    <div className="p-8 max-w-3xl">
      {/* Back */}
      <Link
        href="/reports"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to reports
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{report.title}</h1>
            {isPublished ? (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                Published
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                Draft
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {report.client && (
              <Link href={`/clients/${report.clientId}`} className="hover:text-foreground">
                For {report.client.name}
              </Link>
            )}
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {report.viewCount} views
            </span>
            <span>{new Date(report.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <DeleteButton reportId={report.id} />
      </div>

      {/* Share Link */}
      <div className="bg-background rounded-xl border p-6 mb-6">
        <h2 className="font-semibold mb-3">Share with Client</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={publicUrl}
            readOnly
            className="flex-1 px-4 py-2.5 rounded-lg border bg-muted text-sm"
          />
          <CopyButton text={publicUrl} />
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-lg border hover:bg-muted transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* New Report Properties */}
      {hasNewProperties && (
        <div className="bg-background rounded-xl border p-6 mb-6">
          <h2 className="font-semibold mb-4">Properties ({report.properties.length})</h2>
          <div className="divide-y">
            {report.properties.map((property) => (
              <div key={property.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex gap-4">
                  <div className="w-20 h-16 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                    {property.imageUrl ? (
                      <Image
                        src={property.imageUrl}
                        alt={property.name}
                        width={80}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Building2 className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{property.name}</span>
                      {property.isRecommended && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-medium">
                          Top Pick
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                      <MapPin className="w-3 h-3" />
                      <span>{property.neighborhood}</span>
                    </div>
                    <p className="text-sm font-medium mt-1">
                      ${property.rent.toLocaleString()}/mo
                      {property.bedrooms === 0 ? ' · Studio' : ` · ${property.bedrooms} bed`}
                      {property.bathrooms && ` · ${property.bathrooms} bath`}
                    </p>
                    {property.locatorNote && (
                      <p className="text-sm text-muted-foreground mt-2 italic">
                        &ldquo;{property.locatorNote}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legacy Buildings (v3) */}
      {!hasNewProperties && buildings.length > 0 && (
        <div className="bg-background rounded-xl border p-6 mb-6">
          <h2 className="font-semibold mb-4">Included Properties</h2>
          <div className="divide-y">
            {buildings.map((building) => {
              const rents = building.units.flatMap((u) => [u.rentMin, u.rentMax])
              const rentMin = rents.length > 0 ? Math.min(...rents) : null
              const rentMax = rents.length > 0 ? Math.max(...rents) : null

              return (
                <div key={building.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex gap-4">
                    <div className="w-20 h-16 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                      {building.primaryPhotoUrl ? (
                        <Image
                          src={building.primaryPhotoUrl}
                          alt={building.name}
                          width={80}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Building2 className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/property/${building.id}`}
                          className="font-medium hover:underline"
                        >
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
                      {rentMin && rentMax && (
                        <p className="text-sm font-medium mt-1">
                          ${rentMin.toLocaleString()} - ${rentMax.toLocaleString()}/mo
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* New Report Neighborhoods */}
      {hasNewNeighborhoods && (
        <div className="bg-background rounded-xl border p-6 mb-6">
          <h2 className="font-semibold mb-4">Neighborhoods ({report.neighborhoods.length})</h2>
          <div className="grid gap-3">
            {report.neighborhoods.map((hood) => (
              <div
                key={hood.id}
                className="p-4 rounded-lg bg-muted/50"
              >
                <p className="font-medium mb-2">{hood.name}</p>
                <div className="grid sm:grid-cols-2 gap-2 text-sm">
                  {hood.vibe && (
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Vibe:</span> {hood.vibe}
                    </p>
                  )}
                  {hood.walkability && (
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Walkability:</span> {hood.walkability}
                    </p>
                  )}
                  {hood.safety && (
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Safety:</span> {hood.safety}
                    </p>
                  )}
                  {hood.dogFriendly && (
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Dog Friendly:</span> {hood.dogFriendly}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legacy Neighborhoods */}
      {!hasNewNeighborhoods && legacyNeighborhoods.length > 0 && (
        <div className="bg-background rounded-xl border p-6 mb-6">
          <h2 className="font-semibold mb-4">Included Neighborhoods</h2>
          <div className="grid gap-3">
            {legacyNeighborhoods.map((hood) => (
              <div
                key={hood.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
              >
                <div>
                  <p className="font-medium">{hood.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {hood.tagline || 'Charlotte neighborhood'}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-background font-medium">
                  {hood.grade}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Notes */}
      {report.customNotes && (
        <div className="bg-background rounded-xl border p-6">
          <h2 className="font-semibold mb-3">Your Notes</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">{report.customNotes}</p>
        </div>
      )}

      {/* AI Summary */}
      {report.aiSummary && (
        <div className="bg-background rounded-xl border p-6 mt-6">
          <h2 className="font-semibold mb-3">AI Summary</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">{report.aiSummary}</p>
        </div>
      )}
    </div>
  )
}
