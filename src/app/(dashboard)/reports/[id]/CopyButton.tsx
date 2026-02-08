'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="p-2.5 rounded-lg border hover:bg-muted transition-colors"
    >
      {copied ? (
        <Check className="w-5 h-5 text-emerald-600" />
      ) : (
        <Copy className="w-5 h-5" />
      )}
    </button>
  )
}
