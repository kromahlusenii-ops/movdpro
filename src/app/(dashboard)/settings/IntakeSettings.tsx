'use client'

import { useState, useEffect } from 'react'
import { Check, Copy, ExternalLink, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IntakeSettingsProps {
  initialSlug: string | null
  initialEnabled: boolean
  initialWelcomeMessage: string | null
}

export function IntakeSettings({
  initialSlug,
  initialEnabled,
  initialWelcomeMessage,
}: IntakeSettingsProps) {
  const [slug, setSlug] = useState(initialSlug || '')
  const [enabled, setEnabled] = useState(initialEnabled)
  const [welcomeMessage, setWelcomeMessage] = useState(initialWelcomeMessage || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [copied, setCopied] = useState<'link' | 'embed' | null>(null)

  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || 'https://movdpro.vercel.app'

  const intakeUrl = slug ? `${baseUrl}/intake/${slug}` : ''
  const embedCode = slug
    ? `<iframe src="${baseUrl}/intake/${slug}/embed" width="100%" height="700" frameborder="0"></iframe>`
    : ''

  // Clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [success])

  // Clear copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(null), 2000)
      return () => clearTimeout(timer)
    }
  }, [copied])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/intake/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: slug.trim() || null,
          enabled,
          welcomeMessage: welcomeMessage.trim() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings')
      }

      // Update state with server response (in case slug was cleaned up)
      setSlug(data.settings.slug || '')
      setEnabled(data.settings.enabled)
      setWelcomeMessage(data.settings.welcomeMessage || '')
      setSuccess('Settings saved')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const copyToClipboard = async (text: string, type: 'link' | 'embed') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
    } catch {
      console.error('Failed to copy')
    }
  }

  return (
    <div className="bg-background rounded-xl border p-6 space-y-6">
      <div>
        <h2 className="font-semibold mb-1">Client Intake Form</h2>
        <p className="text-sm text-muted-foreground">
          Share a link for new clients to submit their info directly
        </p>
      </div>

      {/* Slug */}
      <div>
        <label htmlFor="intakeSlug" className="block text-sm font-medium mb-2">
          Your intake URL
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {baseUrl}/intake/
          </span>
          <input
            id="intakeSlug"
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="your-name"
            className="flex-1 px-3 py-2 rounded-lg border bg-background text-sm"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Only lowercase letters, numbers, and hyphens
        </p>
      </div>

      {/* Enable/Disable toggle */}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-sm">Accept submissions</div>
          <div className="text-xs text-muted-foreground">
            Turn off to temporarily disable the form
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled(!enabled)}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            enabled ? 'bg-foreground' : 'bg-muted'
          )}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 rounded-full bg-background transition-transform',
              enabled ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>
      </div>

      {/* Welcome message */}
      <div>
        <label htmlFor="welcomeMessage" className="block text-sm font-medium mb-2">
          Welcome message <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          id="welcomeMessage"
          value={welcomeMessage}
          onChange={(e) => setWelcomeMessage(e.target.value)}
          placeholder="Hi! Fill out this form and I'll help you find your perfect apartment in Charlotte."
          rows={2}
          className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none"
        />
      </div>

      {/* Error/Success */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-lg bg-green-50 text-green-600 text-sm dark:bg-green-900/20 dark:text-green-400 flex items-center gap-2">
          <Check className="w-4 h-4" />
          {success}
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full px-4 py-2.5 rounded-lg font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        Save Settings
      </button>

      {/* Shareable link section (only show if slug is set) */}
      {slug && (
        <div className="border-t pt-6 space-y-4">
          <div>
            <div className="text-sm font-medium mb-2">Shareable link</div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={intakeUrl}
                readOnly
                className="flex-1 px-3 py-2 rounded-lg border bg-muted text-sm"
              />
              <button
                onClick={() => copyToClipboard(intakeUrl, 'link')}
                className="px-3 py-2 rounded-lg border hover:bg-muted transition-colors flex items-center gap-1.5"
              >
                {copied === 'link' ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span className="text-sm">{copied === 'link' ? 'Copied!' : 'Copy'}</span>
              </button>
              <a
                href={intakeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg border hover:bg-muted transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Embed code */}
          <div>
            <div className="text-sm font-medium mb-2">Embed code</div>
            <div className="flex items-start gap-2">
              <pre className="flex-1 px-3 py-2 rounded-lg border bg-muted text-xs overflow-x-auto">
                {embedCode}
              </pre>
              <button
                onClick={() => copyToClipboard(embedCode, 'embed')}
                className="px-3 py-2 rounded-lg border hover:bg-muted transition-colors flex items-center gap-1.5 shrink-0"
              >
                {copied === 'embed' ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span className="text-sm">{copied === 'embed' ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Add this to your website to embed the intake form
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
