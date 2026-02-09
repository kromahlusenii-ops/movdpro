import Link from 'next/link'
import { getSessionUserCached, getReportsCached } from '@/lib/pro-auth'
import { Plus, FileText, Eye, ExternalLink, Building2 } from 'lucide-react'

export default async function ProReportsPage() {
  const user = await getSessionUserCached()
  const reports = await getReportsCached(user!.id)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Reports</h1>
          <p className="text-muted-foreground">
            {reports.length} {reports.length === 1 ? 'report' : 'reports'} created
          </p>
        </div>
        <Link
          href="/reports/new"
          className="px-4 py-2.5 rounded-lg font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Report
        </Link>
      </div>

      {/* Reports List */}
      {reports.length > 0 ? (
        <div className="bg-background rounded-xl border divide-y">
          {reports.map(report => {
            const propertyCount = report.properties?.length ?? 0
            const isPublished = !!report.publishedAt

            return (
              <div
                key={report.id}
                className="flex items-center gap-4 p-4"
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/reports/${report.id}`}
                      className="font-medium hover:underline"
                    >
                      {report.title}
                    </Link>
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
                  <p className="text-sm text-muted-foreground">
                    {report.client?.name || 'No client'} · {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1" title="Properties">
                    <Building2 className="w-4 h-4" />
                    {propertyCount}
                  </div>
                  <div className="flex items-center gap-1" title="Views">
                    <Eye className="w-4 h-4" />
                    {report.viewCount}
                  </div>
                </div>
                {isPublished && (
                  <a
                    href={`/r/${report.shareToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    title="View public link"
                  >
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </a>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-background rounded-xl border">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium mb-1">No reports yet</p>
          <p className="text-muted-foreground mb-6">
            Create your first client report.
          </p>
          <Link
            href="/reports/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Report
          </Link>
        </div>
      )}
    </div>
  )
}
