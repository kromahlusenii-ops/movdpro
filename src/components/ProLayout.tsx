'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  Search,
  Users,
  Settings,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ListingsPreloader } from './ListingsPreloader'
import { SkipLink } from './ui/skip-link'
import { useFocusOnRouteChange, useRouteAnnouncer } from '@/hooks/useFocusOnRouteChange'
import { SubscriptionBanner } from './SubscriptionBanner'

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
  { href: '/clients', label: 'Clients', icon: Users },
]

const BOTTOM_ITEMS = [
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function ProLayout({ children, locator }: ProLayoutProps) {
  const pathname = usePathname()
  const [upgrading, setUpgrading] = useState(false)

  // Manage focus and announce route changes for accessibility
  useFocusOnRouteChange()
  useRouteAnnouncer()

  const handleUpgrade = async () => {
    if (upgrading) return
    setUpgrading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      setUpgrading(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Skip Link - first focusable element */}
      <SkipLink href="#main-content" />

      {/* Preload listings in background */}
      <ListingsPreloader />

      {/* Sidebar - hidden on mobile */}
      <aside
        className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-background border-r flex-col"
        aria-label="Main sidebar"
      >
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
        <nav className="flex-1 p-4" aria-label="Main navigation">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    prefetch={true}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                      isActive
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    <item.icon className="w-5 h-5" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Subscription Status */}
        <SubscriptionBanner
          subscriptionStatus={locator.subscriptionStatus}
          trialEndsAt={locator.trialEndsAt}
          onUpgrade={handleUpgrade}
          upgrading={upgrading}
        />

        {/* Bottom nav */}
        <div className="p-4 border-t">
          <nav aria-label="Secondary navigation">
            <ul className="space-y-1">
              {BOTTOM_ITEMS.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      prefetch={true}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                        isActive
                          ? 'bg-foreground text-background'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      <item.icon className="w-5 h-5" aria-hidden="true" />
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
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full',
                    'text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
                  )}
                >
                  <LogOut className="w-5 h-5" aria-hidden="true" />
                  Sign out
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main
        id="main-content"
        className="md:ml-64 min-h-screen pb-20 md:pb-0"
        tabIndex={-1}
        style={{ outline: 'none' }}
      >
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-40 bg-background border-b px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="font-bold text-lg">movd away</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold uppercase tracking-wider">
              PRO
            </span>
          </Link>
          <Link
            href="/settings"
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </header>
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t safe-area-inset-bottom"
        aria-label="Mobile navigation"
      >
        <ul className="flex items-center justify-around py-2 pb-safe">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  prefetch={true}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                    isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  <item.icon className="w-6 h-6" aria-hidden="true" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
