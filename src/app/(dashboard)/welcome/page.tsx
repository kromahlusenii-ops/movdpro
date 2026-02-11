import Link from 'next/link'
import { CheckCircle, Search, Users, FileText, ArrowRight } from 'lucide-react'

export default function WelcomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-lg w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-6">
          <CheckCircle className="w-8 h-8 text-emerald-600" aria-hidden="true" />
        </div>

        <h1 className="text-3xl font-bold mb-3">You&apos;re all set!</h1>
        <p className="text-lg text-muted-foreground mb-10">
          Thanks for trusting MOVD Pro. Your subscription is active and you have full unlimited access.
        </p>

        <div className="bg-background rounded-xl border p-6 mb-8 text-left">
          <h2 className="font-semibold mb-4">What you can do now</h2>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <Search className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-medium">Search 600+ apartments</p>
                <p className="text-sm text-muted-foreground">Filter by neighborhood, budget, and beds across Charlotte</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Users className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-medium">Manage your clients</p>
                <p className="text-sm text-muted-foreground">Track preferences, status, and recommendations</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-medium">Generate branded reports</p>
                <p className="text-sm text-muted-foreground">Share client-ready reports with your branding</p>
              </div>
            </li>
          </ul>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Go to Dashboard
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
