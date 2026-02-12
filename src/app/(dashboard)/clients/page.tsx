import Link from 'next/link'
import { getSessionUserCached, getClientsCached } from '@/lib/pro-auth'
import { Plus, User, Upload } from 'lucide-react'
import { ClientListWithBulkActions } from '@/components/features/clients/ClientListWithBulkActions'

export default async function ProClientsPage() {
  const user = await getSessionUserCached()
  const clients = await getClientsCached(user!.id)

  const activeClients = clients.filter((c) => c.status === 'active')
  const placedClients = clients.filter((c) => c.status === 'placed')

  return (
    <div className="p-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Clients</h1>
          <p className="text-muted-foreground">
            <span className="sr-only">Summary: </span>
            {activeClients.length} active · {placedClients.length} placed
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/clients/import"
            className="px-4 py-2.5 rounded-lg font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <Upload className="w-4 h-4" aria-hidden="true" />
            Import
          </Link>
          <Link
            href="/clients/new"
            className="px-4 py-2.5 rounded-lg font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Add Client
          </Link>
        </div>
      </header>

      {/* Client List with Bulk Actions */}
      {clients.length > 0 ? (
        <ClientListWithBulkActions clients={clients} />
      ) : (
        /* Empty State */
        <div className="text-center py-16 bg-background rounded-xl border" role="status">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
          <p className="text-lg font-medium mb-1">No clients yet</p>
          <p className="text-muted-foreground mb-6">
            Add your first client to start tracking their requirements.
          </p>
          <Link
            href="/clients/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Add Client
          </Link>
        </div>
      )}
    </div>
  )
}
