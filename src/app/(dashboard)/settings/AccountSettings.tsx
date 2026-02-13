'use client'

import { useState } from 'react'
import { Pencil, Check, X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AccountSettingsProps {
  initialName: string | null
  initialCompanyName: string | null
  email: string
}

export function AccountSettings({ initialName, initialCompanyName, email }: AccountSettingsProps) {
  const router = useRouter()
  const [name, setName] = useState(initialName || '')
  const [companyName, setCompanyName] = useState(initialCompanyName || '')
  const [editingField, setEditingField] = useState<'name' | 'company' | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async (field: 'name' | 'company') => {
    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/settings/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: field === 'name' ? name.trim() : undefined,
          companyName: field === 'company' ? companyName.trim() : undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save')
      }

      setEditingField(null)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = (field: 'name' | 'company') => {
    if (field === 'name') {
      setName(initialName || '')
    } else {
      setCompanyName(initialCompanyName || '')
    }
    setEditingField(null)
    setError(null)
  }

  return (
    <div className="bg-background rounded-xl border p-6 mb-6">
      <h2 className="font-semibold mb-4">Account</h2>
      <dl className="space-y-4">
        {/* Name */}
        <div className="group">
          <dt className="text-sm text-muted-foreground">Name</dt>
          {editingField === 'name' ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Your full name"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave('name')
                  if (e.key === 'Escape') handleCancel('name')
                }}
              />
              <button
                onClick={() => handleSave('name')}
                disabled={saving}
                className="p-1.5 rounded hover:bg-emerald-100 text-emerald-600 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleCancel('name')}
                disabled={saving}
                className="p-1.5 rounded hover:bg-red-100 text-red-600 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <dd className="font-medium flex items-center gap-2">
              {initialName || <span className="text-muted-foreground">Not set</span>}
              <button
                onClick={() => setEditingField('name')}
                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
              >
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </dd>
          )}
        </div>

        {/* Email (read-only) */}
        <div>
          <dt className="text-sm text-muted-foreground">Email</dt>
          <dd className="font-medium">{email}</dd>
        </div>

        {/* Company */}
        <div className="group">
          <dt className="text-sm text-muted-foreground">Company</dt>
          {editingField === 'company' ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Your company or brokerage"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave('company')
                  if (e.key === 'Escape') handleCancel('company')
                }}
              />
              <button
                onClick={() => handleSave('company')}
                disabled={saving}
                className="p-1.5 rounded hover:bg-emerald-100 text-emerald-600 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleCancel('company')}
                disabled={saving}
                className="p-1.5 rounded hover:bg-red-100 text-red-600 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <dd className="font-medium flex items-center gap-2">
              {initialCompanyName || <span className="text-muted-foreground">Not set</span>}
              <button
                onClick={() => setEditingField('company')}
                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
              >
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </dd>
          )}
        </div>
      </dl>

      {error && (
        <div className="mt-4 text-sm text-red-500">{error}</div>
      )}
    </div>
  )
}
