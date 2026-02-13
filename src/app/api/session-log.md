# api — Session Log

> Append-only. Never edit previous entries. Newest at the bottom.
> Read the last 2-3 entries at session start before working here.

---

## 2026-02-13
**What changed:** Added import API routes (parse, validate, commit) for CSV/XLSX client import. Added bulk operations endpoint for clients.
**Files touched:** import/parse/route.ts, import/validate/route.ts, import/commit/route.ts, clients/bulk/route.ts
**Next steps:** None immediate.

## 2026-02-13
**What changed:** Removed 20-client limit from clients/route.ts and intake/[slug]/route.ts.
**Files touched:** clients/route.ts, intake/[slug]/route.ts
**Next steps:** Monitor for performance issues with large client lists.
