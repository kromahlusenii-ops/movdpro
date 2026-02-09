import Link from 'next/link'
import {
  LayoutDashboard,
  Search,
  GitCompare,
  Users,
  Settings,
  LogOut,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/compare', label: 'Compare', icon: GitCompare },
  { href: '/clients', label: 'Clients', icon: Users },
]

interface ProLayoutSkeletonProps {
  children: React.ReactNode
  activeHref?: string
}

export function ProLayoutSkeleton({ children, activeHref }: ProLayoutSkeletonProps) {
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar - fully rendered for navigation */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-background border-r flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="font-bold text-lg">movd away</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold uppercase tracking-wider">
              PRO
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeHref === item.href || activeHref?.startsWith(item.href + '/')
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Credits skeleton */}
        <div className="p-4 border-t">
          <div className="bg-muted rounded-lg p-4 animate-pulse">
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 w-12 bg-background rounded" />
              <div className="h-4 w-12 bg-background rounded" />
            </div>
            <div className="h-2 bg-background rounded-full" />
          </div>
        </div>

        {/* Bottom nav */}
        <div className="p-4 border-t">
          <ul className="space-y-1">
            <li>
              <Link
                href="/settings"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <Settings className="w-5 h-5" />
                Settings
              </Link>
            </li>
            <li>
              <span className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground">
                <LogOut className="w-5 h-5" />
                Sign out
              </span>
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
