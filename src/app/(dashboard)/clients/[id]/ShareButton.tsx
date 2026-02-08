'use client'

import { useState } from 'react'
import { Share2, Copy, Check, Mail, Loader2, X, ExternalLink } from 'lucide-react'

interface ShareButtonProps {
  clientId: string
  clientEmail?: string | null
  hasListings: boolean
}

export function ShareButton({ clientId, clientEmail, hasListings }: ShareButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createShare = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/clients/${clientId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresInDays: 30 }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create share link')
      }

      setShareUrl(data.shareUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = async () => {
    setOpen(true)
    if (!shareUrl) {
      await createShare()
    }
  }

  const copyToClipboard = async () => {
    if (!shareUrl) return

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const sendEmail = async () => {
    if (!shareUrl || !clientEmail) return

    setSending(true)
    setError(null)

    try {
      const res = await fetch(`/api/clients/${clientId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresInDays: 30, sendEmail: true }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send email')
      }

      if (data.emailSent) {
        setEmailSent(true)
      } else {
        throw new Error('Email could not be sent')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email')
    } finally {
      setSending(false)
    }
  }

  if (!hasListings) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-muted-foreground cursor-not-allowed text-sm font-medium"
        title="Add listings to share"
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>
    )
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors text-sm font-medium"
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />

          {/* Content */}
          <div className="relative bg-background rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-1 rounded hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-semibold mb-2">Share Recommendations</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Share a link to your client&apos;s personalized recommendations. They can view without logging in.
            </p>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="p-4 rounded-lg bg-red-50 text-red-600 text-sm mb-4">
                {error}
                <button
                  onClick={createShare}
                  className="ml-2 underline hover:no-underline"
                >
                  Try again
                </button>
              </div>
            ) : shareUrl ? (
              <div className="space-y-4">
                {/* URL */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 rounded-lg border bg-muted text-sm font-mono"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-2 rounded-lg border hover:bg-muted transition-colors"
                    title="Copy link"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border hover:bg-muted transition-colors text-sm font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Preview Report
                  </a>

                  {clientEmail && (
                    <button
                      onClick={sendEmail}
                      disabled={sending || emailSent}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : emailSent ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Mail className="w-4 h-4" />
                      )}
                      {emailSent ? 'Email Sent!' : `Send to ${clientEmail}`}
                    </button>
                  )}
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Link expires in 30 days
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  )
}
