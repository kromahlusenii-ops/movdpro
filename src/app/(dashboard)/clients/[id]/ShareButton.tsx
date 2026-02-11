'use client'

import { useState, useEffect, useRef } from 'react'
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
  const dialogRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Handle escape key and focus trap
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  // Focus dialog when opened
  useEffect(() => {
    if (open && dialogRef.current) {
      dialogRef.current.focus()
    }
  }, [open])

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

  const handleClose = () => {
    setOpen(false)
    triggerRef.current?.focus()
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
        aria-describedby="share-disabled-reason"
      >
        <Share2 className="w-4 h-4" aria-hidden="true" />
        Share
        <span id="share-disabled-reason" className="sr-only">
          Add listings to enable sharing
        </span>
      </button>
    )
  }

  return (
    <>
      <button
        ref={triggerRef}
        onClick={handleOpen}
        aria-haspopup="dialog"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <Share2 className="w-4 h-4" aria-hidden="true" />
        Share
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-dialog-title"
        >
          {/* Backdrop */}
          <button
            className="absolute inset-0 bg-black/50 cursor-default"
            onClick={handleClose}
            aria-label="Close dialog"
            tabIndex={-1}
          />

          {/* Content */}
          <div
            ref={dialogRef}
            className="relative bg-background rounded-xl shadow-xl max-w-md w-full mx-4 p-6"
            tabIndex={-1}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              aria-label="Close dialog"
              className="absolute top-4 right-4 p-1 rounded hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>

            <h2 id="share-dialog-title" className="text-lg font-semibold mb-2">
              Share Recommendations
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Share a link to your client&apos;s personalized recommendations. They can view without logging in.
            </p>

            {loading ? (
              <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" aria-hidden="true" />
                <span className="sr-only">Creating share link...</span>
              </div>
            ) : error ? (
              <div className="p-4 rounded-lg bg-red-50 text-red-600 text-sm mb-4" role="alert">
                {error}
                <button
                  onClick={createShare}
                  className="ml-2 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                >
                  Try again
                </button>
              </div>
            ) : shareUrl ? (
              <div className="space-y-4">
                {/* URL */}
                <div className="flex items-center gap-2">
                  <label htmlFor="share-url" className="sr-only">
                    Share URL
                  </label>
                  <input
                    id="share-url"
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 rounded-lg border bg-muted text-sm font-mono"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-2 rounded-lg border hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label={copied ? 'Link copied' : 'Copy link to clipboard'}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                    ) : (
                      <Copy className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                </div>

                {/* Status announcement */}
                <div className="sr-only" role="status" aria-live="polite">
                  {copied && 'Link copied to clipboard'}
                  {emailSent && 'Email sent successfully'}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border hover:bg-muted transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <ExternalLink className="w-4 h-4" aria-hidden="true" />
                    Preview Report
                    <span className="sr-only">(opens in new tab)</span>
                  </a>

                  {clientEmail && (
                    <button
                      onClick={sendEmail}
                      disabled={sending || emailSent}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors text-sm font-medium disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      ) : emailSent ? (
                        <Check className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Mail className="w-4 h-4" aria-hidden="true" />
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
