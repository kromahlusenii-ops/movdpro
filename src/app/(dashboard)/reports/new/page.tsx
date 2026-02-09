'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ProLayout } from '@/components/ProLayout'
import { ArrowLeft } from 'lucide-react'
import {
  StepIndicator,
  ClientInfoStep,
  PropertiesStep,
  NeighborhoodsStep,
  MoveInCostsStep,
  PreviewStep,
  type Step,
  type Client,
  type Neighborhood,
  type SavedListing,
  type SavedBuilding,
  type ReportFormData,
} from '@/components/reports/ReportBuilder'

export default function NewReportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedClientId = searchParams.get('client')

  const [locator, setLocator] = useState<{
    companyName: string | null
    creditsRemaining: number
    subscriptionStatus: string
    user?: { name: string | null }
  } | null>(null)

  const [clients, setClients] = useState<Client[]>([])
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([])
  const [savedListings, setSavedListings] = useState<SavedListing[]>([])
  const [savedBuildings, setSavedBuildings] = useState<SavedBuilding[]>([])
  const [loading, setLoading] = useState(true)

  // Multi-step form state
  const [currentStep, setCurrentStep] = useState<Step>('client')
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set())

  const [formData, setFormData] = useState<ReportFormData>({
    title: '',
    clientId: preselectedClientId || '',
    clientName: '',
    locatorName: '',
    clientBudget: '',
    clientMoveDate: '',
    clientPriorities: [],
    customNotes: '',
    properties: [],
    neighborhoods: [],
  })

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch locator profile
        const meRes = await fetch('/api/me')
        const meData = await meRes.json()
        if (meData.locator) {
          setLocator(meData.locator)
          // Set locator name
          setFormData((prev) => ({
            ...prev,
            locatorName: meData.locator.user?.name || meData.locator.companyName || '',
          }))
        }

        // Fetch clients
        const clientsRes = await fetch('/api/clients')
        const clientsData = await clientsRes.json()
        if (clientsData.clients) {
          setClients(
            clientsData.clients.filter(
              (c: Client & { status: string }) => c.status === 'active'
            )
          )
        }

        // Fetch neighborhoods
        const neighborhoodsRes = await fetch('/api/neighborhoods')
        const neighborhoodsData = await neighborhoodsRes.json()
        if (neighborhoodsData.neighborhoods) {
          setNeighborhoods(neighborhoodsData.neighborhoods)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Fetch saved listings when client changes
  useEffect(() => {
    const fetchClientListings = async () => {
      if (!formData.clientId) {
        setSavedListings([])
        setSavedBuildings([])
        return
      }

      try {
        const res = await fetch(`/api/clients/${formData.clientId}/saved`)
        const data = await res.json()

        if (data.savedListings) {
          setSavedListings(data.savedListings)
        }
        if (data.savedBuildings) {
          setSavedBuildings(data.savedBuildings)
        }
      } catch (error) {
        console.error('Failed to fetch saved listings:', error)
      }
    }

    fetchClientListings()
  }, [formData.clientId])

  const updateFormData = useCallback((updates: Partial<ReportFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }, [])

  const goToStep = (step: Step) => {
    setCurrentStep(step)
  }

  const nextStep = () => {
    const steps: Step[] = ['client', 'properties', 'neighborhoods', 'costs', 'preview']
    const currentIndex = steps.indexOf(currentStep)

    // Mark current step as completed
    setCompletedSteps((prev) => new Set([...prev, currentStep]))

    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
    }
  }

  const prevStep = () => {
    const steps: Step[] = ['client', 'properties', 'neighborhoods', 'costs', 'preview']
    const currentIndex = steps.indexOf(currentStep)

    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    }
  }

  const handlePublish = async (): Promise<{ shareUrl: string; shareToken: string }> => {
    // First create the report
    const createRes = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: formData.title,
        clientId: formData.clientId,
        locatorName: formData.locatorName,
        clientBudget: formData.clientBudget,
        clientMoveDate: formData.clientMoveDate,
        clientPriorities: formData.clientPriorities,
        customNotes: formData.customNotes,
        neighborhoodIds: [],
        buildingIds: [],
      }),
    })

    if (!createRes.ok) {
      const error = await createRes.json()
      throw new Error(error.error || 'Failed to create report')
    }

    const { report } = await createRes.json()

    // Add properties
    for (const property of formData.properties) {
      await fetch(`/api/reports/${report.id}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(property),
      })
    }

    // Add neighborhoods
    for (const neighborhood of formData.neighborhoods) {
      await fetch(`/api/reports/${report.id}/neighborhoods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(neighborhood),
      })
    }

    // Publish the report
    const publishRes = await fetch(`/api/reports/${report.id}/publish`, {
      method: 'POST',
    })

    if (!publishRes.ok) {
      const error = await publishRes.json()
      throw new Error(error.error || 'Failed to publish report')
    }

    const publishData = await publishRes.json()

    return {
      shareUrl: publishData.shareUrl,
      shareToken: publishData.shareToken,
    }
  }

  if (loading || !locator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <ProLayout locator={locator}>
      <div className="p-8 max-w-3xl">
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
            Build a shareable report with property recommendations for your client.
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator
          currentStep={currentStep}
          onStepClick={goToStep}
          completedSteps={completedSteps}
        />

        {/* Step Content */}
        <div className="mt-12 bg-background rounded-xl border p-6">
          {currentStep === 'client' && (
            <ClientInfoStep
              clients={clients}
              formData={formData}
              onUpdate={updateFormData}
              onNext={nextStep}
            />
          )}

          {currentStep === 'properties' && (
            <PropertiesStep
              formData={formData}
              savedListings={savedListings}
              savedBuildings={savedBuildings}
              onUpdate={updateFormData}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}

          {currentStep === 'neighborhoods' && (
            <NeighborhoodsStep
              formData={formData}
              allNeighborhoods={neighborhoods}
              onUpdate={updateFormData}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}

          {currentStep === 'costs' && (
            <MoveInCostsStep
              formData={formData}
              onUpdate={updateFormData}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}

          {currentStep === 'preview' && (
            <PreviewStep
              formData={formData}
              onUpdate={updateFormData}
              onBack={prevStep}
              onPublish={handlePublish}
            />
          )}
        </div>
      </div>
    </ProLayout>
  )
}
