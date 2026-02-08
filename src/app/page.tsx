import Link from 'next/link'

export default function ProLandingPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl tracking-tight">
            MOVD Pro
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 rounded-full text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
            >
              Try it free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-40 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm uppercase tracking-widest text-muted-foreground mb-6">
            For apartment locators
          </p>
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl leading-tight mb-8"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            You know Charlotte apartments exist.
            <br />
            We know which ones your client should see.
          </h1>
          <p className="text-xl text-muted-foreground max-w-xl mb-12">
            167,000 units. 21 neighborhoods. Crime data, walkability scores, what Reddit actually says.
            Search once. Send a report. Move on.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/signup"
              className="px-6 py-3 rounded-full font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
            >
              Start free trial
            </Link>
            <span className="text-sm text-muted-foreground">
              $60/mo after 14 days
            </span>
          </div>
        </div>
      </section>

      {/* What it does */}
      <section className="py-24 px-6 border-t">
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-3xl sm:text-4xl mb-16"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            What you get
          </h2>

          <div className="space-y-12">
            <div className="grid sm:grid-cols-[200px_1fr] gap-4">
              <p className="text-sm uppercase tracking-widest text-muted-foreground">Search</p>
              <p className="text-lg">
                Every Charlotte apartment. Filter by neighborhood, budget, beds.
                See safety scores and what residents say online. One search, not twelve tabs.
              </p>
            </div>

            <div className="grid sm:grid-cols-[200px_1fr] gap-4">
              <p className="text-sm uppercase tracking-widest text-muted-foreground">Compare</p>
              <p className="text-lg">
                Put three properties side by side. Rent, amenities, neighborhood grades.
                See the differences. Pick the winner.
              </p>
            </div>

            <div className="grid sm:grid-cols-[200px_1fr] gap-4">
              <p className="text-sm uppercase tracking-widest text-muted-foreground">Report</p>
              <p className="text-lg">
                Generate a client-ready report with your branding.
                Share a link. They see the properties, the data, your contact info. Done.
              </p>
            </div>

            <div className="grid sm:grid-cols-[200px_1fr] gap-4">
              <p className="text-sm uppercase tracking-widest text-muted-foreground">Track</p>
              <p className="text-lg">
                20 active clients. Their budget, their neighborhoods, their status.
                Stop keeping it all in your head.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 bg-muted/50">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 mb-8">
            <div>
              <p className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Pricing</p>
              <p className="text-5xl font-bold">$60<span className="text-xl font-normal text-muted-foreground">/mo</span></p>
            </div>
            <Link
              href="/signup"
              className="px-6 py-3 rounded-full font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors text-center"
            >
              Start 14-day free trial
            </Link>
          </div>
          <p className="text-muted-foreground">
            No credit card to start. Cancel anytime.
            50 credits per month for searches and reports.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            MOVD Pro 2026
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="https://movdaway.com" className="hover:text-foreground transition-colors">
              movd away
            </a>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
