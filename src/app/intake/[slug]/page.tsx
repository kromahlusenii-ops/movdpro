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
    openGraph: {
      title: `Get Started with ${locatorName}`,
      description: `Fill out the intake form to get personalized apartment recommendations from ${locatorName}.`,
      type: 'website',
    },
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

export default async function IntakePage({ params }: Props) {
  const { slug } = await params
  const locator = await getLocator(slug)

  if (!locator) {
    notFound()
  }

  const locatorName = locator.companyName || locator.user.name || 'Your Locator'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center justify-center">
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
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto px-6 py-8">
        <IntakeForm
          slug={slug}
          locatorName={locatorName}
          welcomeMessage={locator.intakeWelcomeMsg}
        />
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="max-w-lg mx-auto px-6 py-4 text-center">
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
      </footer>
    </div>
  )
}
