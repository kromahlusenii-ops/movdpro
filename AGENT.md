# MOVD Pro — Agent Memory Protocol

## Project Overview
MOVD Pro is a B2B SaaS platform for apartment locators in Charlotte, NC. Priced at $99/month. Built with Next.js 16 (App Router) + Supabase + Tailwind CSS + Vercel + Stripe. Core features: client intake forms, property matching, commission rate tracking, lead management.

---

## The Memory System

Every directory in this project maintains TWO memory files:

1. **`session-log.md`** — Append-only log of what the agent did in this directory
2. **`decisions.md`** — Architecture, design, and product decisions scoped to this directory

These files exist at EVERY level of the project tree. They are scoped — each directory only tracks what happened inside it. This means the agent never needs to scan the full codebase for context. It reads the memory files in the directories it's about to touch.

```
movd-pro/
├── session-log.md              ← project-wide session history
├── decisions.md                ← project-wide decisions
├── src/
│   ├── session-log.md          ← src-level changes
│   ├── decisions.md            ← src-level decisions
│   ├── app/
│   │   ├── session-log.md
│   │   ├── decisions.md
│   │   ├── (dashboard)/
│   │   │   ├── session-log.md
│   │   │   └── decisions.md
│   │   └── api/
│   │       ├── session-log.md
│   │       └── decisions.md
│   ├── components/
│   │   ├── session-log.md
│   │   └── decisions.md
│   ├── lib/
│   │   ├── session-log.md
│   │   └── decisions.md
│   └── hooks/
│       ├── session-log.md
│       └── decisions.md
└── prisma/
    ├── session-log.md
    └── decisions.md
```

---

## How It Works

### RULE 1: Read Before You Code

Before touching ANY directory, read its `session-log.md` and `decisions.md` first. Also read the parent directory's memory files for broader context.

Example — if you're about to work in `src/app/api/`:
1. Read `/session-log.md` (project-level — last 2 entries)
2. Read `/src/app/api/session-log.md` (directory-level — last 3 entries)
3. Read `/src/app/api/decisions.md` (all active decisions)

Do NOT scan the full codebase. Do NOT re-read files you already understand. The memory files ARE your context.

### RULE 2: Write When You're Done

At the end of every session, or when the user says "wrap up" / "done" / "stop" / "commit":

**Append to the `session-log.md` in EVERY directory you touched:**

```markdown
## [DATE]
**What changed:** [1-3 sentences describing what was done in THIS directory]
**Files touched:** [list of filenames only, not full paths]
**Next steps:** [what's unfinished or should happen next here]
```

**Append to `decisions.md` ONLY if a decision was made that affects this directory:**

```markdown
## [Decision Title] — [DATE]
**Context:** [Why this came up — 1-2 sentences]
**Decision:** [What was chosen]
**Rejected:** [What was considered and why it lost]
**Impact:** [What this means going forward for this directory]
```

### RULE 3: Create Memory Files for New Directories

Whenever you create a new directory, IMMEDIATELY create both `session-log.md` and `decisions.md` inside it using the starter templates below. No exceptions.

### RULE 4: Keep It Short

Each `session-log.md` entry: 4-6 lines max. Each `decisions.md` entry: 5-8 lines max. If a `session-log.md` exceeds 100 lines, summarize older entries into a `## Historical Summary` block at the top and delete the originals.

### RULE 5: Bubble Up Cross-Cutting Decisions

If a decision in a subdirectory affects the broader project (new package, schema change, auth flow change, new convention), log it in BOTH the subdirectory's `decisions.md` AND the root `/decisions.md`.

---

## Starter Templates

When creating memory files for a new directory, use these exactly:

### session-log.md
```markdown
# [Directory Name] — Session Log

> Append-only. Never edit previous entries. Newest at the bottom.
> Read the last 2-3 entries at session start before working here.

---
```

### decisions.md
```markdown
# [Directory Name] — Decisions

> Log decisions scoped to this directory. Check before making changes
> to avoid contradicting prior choices. Keep entries short.

---
```

---

## Tech Stack (Don't Re-Discover This)

| Layer | Tech | Notes |
|-------|------|-------|
| Framework | Next.js 16 (App Router) | Server components by default |
| Database | PostgreSQL (Supabase) | Prisma ORM |
| Auth | Magic Link | Passwordless via SendGrid |
| Styling | Tailwind CSS | Utility classes only |
| State | Zustand + Server Components | Zustand for client state |
| Deployment | Vercel | Auto-deploy from main |
| Payments | Stripe | $99/mo flat subscription |
| Testing | Jest + React Testing Library | Required for all features |

## Coding Conventions

- TypeScript strict — no `any`
- Server components by default, `'use client'` only when required
- Colocate types with features, shared types in `types/`
- API routes return `{ data, error }` shape consistently
- Components: PascalCase. Utilities: camelCase
- No barrel exports — import directly from source
- No new packages without a `decisions.md` entry
- **All new code must include unit, UI, and integration tests**

## Domain Language

| Term | Meaning |
|------|---------|
| Locator | The apartment locator (our paying customer) |
| Client | The renter the locator is helping |
| Property | An apartment community/complex |
| Lead | A client before intake is complete |
| Commission | Payment from property to locator on signed lease |
| Intake | The client questionnaire/onboarding process |

## What NOT to Do

- Do NOT skip reading memory files before coding
- Do NOT skip writing memory files after coding
- Do NOT install packages without a `decisions.md` entry
- Do NOT create directories without both memory files
- Do NOT let any memory file exceed 100 lines without summarizing
- Do NOT hardcode Charlotte-specific logic — markets will expand
- Do NOT skip writing tests for new features

---

## Session Kickoff Checklist

Every session, confirm:
- [ ] Read root `/session-log.md` (last 2 entries)
- [ ] Read root `/decisions.md` (scan for relevance)
- [ ] Read memory files in the specific directories you'll work in
- [ ] Confirm the task with the user before writing code
- [ ] If touching multiple directories, read ALL their memory files first
