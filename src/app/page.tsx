import Link from 'next/link'
import Image from 'next/image'
import { SkipLink } from '@/components/ui/skip-link'

export default function ProLandingPage() {
  return (
    <>
      <SkipLink href="#main-content" />
      <div className="min-h-screen bg-background">
        {/* Nav */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b">
          <nav className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between" aria-label="Main navigation">
            <Link
              href="/"
              className="font-bold text-xl tracking-tight focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
              aria-label="MOVD Pro - Home"
            >
              MOVD Pro
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded px-2 py-1"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 rounded-full text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                Try it free
              </Link>
            </div>
          </nav>
        </header>

        <main id="main-content" tabIndex={-1} style={{ outline: 'none' }}>
          {/* Hero */}
          <section className="pt-40 pb-20 px-6" aria-labelledby="hero-heading">
            <div className="max-w-3xl mx-auto">
              <p className="text-sm uppercase tracking-widest text-muted-foreground mb-6">
                For apartment locators
              </p>
              <h1
                id="hero-heading"
                className="text-4xl sm:text-5xl lg:text-6xl leading-tight mb-6"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Less research.
                <br />
                More placements.
              </h1>
              <p className="text-xl text-muted-foreground max-w-xl mb-10">
                Everything you need to match clients faster.
              </p>
              <div className="flex items-center gap-6">
                <Link
                  href="/signup"
                  className="px-6 py-3 rounded-full font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  Start free trial
                </Link>
                <span className="text-sm text-muted-foreground">
                  $99/mo after 7 days
                </span>
              </div>
            </div>
          </section>

          {/* Properties we cover */}
          <section className="pt-10 pb-16 px-6" aria-labelledby="partners-heading">
            <div className="max-w-3xl mx-auto">
              <h2 id="partners-heading" className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-5">
                Listings from Charlotte&apos;s top property managers
              </h2>
              <div className="flex items-center gap-10 sm:gap-14 opacity-40 grayscale" role="list" aria-label="Partner property managers">
                <div role="listitem">
                  <Image src="/logos/greystar.svg" alt="Greystar" width={160} height={36} className="h-7 sm:h-8 w-auto" />
                </div>
                <div role="listitem">
                  <Image src="/logos/cortland.svg" alt="Cortland" width={150} height={36} className="h-6 sm:h-7 w-auto" />
                </div>
                <div role="listitem">
                  <Image src="/logos/maa.svg" alt="MAA" width={120} height={36} className="h-7 sm:h-8 w-auto" />
                </div>
                <div role="listitem">
                  <Image src="/logos/crescent.png" alt="Crescent Communities" width={160} height={36} className="h-7 sm:h-8 w-auto" />
                </div>
              </div>
            </div>
          </section>

          {/* What it does */}
          <section className="py-20 px-6 border-t" aria-labelledby="features-heading">
            <div className="max-w-3xl mx-auto">
              <h2
                id="features-heading"
                className="text-3xl sm:text-4xl mb-14"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                What you get
              </h2>

              <dl className="space-y-10">
                <div className="grid sm:grid-cols-[140px_1fr] gap-2 sm:gap-6">
                  <dt className="text-sm uppercase tracking-widest text-muted-foreground pt-1">Search</dt>
                  <dd className="text-lg leading-relaxed">
                    Every Charlotte apartment. Filter by neighborhood, budget, beds.
                    See safety scores and what residents say online. One search, not twelve tabs.
                  </dd>
                </div>

                <div className="grid sm:grid-cols-[140px_1fr] gap-2 sm:gap-6">
                  <dt className="text-sm uppercase tracking-widest text-muted-foreground pt-1">Compare</dt>
                  <dd className="text-lg leading-relaxed">
                    Put three properties side by side. Rent, amenities, neighborhood grades.
                    See the differences. Pick the winner.
                  </dd>
                </div>

                <div className="grid sm:grid-cols-[140px_1fr] gap-2 sm:gap-6">
                  <dt className="text-sm uppercase tracking-widest text-muted-foreground pt-1">Report</dt>
                  <dd className="text-lg leading-relaxed">
                    Generate a client-ready report with your branding.
                    Share a link. They see the properties, the data, your contact info. Done.
                  </dd>
                </div>

                <div className="grid sm:grid-cols-[140px_1fr] gap-2 sm:gap-6">
                  <dt className="text-sm uppercase tracking-widest text-muted-foreground pt-1">Track</dt>
                  <dd className="text-lg leading-relaxed">
                    20 active clients. Their budget, their neighborhoods, their status.
                    Stop keeping it all in your head.
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          {/* Pricing */}
          <section className="py-20 px-6 bg-muted/50" aria-labelledby="pricing-heading">
            <div className="max-w-3xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 mb-6">
                <div>
                  <h2 id="pricing-heading" className="text-sm uppercase tracking-widest text-muted-foreground mb-4">
                    Pricing
                  </h2>
                  <p className="text-5xl font-bold">
                    $99
                    <span className="text-xl font-normal text-muted-foreground">/mo</span>
                  </p>
                </div>
                <Link
                  href="/signup"
                  className="px-6 py-3 rounded-full font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors text-center focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  Start 7-day free trial
                </Link>
              </div>
              <p className="text-muted-foreground">
                No credit card to start. Cancel anytime.
                50 credits per month for searches and reports.
              </p>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="py-8 px-6 border-t" role="contentinfo">
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              MOVD Pro 2026
            </p>
            <nav className="flex items-center gap-6 text-sm text-muted-foreground" aria-label="Footer navigation">
              <a
                href="https://movdaway.com"
                className="hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring rounded"
              >
                movd away
              </a>
              <Link
                href="/login"
                className="hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring rounded"
              >
                Sign in
              </Link>
            </nav>
          </div>
        </footer>
      </div>
    </>
  )
}
