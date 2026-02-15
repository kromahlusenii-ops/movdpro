# Project Vision

## Overview

MOVD Pro is a B2B SaaS platform for apartment locators in Charlotte, NC. It helps locators manage clients, search live inventory from 60+ buildings, and create professional reports—replacing scattered spreadsheets and manual property research.

**Target users:** Independent apartment locators and small locator teams who earn commission by helping renters find apartments.

**Pricing:** $99/month flat rate.

## Goals

- Reduce time locators spend on admin work by 50%
- Provide accurate, real-time inventory from Charlotte's top apartment communities
- Enable locators to deliver professional, shareable reports to clients
- Create a single source of truth for client preferences and property matches
- Make mobile workflows first-class (locators work from their phones)

## Non-Goals (Out of Scope)

- Consumer-facing apartment search (that's MOVD, a separate product)
- Property management tools for landlords
- Lease signing or application processing
- Commission payment processing
- Markets outside Charlotte (for now)

## Key Constraints

### Technical
- Next.js 16 App Router + TypeScript
- PostgreSQL (Supabase) with Prisma ORM
- Vercel deployment with auto-deploy from main
- Mobile-responsive required for all features

### Business
- Single locator pricing only (no team features yet)
- Charlotte market only until product-market fit is proven
- Property data dependent on web scraping (no official APIs)

### Performance
- Search results in <500ms
- Property data freshness: synced daily
- Support 100+ concurrent users per locator account

## Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Separate User/ProUser tables | MOVD (consumer) and MOVD Pro (B2B) have different auth needs and data models |
| Server Components by default | Better performance, simpler data fetching, reduced client bundle |
| Prisma over raw SQL | Type safety, migrations, developer productivity |
| In-memory file parsing | No need for cloud storage for CSV imports (<5MB files) |
| Locator-editable property data | Scraped data has gaps; locators can fill in fees, specials, tips |
| Client field edit audit trail | Locators need to track who changed what for compliance |

## User Experience Principles

1. **Speed over features** — A fast, focused tool beats a slow, feature-rich one
2. **Mobile-first interactions** — Touch targets, swipe gestures, compact layouts
3. **Progressive disclosure** — Show essential info first, details on demand
4. **Professional polish** — Client-facing reports must look premium
5. **Keyboard accessible** — Power users should never need a mouse
6. **Forgiving** — Undo actions, confirmation dialogs for destructive operations

## Success Criteria

| Metric | Target | Current |
|--------|--------|---------|
| Monthly active locators | 50+ | - |
| Clients per locator | 15+ avg | - |
| Trial → paid conversion | 30%+ | - |
| Monthly churn | <5% | - |
| Buildings with inventory | 150+ | 60 |
| Mobile usability score | 90+ | - |

**North Star:** Monthly active locators with 5+ active clients — indicates real adoption and trust.
