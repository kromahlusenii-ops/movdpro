# (dashboard) — Decisions

> Log decisions scoped to this directory. Check before making changes
> to avoid contradicting prior choices. Keep entries short.

---

## Server Components for Data, Client for Interaction — 2026-02-13
**Context:** Dashboard pages need both data fetching and interactivity.
**Decision:** Page components are Server Components that fetch data, then render Client Components for interactive parts.
**Rejected:** Full client-side pages (slower initial load), full server (no interactivity).
**Impact:** Pattern: page.tsx fetches data, passes to 'use client' components.
