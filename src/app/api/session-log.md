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

## 2026-02-13
**What changed:** Hide buildings with 0 units from building dropdown to prevent showing empty results. Added filter: `units: { some: { isAvailable: true } }`.
**Files touched:** buildings/route.ts
**Next steps:** Fix MAA scraper to handle their SPA/modal-based floor plans page.

## 2026-02-13
**What changed:** Alexan Loso building now has 34 floor plan types (92 available units) after running sync-alexan.ts. Building will now show listings when selected in the UI.
**Files touched:** Database (Unit records)
**Next steps:** None for Alexan. MAA scraper still needs work for 5 remaining empty buildings.

## 2026-02-14
**What changed:** Added client edit history endpoint (GET /api/clients/[id]/history). Added bulk save listings endpoint (POST /api/clients/bulk-save-listings). Updated client PATCH to track field edits via ClientFieldEdit model.
**Files touched:** clients/[id]/history/route.ts, clients/bulk-save-listings/route.ts, clients/[id]/route.ts
**Next steps:** None immediate.
