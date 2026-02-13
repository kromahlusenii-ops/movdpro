# MOVD Pro — Session Log

> Append-only. Never edit previous entries. Newest at the bottom.
> Read the last 2-3 entries at session start before working here.

---

## 2026-02-13
**What changed:** Added client CSV/XLSX import wizard at `/clients/import` with 4-step flow (Upload → Map Columns → Review → Import). Added bulk actions to client list (delete, change status, filter). Removed 20-client limit. Added Jest test suite (133 tests).
**Files touched:** package.json, prisma/schema.prisma, CLAUDE.md
**Next steps:** Run database migration for ImportLog model when Supabase connection is stable. Currently ImportLog is commented out in schema.

## 2026-02-13
**What changed:** Fixed router cache issue where clients list showed empty after import. Added `router.refresh()` before navigation. Created CLAUDE.md with project documentation and testing requirements.
**Files touched:** CLAUDE.md
**Next steps:** None immediate. Import feature is complete and deployed.
