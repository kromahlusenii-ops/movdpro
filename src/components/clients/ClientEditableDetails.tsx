'use client'

import { useState, useCallback } from 'react'
import { Dog, Cat, Baby, Home, Car } from 'lucide-react'
import { EditableClientField } from './EditableClientField'
import { EditableArrayField } from './EditableArrayField'
import { EditableBooleanField } from './EditableBooleanField'
import { EditableBudgetRange } from './EditableBudgetRange'
import { EditableDateField } from './EditableDateField'
import { ReMatchPrompt } from './ReMatchPrompt'
import { NEIGHBORHOODS, VIBES, PRIORITIES, BEDROOM_OPTIONS } from '@/lib/constants'
import type { ClientFieldEditRecord } from '@/types/client-edits'

// Build options from constants
const neighborhoodOptions = [
  ...NEIGHBORHOODS.tier1,
  ...NEIGHBORHOODS.tier2,
  ...NEIGHBORHOODS.tier3,
].map(n => ({ id: n.name, label: n.name }))

const vibeOptions = VIBES.map(v => ({ id: v.id, label: v.label }))
const priorityOptions = PRIORITIES.map(p => ({ id: p.id, label: p.label }))
const bedroomOptions = BEDROOM_OPTIONS.map(b => ({ id: b.id, label: b.label }))

interface ClientData {
  id: string
  name: string
  email: string | null
  phone: string | null
  contactPreference: string | null
  budgetMin: number | null
  budgetMax: number | null
  bedrooms: string[]
  neighborhoods: string[]
  amenities: string[]
  moveInDate: Date | null
  vibes: string[]
  priorities: string[]
  hasDog: boolean
  hasCat: boolean
  hasKids: boolean
  worksFromHome: boolean
  needsParking: boolean
  commuteAddress: string | null
  commutePreference: string | null
  notes: string | null
}

interface ClientEditableDetailsProps {
  client: ClientData
  lastEdits: Record<string, ClientFieldEditRecord>
}

/**
 * Main wrapper component for editable client details.
 * Manages edit state and shows re-match prompt when preferences change.
 */
export function ClientEditableDetails({
  client,
  lastEdits,
}: ClientEditableDetailsProps) {
  const [showReMatchPrompt, setShowReMatchPrompt] = useState(false)

  const handleFieldSave = useCallback((_newValue: unknown, preferencesChanged: boolean) => {
    if (preferencesChanged) {
      setShowReMatchPrompt(true)
    }
  }, [])

  const handleReMatch = useCallback(async () => {
    // TODO: Call recommendations API to refresh saved listings
    // For now, just refresh the page
    window.location.reload()
  }, [])

  return (
    <>
      {/* Requirements Section */}
      <div className="bg-background rounded-xl border p-6 mb-6">
        <h2 className="font-semibold mb-4">Requirements</h2>
        <dl className="grid sm:grid-cols-2 gap-4">
          <EditableBudgetRange
            clientId={client.id}
            budgetMin={client.budgetMin}
            budgetMax={client.budgetMax}
            lastEditMin={lastEdits.budgetMin || null}
            lastEditMax={lastEdits.budgetMax || null}
            onSave={(min, max, preferencesChanged) => handleFieldSave({ min, max }, preferencesChanged)}
          />

          <EditableArrayField
            clientId={client.id}
            fieldName="bedrooms"
            label="Bedrooms"
            currentValue={client.bedrooms}
            options={bedroomOptions}
            lastEdit={lastEdits.bedrooms || null}
            onSave={handleFieldSave}
          />

          <div className="sm:col-span-2">
            <EditableArrayField
              clientId={client.id}
              fieldName="neighborhoods"
              label="Preferred Neighborhoods"
              currentValue={client.neighborhoods}
              options={neighborhoodOptions}
              lastEdit={lastEdits.neighborhoods || null}
              onSave={handleFieldSave}
            />
          </div>

          <EditableDateField
            clientId={client.id}
            fieldName="moveInDate"
            label="Move-In Date"
            currentValue={client.moveInDate}
            lastEdit={lastEdits.moveInDate || null}
            onSave={handleFieldSave}
          />
        </dl>
      </div>

      {/* Lifestyle Preferences Section */}
      <div className="bg-background rounded-xl border p-6 mb-6">
        <h2 className="font-semibold mb-4">Lifestyle Preferences</h2>
        <div className="space-y-4">
          <EditableArrayField
            clientId={client.id}
            fieldName="vibes"
            label="Vibes"
            currentValue={client.vibes}
            options={vibeOptions}
            lastEdit={lastEdits.vibes || null}
            onSave={handleFieldSave}
          />

          <EditableArrayField
            clientId={client.id}
            fieldName="priorities"
            label="Priorities"
            currentValue={client.priorities}
            options={priorityOptions}
            lastEdit={lastEdits.priorities || null}
            onSave={handleFieldSave}
          />

          <div>
            <div className="text-xs text-muted-foreground mb-2">Lifestyle Flags</div>
            <div className="flex flex-wrap gap-3">
              <EditableBooleanField
                clientId={client.id}
                fieldName="hasDog"
                label="Dog"
                currentValue={client.hasDog}
                lastEdit={lastEdits.hasDog || null}
                icon={<Dog className="w-4 h-4" />}
                activeClassName="bg-amber-100 text-amber-800"
                onSave={handleFieldSave}
              />

              <EditableBooleanField
                clientId={client.id}
                fieldName="hasCat"
                label="Cat"
                currentValue={client.hasCat}
                lastEdit={lastEdits.hasCat || null}
                icon={<Cat className="w-4 h-4" />}
                activeClassName="bg-amber-100 text-amber-800"
                onSave={handleFieldSave}
              />

              <EditableBooleanField
                clientId={client.id}
                fieldName="hasKids"
                label="Kids"
                currentValue={client.hasKids}
                lastEdit={lastEdits.hasKids || null}
                icon={<Baby className="w-4 h-4" />}
                activeClassName="bg-blue-100 text-blue-800"
                onSave={handleFieldSave}
              />

              <EditableBooleanField
                clientId={client.id}
                fieldName="worksFromHome"
                label="Works from Home"
                currentValue={client.worksFromHome}
                lastEdit={lastEdits.worksFromHome || null}
                icon={<Home className="w-4 h-4" />}
                activeClassName="bg-purple-100 text-purple-800"
                onSave={handleFieldSave}
              />

              <EditableBooleanField
                clientId={client.id}
                fieldName="needsParking"
                label="Needs Parking"
                currentValue={client.needsParking}
                lastEdit={lastEdits.needsParking || null}
                icon={<Car className="w-4 h-4" />}
                activeClassName="bg-slate-100 text-slate-800"
                onSave={handleFieldSave}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <EditableClientField
              clientId={client.id}
              fieldName="commuteAddress"
              label="Commute To"
              type="text"
              currentValue={client.commuteAddress}
              lastEdit={lastEdits.commuteAddress || null}
              placeholder="Work address"
              onSave={handleFieldSave}
            />

            <EditableClientField
              clientId={client.id}
              fieldName="commutePreference"
              label="Commute Preference"
              type="text"
              currentValue={client.commutePreference}
              lastEdit={lastEdits.commutePreference || null}
              placeholder="e.g., driving, transit"
              onSave={handleFieldSave}
            />
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div className="bg-background rounded-xl border p-6 mb-6">
        <h2 className="font-semibold mb-4">Notes</h2>
        <EditableClientField
          clientId={client.id}
          fieldName="notes"
          label="Additional Notes"
          type="text"
          currentValue={client.notes}
          lastEdit={lastEdits.notes || null}
          placeholder="Notes about this client"
          onSave={handleFieldSave}
        />
      </div>

      {/* Re-Match Prompt */}
      <ReMatchPrompt
        show={showReMatchPrompt}
        onDismiss={() => setShowReMatchPrompt(false)}
        onConfirm={handleReMatch}
      />
    </>
  )
}
