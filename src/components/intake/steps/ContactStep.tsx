'use client'

import { cn } from '@/lib/utils'

interface ContactStepProps {
  name: string
  setName: (value: string) => void
  email: string
  setEmail: (value: string) => void
  phone: string
  setPhone: (value: string) => void
  contactPreference: string
  setContactPreference: (value: string) => void
}

const CONTACT_PREFERENCES = [
  { value: 'text', label: 'Text', icon: '💬' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'call', label: 'Call', icon: '📞' },
]

export function ContactStep({
  name,
  setName,
  email,
  setEmail,
  phone,
  setPhone,
  contactPreference,
  setContactPreference,
}: ContactStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Let&apos;s start with you</h2>
        <p className="text-muted-foreground">
          Tell us how to reach you
        </p>
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          Your name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="First and last name"
          className="w-full px-4 py-3 rounded-lg border bg-background text-base"
          autoComplete="name"
          required
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-4 py-3 rounded-lg border bg-background text-base"
          autoComplete="email"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium mb-2">
          Phone
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(555) 123-4567"
          className="w-full px-4 py-3 rounded-lg border bg-background text-base"
          autoComplete="tel"
        />
      </div>

      {(email || phone) && (
        <fieldset>
          <legend className="block text-sm font-medium mb-2">
            How should we contact you?
          </legend>
          <div className="flex flex-wrap gap-2" role="group">
            {CONTACT_PREFERENCES.map((pref) => (
              <button
                key={pref.value}
                type="button"
                onClick={() => setContactPreference(pref.value)}
                aria-pressed={contactPreference === pref.value}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  contactPreference === pref.value
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                <span aria-hidden="true">{pref.icon}</span>
                {pref.label}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <p className="text-xs text-muted-foreground text-center pt-4">
        Please provide at least an email or phone number
      </p>
    </div>
  )
}
