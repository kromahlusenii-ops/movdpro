# app — Decisions

> Log decisions scoped to this directory. Check before making changes
> to avoid contradicting prior choices. Keep entries short.

---

## Dashboard Routes in (dashboard)/ — 2026-02-08
**Context:** Need to separate authenticated routes from public routes.
**Decision:** Use route group `(dashboard)/` for all authenticated pages sharing ProLayout.
**Rejected:** Middleware-only protection (no shared layout), separate apps.
**Impact:** All locator-facing pages go in `(dashboard)/`. Public pages at root.
