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
        },
      },
    },
  })

  if (!locator) return null

  const report = locator.reports[0]
  if (!report) return null

  // Fetch neighborhoods included in report
  const neighborhoods = await prisma.neighborhood.findMany({
    where: {
      id: { in: report.neighborhoodIds },
    },
  })

  // Fetch buildings included in report (v3)
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

  return { report, neighborhoods, buildings }
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

  const { report, neighborhoods, buildings } = data
  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/r/${report.shareToken}`

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
          <h1 className="text-2xl font-bold mb-2">{report.title}</h1>
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

      {/* Buildings (v3) */}
      {buildings.length > 0 && (
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

      {/* Neighborhoods */}
      {neighborhoods.length > 0 && (
        <div className="bg-background rounded-xl border p-6 mb-6">
          <h2 className="font-semibold mb-4">Included Neighborhoods</h2>
          <div className="grid gap-3">
            {neighborhoods.map((hood) => (
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
