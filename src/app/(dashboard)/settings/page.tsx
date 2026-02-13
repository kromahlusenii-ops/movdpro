import { getSessionUserCached, getLocatorWithEmailCached, getLocatorWithIntakeSettingsCached } from '@/lib/pro-auth'
import { SubscriptionActions } from './SubscriptionActions'
import { IntakeSettings } from './IntakeSettings'
import { AccountSettings } from './AccountSettings'

export default async function ProSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>
}) {
  const user = await getSessionUserCached()
  const [locator, intakeSettings] = await Promise.all([
    getLocatorWithEmailCached(user!.id),
    getLocatorWithIntakeSettingsCached(user!.id),
  ])
  const params = await searchParams

  const trialExpired =
    locator?.subscriptionStatus === 'trialing' &&
    locator?.trialEndsAt &&
    new Date(locator.trialEndsAt) < new Date()

  return (
    <div className="p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and subscription.
        </p>
      </div>

      {/* Account */}
      <AccountSettings
        initialName={locator?.user.name ?? null}
        initialCompanyName={locator?.companyName ?? null}
        email={locator?.user.email ?? ''}
      />

      {/* Client Intake Form */}
      <div className="mb-6">
        <IntakeSettings
          initialSlug={intakeSettings?.intakeSlug ?? null}
          initialEnabled={intakeSettings?.intakeEnabled ?? true}
          initialWelcomeMessage={intakeSettings?.intakeWelcomeMsg ?? null}
        />
      </div>

      {/* Subscription */}
      <div className="bg-background rounded-xl border p-6 mb-6">
        <h2 className="font-semibold mb-4">Subscription</h2>
        <dl className="space-y-4">
          <div>
            <dt className="text-sm text-muted-foreground">Status</dt>
            <dd>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                  locator?.subscriptionStatus === 'active'
                    ? 'bg-emerald-100 text-emerald-700'
                    : locator?.subscriptionStatus === 'trialing'
                    ? trialExpired
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                    : locator?.subscriptionStatus === 'past_due'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {locator?.subscriptionStatus === 'trialing'
                  ? trialExpired
                    ? 'Trial Expired'
                    : 'Trial'
                  : locator?.subscriptionStatus === 'past_due'
                  ? 'Past Due'
                  : locator?.subscriptionStatus}
              </span>
            </dd>
          </div>
        </dl>

        <div className="mt-6">
          <SubscriptionActions
            subscriptionStatus={locator?.subscriptionStatus ?? 'trialing'}
            stripeCustomerId={locator?.stripeCustomerId ?? null}
            showSuccess={params.checkout === 'success'}
          />
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-background rounded-xl border border-red-200 p-6">
        <h2 className="font-semibold text-red-600 mb-4">Danger Zone</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button
          className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
          disabled
        >
          Delete Account (Coming Soon)
        </button>
      </div>
    </div>
  )
}
