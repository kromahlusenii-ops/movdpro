'use client'

import Link from 'next/link'
import { MapPin, Home, Star, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BuildingSearchCardProps {
  building: {
    id: string
    name: string
    address: string
    city: string
    state: string
    rating: number | null
    reviewCount: number | null
    unitCount: number
    rentMin: number | null
    rentMax: number | null
    bedrooms: string[]
    neighborhood: {
      name: string
      grade: string
    }
    management: {
      name: string
    } | null
  }
  className?: string
}

export function BuildingSearchCard({ building, className }: BuildingSearchCardProps) {
  const formatPrice = (price: number | null) => {
    if (!price) return null
    return `$${price.toLocaleString()}`
  }

  const priceRange = building.rentMin && building.rentMax
    ? building.rentMin === building.rentMax
      ? formatPrice(building.rentMin)
      : `${formatPrice(building.rentMin)} - ${formatPrice(building.rentMax)}`
    : building.rentMin
      ? `From ${formatPrice(building.rentMin)}`
      : null

  return (
    <Link
      href={`/property/${building.id}`}
      className={cn(
        'group block bg-background rounded-xl border p-4 hover:border-foreground/20 hover:shadow-sm transition-all',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Main Info */}
        <div className="flex-1 min-w-0">
          {/* Name and Neighborhood */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-base group-hover:text-primary transition-colors truncate">
              {building.name}
            </h3>
            <span className={cn(
              'flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold',
              building.neighborhood.grade === 'A' && 'bg-emerald-100 text-emerald-700',
              building.neighborhood.grade === 'B' && 'bg-blue-100 text-blue-700',
              building.neighborhood.grade === 'C' && 'bg-amber-100 text-amber-700',
              building.neighborhood.grade === 'D' && 'bg-orange-100 text-orange-700',
            )}>
              {building.neighborhood.grade}
            </span>
          </div>

          {/* Address */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{building.address}, {building.city}</span>
            <span className="text-muted-foreground/50">·</span>
            <span className="flex-shrink-0">{building.neighborhood.name}</span>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-sm">
            {/* Unit count */}
            <div className="flex items-center gap-1.5">
              <Home className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{building.unitCount}</span>
              <span className="text-muted-foreground">units</span>
            </div>

            {/* Bedrooms */}
            {building.bedrooms.length > 0 && (
              <div className="text-muted-foreground">
                {building.bedrooms.join(', ')}
              </div>
            )}

            {/* Rating */}
            {building.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-sm">{building.rating.toFixed(1)}</span>
              </div>
            )}

            {/* Management */}
            {building.management && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                <span className="truncate max-w-32">{building.management.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Price */}
        {priceRange && (
          <div className="flex-shrink-0 text-right">
            <span className="text-lg font-bold">{priceRange}</span>
            <span className="text-sm text-muted-foreground">/mo</span>
          </div>
        )}
      </div>
    </Link>
  )
}
