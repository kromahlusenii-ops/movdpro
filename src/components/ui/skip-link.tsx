'use client'

import { cn } from '@/lib/utils'

interface SkipLinkProps {
  href?: string
  children?: React.ReactNode
  className?: string
}

export function SkipLink({
  href = '#main-content',
  children = 'Skip to main content',
  className,
}: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4',
        'focus:px-4 focus:py-2 focus:rounded-lg focus:bg-foreground focus:text-background',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'font-medium text-sm',
        className
      )}
    >
      {children}
    </a>
  )
}
