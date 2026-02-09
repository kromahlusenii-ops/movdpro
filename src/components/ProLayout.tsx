'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Search,
  GitCompare,
  Users,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProLayoutProps {
  children: React.ReactNode
  locator: {
    companyName?: string | null
    subscriptionStatus: string
    trialEndsAt?: Date | null
  }
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/search', label: 'Search', icon: Search },
  // { href: '/compare', label: 'Compare', icon: GitCompare },
  { href: '/clients', label: 'Clients', icon: Users },
]

const BOTTOM_ITEMS = [
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function ProLayout({ children, locator }: ProLayoutProps) {
  const pathname = usePathname()

  // Calculate days left in trial
  const trialDaysLeft = locator.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(locator.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-background border-r flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="font-bold text-lg">movd away</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold uppercase tracking-wider">
              PRO
            </span>
          </Link>
          {locator.companyName && (
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {locator.companyName}
            </p>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    prefetch={true}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Subscription Status */}
        {locator.subscriptionStatus === 'trialing' && (
          <div className="p-4 border-t">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">Free Trial</span>
              </div>
              <p className="text-xs text-amber-700">
                {trialDaysLeft > 0
                  ? `${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} remaining`
                  : 'Trial expired'}
              </p>
              <Link
                href="/settings"
                className="text-xs font-medium text-amber-800 hover:underline mt-2 inline-block"
              >
                Upgrade now →
              </Link>
            </div>
          </div>
        )}

        {/* Plan Badge for Active Subscribers */}
        {locator.subscriptionStatus === 'active' && (
          <div className="p-4 border-t">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium text-emerald-800">Unlimited Access</span>
              </div>
              <p className="text-xs text-emerald-600 mt-1">$60/month</p>
            </div>
          </div>
        )}

        {/* Bottom nav */}
        <div className="p-4 border-t">
          <ul className="space-y-1">
            {BOTTOM_ITEMS.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    prefetch={true}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
            <li>
              <button
                onClick={() => {
                  window.location.href = '/api/auth/logout?redirect=/pro'
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted w-full"
              >
                <LogOut className="w-5 h-5" />
                Sign out
              </button>
            </li>
          </ul>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 min-h-screen">
        {children}
      </main>
    </div>
  )
}
