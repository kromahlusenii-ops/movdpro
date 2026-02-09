import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import prisma from '@/lib/db'
import ShareReportView from './ShareReportView'

type Props = {
  params: Promise<{ shareId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shareId } = await params

  const report = await prisma.clientShareReport.findUnique({
    where: { shareId },
  })

  if (!report) {
    return { title: 'Report Not Found' }
  }

  return {
    title: `${report.clientName}'s Apartment Recommendations | MOVD`,
    description: `Personalized apartment recommendations for ${report.clientName}`,
    openGraph: {
      title: `${report.clientName}'s Apartment Recommendations`,
      description: `Personalized apartment recommendations curated by your apartment locator`,
      type: 'website',
    },
  }
}

async function getShareReport(shareId: string) {
  console.log('[SharePage] Looking up shareId:', shareId)

  const report = await prisma.clientShareReport.findUnique({
    where: { shareId },
  })

  console.log('[SharePage] Found report:', report ? { id: report.id, isActive: report.isActive, expiresAt: report.expiresAt } : 'null')

  if (!report) {
    console.log('[SharePage] Report not found in database')
    return null
  }

  if (!report.isActive) {
    console.log('[SharePage] Report is inactive')
    return null
  }

  // Check if expired
  if (report.expiresAt && new Date(report.expiresAt) < new Date()) {
    console.log('[SharePage] Report is expired')
    return null
  }

  // Increment view count
  await prisma.clientShareReport.update({
    where: { id: report.id },
    data: {
      viewCount: { increment: 1 },
      lastViewedAt: new Date(),
    },
  })

  return report
}

export default async function ShareReportPage({ params }: Props) {
  const { shareId } = await params
  const report = await getShareReport(shareId)

  if (!report) {
    notFound()
  }

  // Serialize for client component
  const serializedReport = {
    id: report.id,
    shareId: report.shareId,
    clientName: report.clientName,
    preferences: report.preferences as {
      budgetMin: number | null
      budgetMax: number | null
      bedrooms: string[]
      neighborhoods: string[]
      vibes: string[]
      priorities: string[]
      hasDog: boolean
      hasCat: boolean
      hasKids: boolean
      worksFromHome: boolean
      needsParking: boolean
      commutePreference: string | null
    },
    listings: report.listings as Array<{
      type: 'listing' | 'building'
      id: string
      [key: string]: unknown
    }>,
  }

  return <ShareReportView report={serializedReport} />
}
