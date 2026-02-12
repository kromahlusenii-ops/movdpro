'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  User,
  MoreHorizontal,
  CheckCircle2,
  Trash2,
  Archive,
  UserCheck,
  X,
  Check,
} from 'lucide-react'

type Client = {
  id: string
  name: string
  email: string | null
  budgetMin: number | null
  budgetMax: number | null
  bedrooms: string[]
  status: string
}

type StatusFilter = 'all' | 'active' | 'placed' | 'archived'

interface ClientListWithBulkActionsProps {
  clients: Client[]
}

export function ClientListWithBulkActions({ clients }: ClientListWithBulkActionsProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const filteredClients =
    statusFilter === 'all' ? clients : clients.filter((c) => c.status === statusFilter)

  const activeClients = filteredClients.filter((c) => c.status === 'active')
  const placedClients = filteredClients.filter((c) => c.status === 'placed')
  const archivedClients = filteredClients.filter((c) => c.status === 'archived')

  const allFilteredIds = filteredClients.map((c) => c.id)
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedIds.has(id))
  const someSelected = selectedIds.size > 0

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(allFilteredIds))
    }
  }, [allSelected, allFilteredIds])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const handleBulkAction = async (action: 'delete' | 'updateStatus', status?: string) => {
    if (selectedIds.size === 0) return

    const confirmMessage =
      action === 'delete'
        ? `Delete ${selectedIds.size} client${selectedIds.size > 1 ? 's' : ''}? This cannot be undone.`
        : `Move ${selectedIds.size} client${selectedIds.size > 1 ? 's' : ''} to ${status}?`

    if (!confirm(confirmMessage)) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/clients/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          clientIds: Array.from(selectedIds),
          status,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Bulk operation failed')
      }

      setSelectedIds(new Set())
      router.refresh()
    } catch (error) {
      console.error('Bulk action error:', error)
      alert(error instanceof Error ? error.message : 'Operation failed')
    } finally {
      setIsLoading(false)
    }
  }

  const statusCounts = {
    all: clients.length,
    active: clients.filter((c) => c.status === 'active').length,
    placed: clients.filter((c) => c.status === 'placed').length,
    archived: clients.filter((c) => c.status === 'archived').length,
  }

  return (
    <div>
      {/* Filter Bar */}
      <div className="flex items-center gap-6 mb-6">
        {/* Select All Checkbox */}
        {filteredClients.length > 0 && (
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                allSelected
                  ? 'bg-foreground border-foreground'
                  : 'border-muted-foreground/40 hover:border-foreground'
              }`}
            >
              {allSelected && <Check className="w-3 h-3 text-background" />}
            </div>
            <span className="hidden sm:inline">Select all</span>
          </button>
        )}

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1">
          {(['all', 'active', 'placed', 'archived'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                statusFilter === status
                  ? 'bg-muted font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="ml-1.5 text-xs text-muted-foreground">
                {statusCounts[status]}
              </span>
            </button>
          ))}
        </div>

        {/* Selection count */}
        {someSelected && (
          <div className="text-sm text-muted-foreground ml-auto">
            {selectedIds.size} selected
          </div>
        )}
      </div>

      {/* Bulk Actions Toolbar */}
      {someSelected && (
        <div className="flex items-center gap-2 mb-6 p-3 bg-muted/50 rounded-lg border">
          <button
            onClick={clearSelection}
            className="p-1.5 hover:bg-muted rounded-md transition-colors"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-border" />

          <button
            onClick={() => handleBulkAction('updateStatus', 'active')}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md hover:bg-muted transition-colors disabled:opacity-50"
          >
            <User className="w-4 h-4" />
            Set Active
          </button>

          <button
            onClick={() => handleBulkAction('updateStatus', 'placed')}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md hover:bg-muted transition-colors disabled:opacity-50"
          >
            <UserCheck className="w-4 h-4" />
            Set Placed
          </button>

          <button
            onClick={() => handleBulkAction('updateStatus', 'archived')}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md hover:bg-muted transition-colors disabled:opacity-50"
          >
            <Archive className="w-4 h-4" />
            Archive
          </button>

          <div className="h-4 w-px bg-border" />

          <button
            onClick={() => handleBulkAction('delete')}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}

      {/* Active Clients */}
      {activeClients.length > 0 && (
        <section aria-labelledby="active-clients-heading" className="mb-8">
          <h2 id="active-clients-heading" className="text-sm font-medium text-muted-foreground mb-3">
            Active
            <span className="sr-only"> clients</span>
          </h2>
          <ul className="bg-background rounded-xl border divide-y">
            {activeClients.map((client) => (
              <ClientRow
                key={client.id}
                client={client}
                isSelected={selectedIds.has(client.id)}
                onToggleSelect={toggleSelect}
              />
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
            {placedClients.map((client) => (
              <ClientRow
                key={client.id}
                client={client}
                isSelected={selectedIds.has(client.id)}
                onToggleSelect={toggleSelect}
                icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                iconBg="bg-emerald-100"
              />
            ))}
          </ul>
        </section>
      )}

      {/* Archived Clients */}
      {archivedClients.length > 0 && (
        <section aria-labelledby="archived-clients-heading" className="mb-8">
          <h2
            id="archived-clients-heading"
            className="text-sm font-medium text-muted-foreground mb-3"
          >
            Archived
            <span className="sr-only"> clients</span>
          </h2>
          <ul className="bg-background rounded-xl border divide-y opacity-50">
            {archivedClients.map((client) => (
              <ClientRow
                key={client.id}
                client={client}
                isSelected={selectedIds.has(client.id)}
                onToggleSelect={toggleSelect}
                icon={<Archive className="w-5 h-5 text-muted-foreground" />}
                iconBg="bg-muted"
              />
            ))}
          </ul>
        </section>
      )}

      {/* Empty state for filter */}
      {filteredClients.length === 0 && clients.length > 0 && (
        <div className="text-center py-12 bg-background rounded-xl border">
          <p className="text-muted-foreground">No {statusFilter} clients</p>
        </div>
      )}
    </div>
  )
}

interface ClientRowProps {
  client: Client
  isSelected: boolean
  onToggleSelect: (id: string) => void
  icon?: React.ReactNode
  iconBg?: string
}

function ClientRow({
  client,
  isSelected,
  onToggleSelect,
  icon = <User className="w-5 h-5 text-muted-foreground" />,
  iconBg = 'bg-muted',
}: ClientRowProps) {
  return (
    <li className="flex items-center">
      <button
        onClick={(e) => {
          e.preventDefault()
          onToggleSelect(client.id)
        }}
        className="p-4 flex items-center justify-center hover:bg-muted/50 transition-colors"
      >
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            isSelected
              ? 'bg-foreground border-foreground'
              : 'border-muted-foreground/50 hover:border-foreground'
          }`}
        >
          {isSelected && <Check className="w-3 h-3 text-background" />}
        </div>
      </button>
      <Link
        href={`/clients/${client.id}`}
        className="flex-1 flex items-center gap-4 p-4 pl-0 hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring"
      >
        <div
          className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center`}
          aria-hidden="true"
        >
          {icon}
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
        <MoreHorizontal className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
      </Link>
    </li>
  )
}
