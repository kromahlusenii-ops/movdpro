import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { JsonLd } from '@/components/ui/semantic/JsonLd'
import { generateWebAppSchema, generateOrganizationSchema } from '@/lib/structured-data'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://movdpro.com'

export const metadata: Metadata = {
  title: 'MOVD Pro | For Apartment Locators',
  description: 'The professional apartment search tool for Charlotte locators. Search, compare, and send client-ready reports.',
  keywords: ['apartment locator', 'Charlotte apartments', 'apartment search', 'property management', 'real estate tools'],
  metadataBase: new URL(BASE_URL),
  alternates: {
    types: {
      'application/rss+xml': `${BASE_URL}/feed.xml`,
    },
  },
  openGraph: {
    title: 'MOVD Pro | For Apartment Locators',
    description: 'Less research. More placements. The professional apartment search tool for Charlotte locators.',
    type: 'website',
    siteName: 'MOVD Pro',
    url: BASE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MOVD Pro | For Apartment Locators',
    description: 'Less research. More placements. The professional apartment search tool for Charlotte locators.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* RSS Feed Discovery */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title="MOVD Pro - Charlotte Apartment Listings"
          href="/feed.xml"
        />
        {/* App-level Structured Data */}
        <JsonLd data={generateWebAppSchema()} />
        <JsonLd data={generateOrganizationSchema()} />
      </head>
      <body suppressHydrationWarning className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
