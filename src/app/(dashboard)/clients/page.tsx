import Link from 'next/link'
import { getSessionUserCached, getClientsCached } from '@/lib/pro-auth'
import { Plus, User, MoreHorizontal } from 'lucide-react'

export default async function ProClientsPage() {
  const user = await getSessionUserCached()
  const clients = await getClientsCached(user!.id)

  const activeClients = clients.filter(c => c.status === 'active')
  const placedClients = clients.filter(c => c.status === 'placed')

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Clients</h1>
          <p className="text-muted-foreground">
            {activeClients.length} active · {placedClients.length} placed
          </p>
        </div>
        <Link
          href="/clients/new"
          className="px-4 py-2.5 rounded-lg font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </Link>
      </div>

      {/* Active Clients */}
      {activeClients.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Active</h2>
          <div className="bg-background rounded-xl border divide-y">
            {activeClients.map(client => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{client.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {client.budgetMin && client.budgetMax
                      ? `$${client.budgetMin.toLocaleString()} - $${client.budgetMax.toLocaleString()}`
                      : 'No budget set'}
                    {client.bedrooms.length > 0 && ` · ${client.bedrooms.join(', ')}`}
                  </p>
                </div>
                <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Placed Clients */}
      {placedClients.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Placed</h2>
          <div className="bg-background rounded-xl border divide-y opacity-75">
            {placedClients.map(client => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{client.name}</p>
                  <p className="text-sm text-muted-foreground">Placed</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {clients.length === 0 && (
        <div className="text-center py-16 bg-background rounded-xl border">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium mb-1">No clients yet</p>
          <p className="text-muted-foreground mb-6">
            Add your first client to start tracking their requirements.
          </p>
          <Link
            href="/clients/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Client
          </Link>
        </div>
      )}
    </div>
  )
}
