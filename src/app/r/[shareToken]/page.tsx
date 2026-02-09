import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import prisma from '@/lib/db'
import ReportView from './ReportView'

type Props = {
  params: Promise<{ shareToken: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shareToken } = await params

  const report = await prisma.proReport.findUnique({
    where: { shareToken },
    include: {
      client: { select: { name: true } },
    },
  })

  if (!report) {
    return { title: 'Report Not Found' }
  }

  const clientName = report.client?.name || 'Client'

  return {
    title: `${clientName}'s Apartment Options | MOVD`,
    description: `Personalized apartment recommendations for ${clientName}`,
    openGraph: {
      title: `${clientName}'s Apartment Options`,
      description: `Personalized apartment recommendations curated by your apartment locator`,
      type: 'website',
    },
  }
}

async function getReport(shareToken: string) {
  const report = await prisma.proReport.findUnique({
    where: { shareToken },
    include: {
      client: true,
      locator: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
      properties: {
        orderBy: { sortOrder: 'asc' },
      },
      neighborhoods: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  if (!report || !report.isPublic) {
    return null
  }

  // Increment view count
  await prisma.proReport.update({
    where: { id: report.id },
    data: { viewCount: { increment: 1 } },
  })

  return report
}

export default async function PublicReportPage({ params }: Props) {
  const { shareToken } = await params
  const report = await getReport(shareToken)

  if (!report) {
    notFound()
  }

  // Serialize dates for client component
  const serializedReport = {
    ...report,
    createdAt: report.createdAt.toISOString(),
    publishedAt: report.publishedAt?.toISOString() || null,
    client: report.client
      ? {
          ...report.client,
          createdAt: report.client.createdAt.toISOString(),
          updatedAt: report.client.updatedAt.toISOString(),
          moveInDate: report.client.moveInDate?.toISOString() || null,
        }
      : null,
    locator: {
      ...report.locator,
      createdAt: report.locator.createdAt.toISOString(),
      updatedAt: report.locator.updatedAt.toISOString(),
      trialEndsAt: report.locator.trialEndsAt?.toISOString() || null,
      currentPeriodEnd: report.locator.currentPeriodEnd?.toISOString() || null,
      creditsResetAt: report.locator.creditsResetAt?.toISOString() || null,
    },
    properties: report.properties.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
    })),
    neighborhoods: report.neighborhoods.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    })),
  }

  return <ReportView report={serializedReport} />
}
