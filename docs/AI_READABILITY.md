# MOVD PRO - AI Agent Readability Guide

This document outlines the AI readability standards implemented in MOVD PRO. All code should follow these conventions to ensure the application is easily discoverable and parseable by AI agents, crawlers, and automated tools.

## Quick Start

### Using Semantic Components

```tsx
import { Price, Rent, DateTime, Address, Breadcrumbs, JsonLd } from '@/components/ui/semantic'
import { generateApartmentSchema } from '@/lib/structured-data'
import { entityAttrs, fieldAttr, sectionAttr, ENTITY_TYPES, FIELD_TYPES, SECTION_TYPES } from '@/lib/ai-readability'

// Price display
<Rent min={1200} max={1500} />  // Outputs: $1,200 - $1,500/mo with data attributes

// Date display
<DateTime value={new Date()} format="medium" />  // <time datetime="2024-...">Feb 11, 2024</time>

// Address display
<Address street="123 Main St" city="Charlotte" state="NC" />

// Breadcrumbs with JSON-LD
<Breadcrumbs items={[{ name: 'Search', url: '/search' }, { name: 'Property', url: '/property/123' }]} />

// JSON-LD structured data
<JsonLd data={generateApartmentSchema(property)} />
```

### Using Data Attributes

```tsx
import { entityAttrs, fieldAttr, sectionAttr, ENTITY_TYPES, FIELD_TYPES, SECTION_TYPES } from '@/lib/ai-readability'

// On an entity card
<article {...entityAttrs(ENTITY_TYPES.PROPERTY, property.id)}>
  <h2 {...fieldAttr(FIELD_TYPES.NAME)}>{property.name}</h2>
  <span {...fieldAttr(FIELD_TYPES.PRICE)}>${property.rent}/mo</span>
</article>

// On a page section
<section {...sectionAttr(SECTION_TYPES.SEARCH_FILTERS)}>
  {/* filters */}
</section>
```

---

## Implementation Status

### Completed
- [x] Data attribute convention system (`/lib/ai-readability.ts`)
- [x] JSON-LD structured data generators (`/lib/structured-data.ts`)
- [x] Semantic components (Price, DateTime, Address, Breadcrumbs)
- [x] Dynamic sitemap.xml generation
- [x] robots.txt configuration
- [x] RSS feed for property listings
- [x] App-level structured data in layout
- [x] Search page data attributes

### To Implement on Each Page
- [ ] Add `<JsonLd>` with page-specific schema
- [ ] Add `data-entity` and `data-field` attributes to content
- [ ] Add `data-section` attributes to page regions
- [ ] Add `data-state` for dynamic content
- [ ] Ensure URL query params reflect filter state

---

## 1. Structured Data (JSON-LD)

### Property Pages
```tsx
import { JsonLd } from '@/components/ui/semantic/JsonLd'
import { generateApartmentSchema, generateBreadcrumbSchema } from '@/lib/structured-data'

export default function PropertyPage({ building }) {
  const propertyData = {
    id: building.id,
    name: building.name,
    address: { street: building.address, city: building.city, state: building.state },
    coordinates: { lat: building.lat, lng: building.lng },
    bedrooms: 2,
    bathrooms: 2,
    rentMin: building.rentMin,
    rentMax: building.rentMax,
    isAvailable: true,
    amenities: building.amenities,
    photos: building.photos,
    rating: building.rating,
    neighborhoodName: building.neighborhood.name,
  }

  return (
    <>
      <JsonLd data={generateApartmentSchema(propertyData)} />
      <JsonLd data={generateBreadcrumbSchema([
        { name: 'Search', url: '/search' },
        { name: building.neighborhood.name, url: `/search?neighborhoods=${building.neighborhood.slug}` },
        { name: building.name, url: `/property/${building.id}` },
      ])} />
      <main>...</main>
    </>
  )
}
```

### For Client Components
```tsx
import { useJsonLd } from '@/hooks/useJsonLd'
import { generateApartmentSchema } from '@/lib/structured-data'

export default function PropertyPage({ params }) {
  const [building, setBuilding] = useState(null)

  // Injects JSON-LD when building data is loaded
  useJsonLd(
    building ? generateApartmentSchema(mapBuildingToSchema(building)) : null,
    'property-schema'
  )

  return <main>...</main>
}
```

---

## 2. Data Attributes Convention

### Entity Types (`data-entity`)
```
property | building | unit | client | locator | neighborhood | report | special
```

### Field Types (`data-field`)
```
name | description | status | price | rent | bedrooms | bathrooms | sqft
address | city | state | zip | neighborhood | coordinates
phone | email | website
walk-score | transit-score | grade | rating | review-count
```

### Section Types (`data-section`)
```
header | navigation | main-content | sidebar | footer
search-filters | results-list | results-grid | pagination
property-hero | property-specs | property-amenities | floor-plans
client-info | client-requirements | saved-properties
```

### State Types (`data-state`)
```
loading | loaded | empty | error | filtered | expanded | collapsed | selected
```

### Action Types (`data-action`)
```
save-property | remove-property | view-details | view-floorplans | compare | contact
create-client | edit-client | delete-client | assign-property
create-report | share-report | download-pdf
search | filter | sort | paginate
```

---

## 3. Semantic HTML Requirements

### Use Semantic Elements
- `<article>` for property cards, client cards
- `<section aria-labelledby="...">` for major page sections
- `<nav aria-label="...">` for navigation
- `<header>`, `<footer>`, `<main>`, `<aside>`
- `<time datetime="ISO8601">` for all dates
- `<address>` for physical addresses
- `<data value="...">` for machine-readable values

### Example Property Card
```tsx
<article
  data-entity="property"
  data-entity-id={property.id}
  data-bedrooms={property.bedrooms}
  data-rent-min={property.rentMin}
  itemScope
  itemType="https://schema.org/Apartment"
>
  <h2 data-field="name" itemProp="name">{property.name}</h2>
  <address data-field="address" itemProp="address">{property.address}</address>
  <data value={property.rent} data-field="price" itemProp="price">${property.rent}/mo</data>
  <span data-field="bedrooms" itemProp="numberOfBedrooms">{property.bedrooms} BR</span>
  <time data-field="available-date" dateTime={property.availableDate}>
    Available {formatDate(property.availableDate)}
  </time>
</article>
```

---

## 4. API Response Standards

All API responses should follow this structure:
```json
{
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "hasNext": true
  }
}
```

### Property API Response Example
```json
{
  "data": {
    "id": "prop_abc123",
    "name": "The Vue on 5th",
    "bedrooms": 2,
    "bathrooms": 2,
    "sqft": 1050,
    "price": { "amount": 1450, "currency": "USD", "period": "month" },
    "status": "available",
    "address": {
      "street": "123 Main St",
      "city": "Charlotte",
      "state": "NC",
      "zip": "28202",
      "coordinates": { "lat": 35.2271, "lng": -80.8431 }
    },
    "amenities": ["pool", "gym", "parking"],
    "availableDate": "2026-03-01",
    "updatedAt": "2026-02-11T14:30:00Z"
  }
}
```

---

## 5. Discovery Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/sitemap.xml` | Dynamic sitemap for all public pages |
| `/robots.txt` | Crawler directives |
| `/feed.xml` | RSS feed for new/updated listings |
| `/api/docs` | (Future) OpenAPI specification |

---

## 6. URL State Reflection

Filter state should always be reflected in the URL:
```
/search?neighborhoods=south-end,noda&budgetMin=1200&budgetMax=2000&bedrooms=2br&hasDeals=true
```

This enables:
- AI agents to construct filtered queries
- Shareable search results
- Browser back/forward navigation

---

## 7. Testing Checklist

Before deploying any page:

- [ ] JSON-LD validates at [Google Rich Results Test](https://search.google.com/test/rich-results)
- [ ] All `data-entity`, `data-field`, `data-action` attributes present
- [ ] Meta tags and Open Graph complete
- [ ] Sitemap includes the page
- [ ] URL query params reflect filter state
- [ ] DOM structure matches established patterns
- [ ] Plain text content is meaningful (strip HTML tags)

---

## File Reference

| File | Purpose |
|------|---------|
| `/lib/ai-readability.ts` | Data attribute constants and helpers |
| `/lib/structured-data.ts` | JSON-LD schema generators |
| `/components/ui/semantic/` | Semantic wrapper components |
| `/hooks/useJsonLd.ts` | Client-side JSON-LD injection |
| `/app/sitemap.ts` | Dynamic sitemap generation |
| `/app/robots.ts` | robots.txt configuration |
| `/app/feed.xml/route.ts` | RSS feed endpoint |
