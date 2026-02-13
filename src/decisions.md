# src — Decisions

> Log decisions scoped to this directory. Check before making changes
> to avoid contradicting prior choices. Keep entries short.

---

## Feature Components in features/ — 2026-02-13
**Context:** Needed a place for feature-specific components that aren't reusable UI primitives.
**Decision:** Create `components/features/{feature-name}/` for complex feature components.
**Rejected:** Flat components directory (gets messy), colocating with pages (hard to share).
**Impact:** Import wizard lives in `components/features/client-import/`. Follow this pattern.
