import Link from 'next/link'
import { getSessionUserCached, getClientsCached } from '@/lib/pro-auth'
import { Plus, User, MoreHorizontal, CheckCircle2 } from 'lucide-react'

export default async function ProClientsPage() {
  const user = await getSessionUserCached()
  const clients = await getClientsCached(user!.id)

  const activeClients = clients.filter(c => c.status === 'active')
  const placedClients = clients.filter(c => c.status === 'placed')

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
        <Link
          href="/clients/new"
          className="px-4 py-2.5 rounded-lg font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Add Client
        </Link>
      </header>

      {/* Active Clients */}
      {activeClients.length > 0 && (
        <section aria-labelledby="active-clients-heading" className="mb-8">
          <h2 id="active-clients-heading" className="text-sm font-medium text-muted-foreground mb-3">
            Active
            <span className="sr-only"> clients</span>
          </h2>
          <ul className="bg-background rounded-xl border divide-y">
            {activeClients.map(client => (
              <li key={client.id}>
                <Link
                  href={`/clients/${client.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring"
                >
                  <div
                    className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
                    aria-hidden="true"
                  >
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
                  <span className="sr-only">Status: Active, click to view details</span>
                  <MoreHorizontal className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Placed Clients */}
      {placedClients.length > 0 && (
        <section aria-labelledby="placed-clients-heading" className="mb-8">
          <h2 id="placed-clients-heading" className="text-sm font-medium text-muted-foreground mb-3">
            Placed
            <span className="sr-only"> clients</span>
          </h2>
          <ul className="bg-background rounded-xl border divide-y opacity-75">
            {placedClients.map(client => (
              <li key={client.id}>
                <Link
                  href={`/clients/${client.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring"
                >
                  <div
                    className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center"
                    aria-hidden="true"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{client.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                      <span>Placed</span>
                    </p>
                  </div>
                  <span className="sr-only">Click to view details</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Empty State */}
      {clients.length === 0 && (
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
