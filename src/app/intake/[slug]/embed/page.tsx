import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import prisma from '@/lib/db'
import { IntakeForm } from '@/components/intake/IntakeForm'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  const locator = await prisma.locatorProfile.findUnique({
    where: { intakeSlug: slug },
    select: {
      companyName: true,
      user: { select: { name: true } },
    },
  })

  if (!locator) {
    return { title: 'Not Found' }
  }

  const locatorName = locator.companyName || locator.user.name || 'Your Locator'

  return {
    title: `Get Started with ${locatorName} | MOVD`,
    description: `Fill out the intake form to get personalized apartment recommendations from ${locatorName}.`,
    // Prevent indexing of embed pages
    robots: { index: false, follow: false },
  }
}

async function getLocator(slug: string) {
  const locator = await prisma.locatorProfile.findUnique({
    where: { intakeSlug: slug },
    select: {
      id: true,
      companyName: true,
      companyLogo: true,
      intakeEnabled: true,
      intakeWelcomeMsg: true,
      user: {
        select: { name: true },
      },
    },
  })

  if (!locator || !locator.intakeEnabled) {
    return null
  }

  return locator
}

export default async function IntakeEmbedPage({ params }: Props) {
  const { slug } = await params
  const locator = await getLocator(slug)

  if (!locator) {
    notFound()
  }

  const locatorName = locator.companyName || locator.user.name || 'Your Locator'

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      {/* Minimal header for embed - just logo/name */}
      <div className="max-w-md mx-auto mb-6 flex items-center justify-center">
        {locator.companyLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={locator.companyLogo}
            alt={locatorName}
            className="h-8 w-auto"
          />
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-sm">
              {locatorName.charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold">{locatorName}</span>
          </div>
        )}
      </div>

      {/* Form */}
      <IntakeForm
        slug={slug}
        locatorName={locatorName}
        welcomeMessage={locator.intakeWelcomeMsg}
      />

      {/* Minimal footer for embed */}
      <div className="max-w-md mx-auto mt-8 text-center">
        <p className="text-xs text-muted-foreground">
          Powered by{' '}
          <a
            href="https://movdpro.vercel.app"
            className="text-foreground hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            MOVD
          </a>
        </p>
      </div>
    </div>
  )
}
