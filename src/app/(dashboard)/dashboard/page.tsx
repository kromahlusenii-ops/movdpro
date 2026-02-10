import Link from 'next/link'
import { getSessionUserCached, getLocatorProfileCached } from '@/lib/pro-auth'
import prisma from '@/lib/db'
import { Search, Plus, ArrowRight, Tag } from 'lucide-react'

async function getActiveSpecials() {
  const specials = await prisma.special.findMany({
    where: {
      isActive: true,
      OR: [
        { endDate: null },
        { endDate: { gte: new Date() } },
      ],
    },
    include: {
      building: {
        select: {
          id: true,
          name: true,
          neighborhood: {
            select: { name: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 6,
  })
  return specials
}

export default async function ProDashboardPage() {
  const user = await getSessionUserCached()
  const locator = await getLocatorProfileCached(user!.id)
  const specials = await getActiveSpecials()

  const activeClientCount = locator!.clients.length

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">
          Welcome back{locator!.companyName ? `, ${locator!.companyName}` : ''}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with your clients.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Link
          href="/search"
          className="flex items-center gap-4 p-6 bg-background rounded-xl border hover:border-foreground/20 transition-colors group"
        >
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
            <Search className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold group-hover:underline">Search Listings</p>
            <p className="text-sm text-muted-foreground">Find properties for clients</p>
          </div>
        </Link>

        <Link
          href="/clients/new"
          className="flex items-center gap-4 p-6 bg-background rounded-xl border hover:border-foreground/20 transition-colors group"
        >
          <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Plus className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold group-hover:underline">Add Client</p>
            <p className="text-sm text-muted-foreground">Track new client requirements</p>
          </div>
        </Link>
      </div>

      {/* Specials */}
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-emerald-900">Latest Specials & Deals</span>
          </div>
          {specials.length > 0 && (
            <span className="text-sm text-emerald-600">{specials.length} active</span>
          )}
        </div>
        {specials.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {specials.slice(0, 4).map((special) => (
              <Link
                key={special.id}
                href={`/property/${special.building.id}`}
                className="bg-white rounded-lg p-3 hover:shadow-md transition-shadow group"
              >
                <p className="font-medium text-gray-900 text-sm line-clamp-1 group-hover:underline">
                  {special.building.name}
                </p>
                <p className="text-xs text-gray-500 mb-2">
                  {special.building.neighborhood?.name}
                </p>
                <p className="text-sm text-emerald-600 font-medium line-clamp-2">
                  {special.title.split('\n')[0].trim()}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-emerald-700">No active specials at the moment. Check back after the next weekly update.</p>
        )}
      </div>

      {/* Recent Clients */}
      <div className="bg-background rounded-xl border">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold">Recent Clients</h2>
            <span className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
              {activeClientCount} active
            </span>
          </div>
          <Link
            href="/clients"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {locator!.clients.length > 0 ? (
          <ul className="divide-y">
            {locator!.clients.slice(0, 5).map((client) => (
              <li key={client.id}>
                <Link
                  href={`/clients/${client.id}`}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {client.budgetMin && client.budgetMax
                          ? `$${client.budgetMin.toLocaleString()} - $${client.budgetMax.toLocaleString()}`
                          : 'No budget set'}
                        {client.neighborhoods?.length > 0 && (
                          <span className="ml-2">· {client.neighborhoods[0]}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-6 text-center">
            <p className="text-muted-foreground mb-4">No clients yet</p>
            <Link
              href="/clients/new"
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground"
            >
              <Plus className="w-4 h-4" />
              Add your first client
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
