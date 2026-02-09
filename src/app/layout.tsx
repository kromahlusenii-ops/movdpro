import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'MOVD Pro | For Apartment Locators',
  description: 'The professional apartment search tool for Charlotte locators. Search, compare, and send client-ready reports.',
  keywords: ['apartment locator', 'Charlotte apartments', 'apartment search', 'property management', 'real estate tools'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://movdpro.com'),
  openGraph: {
    title: 'MOVD Pro | For Apartment Locators',
    description: 'The professional apartment search tool for Charlotte locators.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
