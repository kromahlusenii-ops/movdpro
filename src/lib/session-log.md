# lib — Session Log

> Append-only. Never edit previous entries. Newest at the bottom.
> Read the last 2-3 entries at session start before working here.

---

## 2026-02-13
**What changed:** Added import utilities for CSV/XLSX parsing, column matching, row validation, and duplicate detection.
**Files touched:** import/parse-file.ts, import/column-matcher.ts, import/validate-row.ts, import/duplicate-detector.ts
**Next steps:** None immediate.

## 2026-02-13
**What changed:** Fixed budget filter logic in listings cache - was too restrictive (required entire rent range within budget). Now shows listings with any overlap in budget range.
**Files touched:** listings-cache.ts
**Next steps:** None immediate.

## 2026-02-13
**What changed:** Updated Greystar scraper to try multiple floor plans URL formats (/floorplans/, /floor-plans/, etc.) since some properties like Alexan use different paths.
**Files touched:** scrapers/greystar.ts
**Next steps:** Re-run sync to populate units for buildings with /floor-plans URL format.

## 2026-02-13
**What changed:** Created dedicated Alexan scraper to extract all floor plans from Alexan-style websites. Uses `.floor-plan` elements with `bed-X` class for bedroom counts, `.rent-container` for pricing, and `.detail-bar` for sqft. Successfully synced Alexan Loso from 1 unit to 34 floor plan types (92 available units).
**Files touched:** scripts/sync-alexan.ts (new)
**Next steps:** None immediate. Can reuse sync-alexan.ts for other Alexan properties.

## 2026-02-14
**What changed:** Added client-edits.ts for creating and retrieving client field edit audit records. Functions: createClientFieldEdit, getClientFieldEditHistory, getClientLastEdits, serializeEditsMap.
**Files touched:** client-edits.ts
**Next steps:** None immediate.
