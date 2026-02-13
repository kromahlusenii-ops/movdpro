# prisma — Decisions

> Log decisions scoped to this directory. Check before making changes
> to avoid contradicting prior choices. Keep entries short.

---

## Client Status Enum — 2026-02-08
**Context:** Need to track client lifecycle.
**Decision:** Use string field with values: 'active', 'placed', 'archived'. Not a Postgres enum.
**Rejected:** Postgres enum (hard to migrate), boolean flags (not extensible).
**Impact:** Always use these three status values. Add new statuses carefully.

## Soft Relations for ImportLog — 2026-02-13
**Context:** ImportLog feature needs to be optional until migration runs.
**Decision:** ImportLog model commented out in schema. API handles missing table gracefully.
**Rejected:** Required migration (breaks deployment), separate database.
**Impact:** Uncomment ImportLog after running migration. Check for null importLogId.
