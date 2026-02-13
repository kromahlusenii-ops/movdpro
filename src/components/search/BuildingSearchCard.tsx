'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Building2, MapPin, Home, Star, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BuildingSearchCardProps {
  building: {
    id: string
    name: string
    address: string
    city: string
    state: string
    primaryPhotoUrl: string | null
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
      logoUrl: string | null
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
        'group block bg-background rounded-xl border hover:border-foreground/20 hover:shadow-md transition-all overflow-hidden',
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-[16/9] bg-muted overflow-hidden">
        {building.primaryPhotoUrl ? (
          <Image
            src={building.primaryPhotoUrl}
            alt={building.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Building2 className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}
        {/* Neighborhood badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-background/90 backdrop-blur-sm">
            {building.neighborhood.name}
            <span className={cn(
              'ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold',
              building.neighborhood.grade === 'A' && 'bg-emerald-100 text-emerald-700',
              building.neighborhood.grade === 'B' && 'bg-blue-100 text-blue-700',
              building.neighborhood.grade === 'C' && 'bg-amber-100 text-amber-700',
              building.neighborhood.grade === 'D' && 'bg-orange-100 text-orange-700',
            )}>
              {building.neighborhood.grade}
            </span>
          </span>
        </div>
        {/* Rating badge */}
        {building.rating && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-background/90 backdrop-blur-sm">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {building.rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name */}
        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
          {building.name}
        </h3>

        {/* Address */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="line-clamp-1">{building.address}, {building.city}</span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-3 text-sm">
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
        </div>

        {/* Price range */}
        {priceRange && (
          <div className="mt-3">
            <span className="text-lg font-bold">{priceRange}</span>
            <span className="text-sm text-muted-foreground">/mo</span>
          </div>
        )}

        {/* Management company */}
        {building.management && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
            {building.management.logoUrl ? (
              <Image
                src={building.management.logoUrl}
                alt={building.management.name}
                width={20}
                height={20}
                className="rounded object-contain"
              />
            ) : (
              <Users className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground line-clamp-1">
              {building.management.name}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}
