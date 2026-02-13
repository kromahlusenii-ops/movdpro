# api — Decisions

> Log decisions scoped to this directory. Check before making changes
> to avoid contradicting prior choices. Keep entries short.

---

## Return Shape { data, error } — 2026-02-08
**Context:** Need consistent API response format.
**Decision:** All API routes return `{ data }` on success or `{ error }` on failure with appropriate status codes.
**Rejected:** Throwing errors (inconsistent), GraphQL-style (overkill).
**Impact:** Frontend always checks for `error` property first.

## Always Verify Ownership — 2026-02-08
**Context:** Multi-tenant app needs data isolation.
**Decision:** Every mutation must verify the resource belongs to the authenticated user's locator profile.
**Rejected:** RLS-only (some operations need app logic).
**Impact:** Pattern: fetch user → fetch locator → verify ownership → mutate.

## Revalidate Tags After Mutations — 2026-02-13
**Context:** Server-side caching needs invalidation after data changes.
**Decision:** Call `revalidateTag('clients-{userId}')` and `revalidateTag('locator-{userId}')` after any client/locator mutation.
**Rejected:** Time-based revalidation only (stale data visible).
**Impact:** All POST/PATCH/DELETE routes must call revalidateTag.
