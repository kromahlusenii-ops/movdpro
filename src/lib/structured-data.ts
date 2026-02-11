/**
 * Structured Data Generators for Schema.org JSON-LD
 *
 * These utilities generate JSON-LD structured data for AI agents,
 * search engines, and automated tools to understand page content.
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://movdpro.com'

// ============================================================================
// Type Definitions
// ============================================================================

export interface PropertyStructuredData {
  id: string
  name: string
  description?: string | null
  address: {
    street: string
    city: string
    state: string
    zip?: string | null
  }
  coordinates?: {
    lat: number
    lng: number
  }
  bedrooms: number
  bathrooms: number
  sqft?: number | null
  rentMin: number
  rentMax: number
  isAvailable: boolean
  availableDate?: string | null
  amenities?: string[]
  photos?: string[]
  rating?: number | null
  reviewCount?: number | null
  floorplansUrl?: string | null
  neighborhoodName?: string
  managementCompany?: string | null
}

export interface NeighborhoodStructuredData {
  id: string
  name: string
  slug: string
  description?: string | null
  grade: string
  walkScore?: number | null
  transitScore?: number | null
  bikeScore?: number | null
  medianRent?: number | null
  coordinates: {
    lat: number
    lng: number
  }
  highlights?: string[]
}

export interface BreadcrumbItem {
  name: string
  url: string
}

export interface OrganizationData {
  name: string
  description: string
  url: string
  logo?: string
  contactPhone?: string
  contactEmail?: string
}

// ============================================================================
// JSON-LD Generators
// ============================================================================

/**
 * Generate Apartment schema for property listings
 */
export function generateApartmentSchema(property: PropertyStructuredData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Apartment',
    '@id': `${BASE_URL}/property/${property.id}`,
    name: property.name,
    description: property.description || `${property.bedrooms} bedroom apartment in ${property.address.city}, ${property.address.state}`,
    url: `${BASE_URL}/property/${property.id}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address.street,
      addressLocality: property.address.city,
      addressRegion: property.address.state,
      ...(property.address.zip && { postalCode: property.address.zip }),
      addressCountry: 'US',
    },
    ...(property.coordinates && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: property.coordinates.lat,
        longitude: property.coordinates.lng,
      },
    }),
    numberOfBedrooms: property.bedrooms,
    numberOfBathroomsTotal: property.bathrooms,
    ...(property.sqft && {
      floorSize: {
        '@type': 'QuantitativeValue',
        value: property.sqft,
        unitCode: 'FTK', // Square feet
      },
    }),
    offers: {
      '@type': 'Offer',
      priceSpecification: {
        '@type': 'PriceSpecification',
        minPrice: property.rentMin,
        maxPrice: property.rentMax,
        priceCurrency: 'USD',
        unitText: 'MONTH',
      },
      availability: property.isAvailable
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      ...(property.availableDate && {
        availabilityStarts: property.availableDate,
      }),
    },
    ...(property.amenities &&
      property.amenities.length > 0 && {
        amenityFeature: property.amenities.map((amenity) => ({
          '@type': 'LocationFeatureSpecification',
          name: amenity,
          value: true,
        })),
      }),
    ...(property.photos &&
      property.photos.length > 0 && {
        photo: property.photos.map((url, index) => ({
          '@type': 'ImageObject',
          url,
          caption: `${property.name} - Photo ${index + 1}`,
        })),
      }),
    ...(property.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: property.rating,
        bestRating: 5,
        ...(property.reviewCount && { reviewCount: property.reviewCount }),
      },
    }),
    ...(property.neighborhoodName && {
      containedInPlace: {
        '@type': 'Place',
        name: property.neighborhoodName,
        address: {
          '@type': 'PostalAddress',
          addressLocality: property.address.city,
          addressRegion: property.address.state,
        },
      },
    }),
  }
}

/**
 * Generate Place schema for neighborhoods
 */
export function generateNeighborhoodSchema(neighborhood: NeighborhoodStructuredData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Place',
    '@id': `${BASE_URL}/neighborhoods/${neighborhood.slug}`,
    name: neighborhood.name,
    description: neighborhood.description || `${neighborhood.name} neighborhood in Charlotte, NC`,
    url: `${BASE_URL}/neighborhoods/${neighborhood.slug}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Charlotte',
      addressRegion: 'NC',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: neighborhood.coordinates.lat,
      longitude: neighborhood.coordinates.lng,
    },
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Neighborhood Grade',
        value: neighborhood.grade,
      },
      ...(neighborhood.walkScore
        ? [
            {
              '@type': 'PropertyValue',
              name: 'Walk Score',
              value: neighborhood.walkScore,
              maxValue: 100,
            },
          ]
        : []),
      ...(neighborhood.transitScore
        ? [
            {
              '@type': 'PropertyValue',
              name: 'Transit Score',
              value: neighborhood.transitScore,
              maxValue: 100,
            },
          ]
        : []),
      ...(neighborhood.bikeScore
        ? [
            {
              '@type': 'PropertyValue',
              name: 'Bike Score',
              value: neighborhood.bikeScore,
              maxValue: 100,
            },
          ]
        : []),
      ...(neighborhood.medianRent
        ? [
            {
              '@type': 'PropertyValue',
              name: 'Median Rent',
              value: neighborhood.medianRent,
              unitCode: 'USD',
            },
          ]
        : []),
    ],
    ...(neighborhood.highlights &&
      neighborhood.highlights.length > 0 && {
        keywords: neighborhood.highlights.join(', '),
      }),
  }
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`,
    })),
  }
}

/**
 * Generate WebApplication schema for the app itself
 */
export function generateWebAppSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'MOVD Pro',
    description:
      'Professional apartment search and client management tool for apartment locators in Charlotte, NC.',
    url: BASE_URL,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '99.00',
      priceCurrency: 'USD',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: 99,
        priceCurrency: 'USD',
        billingDuration: 'P1M', // ISO 8601 duration: 1 month
        unitText: 'month',
      },
    },
    featureList: [
      'Property Search & Filtering',
      'Client Management',
      'Property Comparison',
      'Client-Ready Reports',
      'Move-in Specials Tracking',
      'Neighborhood Data & Scores',
    ],
    screenshot: `${BASE_URL}/images/og-image.png`,
    author: {
      '@type': 'Organization',
      name: 'MOVD',
      url: 'https://movd.co',
    },
  }
}

/**
 * Generate RealEstateAgent schema for locator profiles
 */
export function generateLocatorSchema(locator: {
  name: string
  companyName?: string | null
  email?: string
  phone?: string | null
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: locator.companyName || locator.name,
    ...(locator.email && { email: locator.email }),
    ...(locator.phone && { telephone: locator.phone }),
    areaServed: {
      '@type': 'City',
      name: 'Charlotte',
      addressRegion: 'NC',
      addressCountry: 'US',
    },
  }
}

/**
 * Generate FAQPage schema
 */
export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

/**
 * Generate ItemList schema for search results
 */
export function generatePropertyListSchema(
  properties: PropertyStructuredData[],
  listName: string = 'Property Search Results'
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    numberOfItems: properties.length,
    itemListElement: properties.map((property, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: generateApartmentSchema(property),
    })),
  }
}

/**
 * Generate Organization schema for MOVD
 */
export function generateOrganizationSchema(org?: Partial<OrganizationData>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: org?.name || 'MOVD Pro',
    description:
      org?.description ||
      'Professional apartment search tools for Charlotte locators.',
    url: org?.url || BASE_URL,
    logo: org?.logo || `${BASE_URL}/images/logo.png`,
    sameAs: ['https://movd.co'],
    areaServed: {
      '@type': 'City',
      name: 'Charlotte',
      addressRegion: 'NC',
      addressCountry: 'US',
    },
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Serialize JSON-LD for embedding in HTML
 */
export function serializeJsonLd(data: object | object[]): string {
  return JSON.stringify(data, null, 0)
}

/**
 * Combine multiple JSON-LD objects into an array (for pages with multiple schemas)
 */
export function combineSchemas(...schemas: object[]): object[] {
  return schemas
}
