# lib — Decisions

> Log decisions scoped to this directory. Check before making changes
> to avoid contradicting prior choices. Keep entries short.

---

## Cached Fetchers in pro-auth.ts — 2026-02-08
**Context:** Need to avoid redundant database queries.
**Decision:** Use Next.js `unstable_cache` with tags for user/client/locator data in pro-auth.ts.
**Rejected:** SWR (client-side only), manual memoization (error-prone).
**Impact:** Always use getClientsCached, getLocatorProfileCached, etc. Don't query directly.

## Zod for Validation — 2026-02-13
**Context:** Need input validation for import feature.
**Decision:** Use Zod schemas for validating parsed CSV/XLSX data.
**Rejected:** Manual validation (verbose), Yup (less TypeScript-friendly).
**Impact:** Define Zod schemas for any user input validation.

## xlsx Library for Parsing — 2026-02-13
**Context:** Need to parse CSV and XLSX files.
**Decision:** Use `xlsx` (SheetJS) for both CSV and XLSX parsing.
**Rejected:** Separate libraries (inconsistent API), papaparse (CSV only).
**Impact:** All spreadsheet parsing goes through lib/import/parse-file.ts.
