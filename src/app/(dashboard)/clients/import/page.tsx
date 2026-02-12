import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getSessionUserCached, getLocatorProfileCached } from '@/lib/pro-auth'
import { ImportWizard } from '@/components/features/client-import'

export const metadata = {
  title: 'Import Clients | MOVD Pro',
  description: 'Import clients from CSV or Excel files',
}

export default async function ImportClientsPage() {
  const user = await getSessionUserCached()

  if (!user) {
    redirect('/login')
  }

  const locator = await getLocatorProfileCached(user.id)

  if (!locator) {
    redirect('/onboarding')
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <Link
          href="/clients"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Clients
        </Link>
        <h1 className="text-3xl font-bold">Import Clients</h1>
        <p className="text-muted-foreground mt-2">
          Bulk import clients from a CSV or Excel file. We support exports from Zoho, HubSpot, Airtable, and other CRMs.
        </p>
      </div>

      <ImportWizard />
    </div>
  )
}
