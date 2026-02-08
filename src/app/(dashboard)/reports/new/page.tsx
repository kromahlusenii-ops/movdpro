'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ProLayout } from '@/components/ProLayout'
import { ArrowLeft, Loader2, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Client {
  id: string
  name: string
  budgetMin: number | null
  budgetMax: number | null
  neighborhoods: string[]
}

interface Neighborhood {
  id: string
  name: string
  slug: string
  grade: string
}

export default function NewReportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedClientId = searchParams.get('client')

  const [locator, setLocator] = useState<{
    companyName: string | null
    creditsRemaining: number
    subscriptionStatus: string
  } | null>(null)

  const [clients, setClients] = useState<Client[]>([])
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [title, setTitle] = useState('')
  const [selectedClient, setSelectedClient] = useState<string>(preselectedClientId || '')
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([])
  const [customNotes, setCustomNotes] = useState('')

  useEffect(() => {
    // Fetch locator profile
    fetch('/api/me')
      .then(res => res.json())
      .then(data => {
        if (data.locator) {
          setLocator(data.locator)
        }
      })
      .catch(console.error)

    // Fetch clients
    fetch('/api/clients')
      .then(res => res.json())
      .then(data => {
        if (data.clients) {
          setClients(data.clients.filter((c: Client & { status: string }) => c.status === 'active'))
        }
      })
      .catch(console.error)

    // Fetch neighborhoods
    fetch('/api/neighborhoods')
      .then(res => res.json())
      .then(data => {
        if (data.neighborhoods) {
          setNeighborhoods(data.neighborhoods)
        }
      })
      .catch(console.error)
  }, [])

  // Auto-fill title based on client
  useEffect(() => {
    if (selectedClient) {
      const client = clients.find(c => c.id === selectedClient)
      if (client && !title) {
        setTitle(`Neighborhood Report for ${client.name}`)
      }
    }
  }, [selectedClient, clients, title])

  const toggleNeighborhood = (id: string) => {
    setSelectedNeighborhoods(prev =>
      prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          clientId: selectedClient || undefined,
          neighborhoodIds: selectedNeighborhoods,
          customNotes: customNotes || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create report')
      }

      router.push(`/reports/${data.report.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!locator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <ProLayout locator={locator}>
      <div className="p-8 max-w-2xl">
        {/* Back */}
        <Link
          href="/reports"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to reports
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Create Report</h1>
          <p className="text-muted-foreground">
            Generate a shareable neighborhood report for your client.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Report Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              placeholder="Neighborhood Report for John"
              className="w-full px-4 py-3 rounded-lg border bg-background"
            />
          </div>

          {/* Client */}
          <div>
            <label htmlFor="client" className="block text-sm font-medium mb-2">
              Client
            </label>
            <select
              id="client"
              value={selectedClient}
              onChange={e => setSelectedClient(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border bg-background"
            >
              <option value="">No client (general report)</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          {/* Neighborhoods */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Neighborhoods <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-muted-foreground mb-3">
              Select the neighborhoods to include in this report.
            </p>
            <div className="flex flex-wrap gap-2">
              {neighborhoods.map(hood => (
                <button
                  key={hood.id}
                  type="button"
                  onClick={() => toggleNeighborhood(hood.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    selectedNeighborhoods.includes(hood.id)
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  {hood.name}
                  <span className="ml-1 opacity-60">{hood.grade}</span>
                </button>
              ))}
            </div>
            {selectedNeighborhoods.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {selectedNeighborhoods.length} selected
              </p>
            )}
          </div>

          {/* Custom Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-2">
              Personal Notes
            </label>
            <textarea
              id="notes"
              value={customNotes}
              onChange={e => setCustomNotes(e.target.value)}
              rows={4}
              placeholder="Add any personalized recommendations or notes for your client..."
              className="w-full px-4 py-3 rounded-lg border bg-background resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={loading || !title || selectedNeighborhoods.length === 0}
              className="px-6 py-3 rounded-lg font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Report
            </button>
            <Link
              href="/reports"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </ProLayout>
  )
}
