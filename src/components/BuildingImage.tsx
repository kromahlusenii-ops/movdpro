'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Building2 } from 'lucide-react'

interface BuildingImageProps {
  src: string | null
  alt: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  iconSize?: 'sm' | 'md' | 'lg'
}

export function BuildingImage({ src, alt, width, height, fill, className, iconSize = 'md' }: BuildingImageProps) {
  const [hasError, setHasError] = useState(false)

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }

  if (!src || hasError) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-muted text-muted-foreground ${className}`}>
        <Building2 className={iconSizes[iconSize]} />
      </div>
    )
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        onError={() => setHasError(true)}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width || 100}
      height={height || 100}
      className={className}
      onError={() => setHasError(true)}
    />
  )
}
