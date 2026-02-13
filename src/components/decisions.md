# components — Decisions

> Log decisions scoped to this directory. Check before making changes
> to avoid contradicting prior choices. Keep entries short.

---

## UI Primitives in ui/ — 2026-02-08
**Context:** Need reusable base components.
**Decision:** Radix UI primitives wrapped with Tailwind styling in `ui/` folder (Button, Input, Card, etc.).
**Rejected:** shadcn/ui copy-paste (too much boilerplate), raw Radix (unstyled).
**Impact:** Import from `@/components/ui/button` etc. Don't duplicate.

## Feature Components in features/ — 2026-02-13
**Context:** Complex features need multiple related components.
**Decision:** Group feature-specific components in `features/{feature-name}/`.
**Rejected:** Flat structure (messy at scale), colocate with pages (hard to test).
**Impact:** Import wizard at `features/client-import/`, clients at `features/clients/`.

## Icons from lucide-react — 2026-02-08
**Context:** Need consistent icon library.
**Decision:** Use lucide-react for all icons.
**Rejected:** Heroicons (fewer icons), custom SVGs (maintenance burden).
**Impact:** Always import icons from lucide-react. Don't mix icon libraries.
