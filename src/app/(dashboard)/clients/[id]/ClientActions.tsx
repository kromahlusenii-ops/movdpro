'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, CheckCircle, Archive, Trash2 } from 'lucide-react'

interface ClientActionsProps {
  clientId: string
  status: string
}

export function ClientActions({ clientId, status }: ClientActionsProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const updateStatus = async (newStatus: string) => {
    setLoading(true)
    try {
      await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      router.refresh()
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setLoading(false)
      setOpen(false)
    }
  }

  const deleteClient = async () => {
    if (!confirm('Are you sure you want to delete this client?')) return

    setLoading(true)
    try {
      await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      })
      router.push('/clients')
    } catch (error) {
      console.error('Failed to delete client:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg hover:bg-muted transition-colors"
        disabled={loading}
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-48 bg-background rounded-lg border shadow-lg z-50">
            {status === 'active' && (
              <button
                onClick={() => updateStatus('placed')}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
              >
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Mark as Placed
              </button>
            )}
            {status !== 'archived' && (
              <button
                onClick={() => updateStatus('archived')}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
              >
                <Archive className="w-4 h-4" />
                Archive
              </button>
            )}
            {status === 'archived' && (
              <button
                onClick={() => updateStatus('active')}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Restore
              </button>
            )}
            <button
              onClick={deleteClient}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  )
}
