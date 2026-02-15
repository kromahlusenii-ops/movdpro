# MOVD Pro — Decisions

> Log decisions scoped to this project. Check before making changes
> to avoid contradicting prior choices. Keep entries short.

---

## No Client Limit — 2026-02-13
**Context:** Originally had a 20-client limit, but locators need to import large client lists from CRMs.
**Decision:** Remove client limit entirely. Let Stripe subscription be the only gate.
**Rejected:** Soft limit with warning, tiered limits by plan.
**Impact:** Any locator can have unlimited clients. Monitor DB performance.

## Jest for Testing — 2026-02-13
**Context:** Needed a testing framework for the import feature.
**Decision:** Jest + React Testing Library + jest-axe for accessibility.
**Rejected:** Vitest (less mature ecosystem), Playwright-only (overkill for unit tests).
**Impact:** All new features must include unit, UI, and integration tests.

## In-Memory File Parsing — 2026-02-13
**Context:** CSV/XLSX import needed file handling approach.
**Decision:** Parse files in-memory using `xlsx` library. No cloud storage.
**Rejected:** Supabase Storage (added complexity, not needed for small files).
**Impact:** 5MB file size limit. Files never persist to disk/cloud.

## Magic Link Auth — 2026-02-08
**Context:** Needed authentication for locators.
**Decision:** Passwordless magic link via SendGrid.
**Rejected:** Password auth (friction), OAuth (complexity for B2B).
**Impact:** Users authenticate via email link. No passwords stored.

## Separate User Tables — 2026-02-14
**Context:** MOVD (consumer quiz) and MOVD Pro (locator SaaS) need separate user bases.
**Decision:** Create ProUser + ProMagicLink tables for Pro. User table stays for consumers.
**Rejected:** Shared User table with type field, single auth system with roles.
**Impact:** Completely separate auth systems. Pro uses movd_pro_session cookie. LocatorProfile references ProUser.
