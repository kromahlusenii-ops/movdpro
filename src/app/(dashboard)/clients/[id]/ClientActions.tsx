'use client'

import { useState, useEffect } from 'react'
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

  // Handle escape key to close dropdown
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open])

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
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Client actions menu"
        className="p-2 rounded-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        disabled={loading}
      >
        <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
      </button>

      {open && (
        <>
          <button
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            tabIndex={-1}
          />
          <div
            className="absolute right-0 top-full mt-1 w-48 bg-background rounded-lg border shadow-lg z-50"
            role="menu"
            aria-label="Client actions"
          >
            {status === 'active' && (
              <button
                onClick={() => updateStatus('placed')}
                role="menuitem"
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors focus:outline-none focus:bg-muted"
              >
                <CheckCircle className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                Mark as Placed
              </button>
            )}
            {status !== 'archived' && (
              <button
                onClick={() => updateStatus('archived')}
                role="menuitem"
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors focus:outline-none focus:bg-muted"
              >
                <Archive className="w-4 h-4" aria-hidden="true" />
                Archive
              </button>
            )}
            {status === 'archived' && (
              <button
                onClick={() => updateStatus('active')}
                role="menuitem"
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors focus:outline-none focus:bg-muted"
              >
                <CheckCircle className="w-4 h-4" aria-hidden="true" />
                Restore
              </button>
            )}
            <button
              onClick={deleteClient}
              role="menuitem"
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors focus:outline-none focus:bg-red-50"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  )
}
