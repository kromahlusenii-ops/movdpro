import { redirect } from 'next/navigation'
import { getSessionUserCached, getLocatorProfileCached } from '@/lib/pro-auth'
import { ProLayout } from '@/components/ProLayout'

export default async function ProDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSessionUserCached()

  if (!user) {
    redirect('/login')
  }

  const locator = await getLocatorProfileCached(user.id)

  if (!locator) {
    redirect('/signup')
  }

  return (
    <ProLayout
      locator={{
        companyName: locator.companyName,
        subscriptionStatus: locator.subscriptionStatus,
        trialEndsAt: locator.trialEndsAt,
      }}
    >
      {children}
    </ProLayout>
  )
}
