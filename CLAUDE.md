# CLAUDE.md - MOVD Pro

> **Important:** This project uses a memory protocol. See `AGENT.md` for the full protocol.
> Before working in any directory, read its `session-log.md` and `decisions.md` files.
> After completing work, update those files with what you changed.

## AI Agent Guidelines

### Vision Document Requirement

**Before creating or running any task, read `vision.md` in the project root.**

The vision document is the source of truth for:
- Project goals and objectives
- Key constraints and non-negotiables
- Architectural decisions and rationale
- User experience principles
- Success criteria

### Conflict Resolution

If any conflicts are detected between a requested task and the vision document:

1. Stop and identify the specific conflict
2. Explain how the task conflicts with the stated vision
3. Ask the user to clarify how to resolve the conflict before proceeding

Never proceed with a task that contradicts the vision without explicit user approval.

### Progressive Discovery

The `ai/` directory contains additional rules, commands, and workflows. Each folder has an `index.md` describing its contents.

- Only read `ai/*` folders when needed for the specific task
- Skip folders irrelevant to the current domain (e.g., skip frontend folders for backend work)
- The `ai/**/index.md` files are auto-generated—do not edit them manually

## Project Overview

MOVD Pro is a SaaS platform for apartment locators in Charlotte, NC. It helps locators manage clients, search listings, create reports, and match clients with apartments based on preferences.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase) with Prisma ORM
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives + custom components
- **State**: Zustand (client), React Server Components (server)
- **Auth**: Magic link (passwordless) via SendGrid
- **Payments**: Stripe
- **Testing**: Jest + React Testing Library
- **Hosting**: Vercel

## Commands

```bash
npm run dev          # Start dev server on port 3001
npm run build        # Build for production (runs prisma generate first)
npm run test         # Run Jest tests
npm run test:watch   # Run tests in watch mode
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database
npm run db:sync      # Sync listings from scrapers
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Protected routes (clients, search, reports, settings)
│   ├── api/                # API routes
│   ├── intake/             # Public client intake forms
│   ├── login/              # Auth pages
│   └── page.tsx            # Landing page
├── components/
│   ├── features/           # Feature-specific components
│   ├── intake/             # Intake form components
│   ├── ui/                 # Reusable UI primitives (Button, Input, etc.)
│   └── *.tsx               # Shared components (ProLayout, PropertyCard, etc.)
├── lib/
│   ├── import/             # CSV/XLSX import utilities
│   ├── scrapers/           # Listing data scrapers
│   ├── auth.ts             # Auth utilities
│   ├── constants.ts        # App constants (neighborhoods, vibes, etc.)
│   ├── db.ts               # Prisma client
│   ├── pro-auth.ts         # Locator auth + cached data fetchers
│   └── *.ts                # Other utilities
├── types/                  # TypeScript type definitions
├── hooks/                  # React hooks
└── config/                 # App configuration
prisma/
├── schema.prisma           # Database schema
└── seed.ts                 # Seed script
__tests__/                  # Jest tests
```

## Key Patterns

### Server vs Client Components

- Pages in `app/` are Server Components by default
- Use `'use client'` directive for interactive components
- Fetch data in Server Components, pass to Client Components as props

### Data Fetching

- Use cached fetchers from `lib/pro-auth.ts` for user/client data:
  ```typescript
  const user = await getSessionUserCached()
  const clients = await getClientsCached(user.id)
  const locator = await getLocatorProfileCached(user.id)
  ```
- Cache tags: `clients-{userId}`, `locator-{userId}`
- Revalidate with `revalidateTag()` after mutations

### API Routes

- Located in `src/app/api/`
- Always verify auth: `const user = await getSessionUserCached()`
- Always verify ownership before mutations
- Return `NextResponse.json()` with appropriate status codes
- Call `revalidateTag()` after data changes

### Database

- Use Prisma client from `lib/db.ts`
- Key models: `User`, `LocatorProfile`, `LocatorClient`, `Unit`, `Building`
- Client statuses: `active`, `placed`, `archived`

### Components

- UI primitives in `components/ui/` (Button, Input, Card, etc.)
- Use `cn()` from `lib/utils.ts` for conditional classes
- Icons from `lucide-react`

## Conventions

### File Naming
- Components: PascalCase (`ClientList.tsx`)
- Utilities: kebab-case (`parse-file.ts`)
- Types: kebab-case (`client-import.ts`)

### Code Style
- Prefer Server Components when possible
- Keep components focused and single-purpose
- Use TypeScript strictly (no `any` unless necessary)
- Validate inputs with Zod at API boundaries

### Testing (Required)

**All new code must include tests.** When writing a feature:

1. **Unit tests** (`__tests__/unit/`) - Test utility functions and business logic in `lib/`
2. **UI tests** (`__tests__/ui/`) - Test React components with React Testing Library
3. **Integration tests** (`__tests__/integration/`) - Test full flows (API + utilities together)

Test file naming:
- `__tests__/unit/lib/{filename}.test.ts` for lib utilities
- `__tests__/ui/{component-name}.test.tsx` for components
- `__tests__/integration/{feature-name}.test.ts` for flows

Test fixtures go in `__tests__/fixtures/`

Run `npm test` before committing to ensure all tests pass.

## Environment Variables

Required in `.env`:
```
DATABASE_URL=           # Supabase pooler connection string
DIRECT_URL=             # Supabase direct connection string
SENDGRID_API_KEY=       # For magic link emails
STRIPE_SECRET_KEY=      # Stripe API key
STRIPE_WEBHOOK_SECRET=  # Stripe webhook signing secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
GOOGLE_MAPS_API_KEY=    # Server-side Google Maps/Places API (preferred over NEXT_PUBLIC_)
```

## Key Features

1. **Client Management**: Add, edit, import (CSV/XLSX), bulk actions
2. **Listing Search**: Filter by budget, bedrooms, neighborhoods, amenities
3. **Reports**: Generate shareable apartment recommendations for clients
4. **Intake Forms**: Public forms for clients to submit preferences
5. **Subscription**: Stripe-powered $99/month subscription

## Gotchas

- Dev server runs on port 3001 (not 3000)
- Always run `prisma generate` after schema changes
- Use `router.refresh()` after mutations to bust client-side cache
- Supabase connection pooler can timeout on long migrations
