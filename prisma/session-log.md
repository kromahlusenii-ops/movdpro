# prisma — Session Log

> Append-only. Never edit previous entries. Newest at the bottom.
> Read the last 2-3 entries at session start before working here.

---

## 2026-02-13
**What changed:** Added ImportLog model (currently commented out) for tracking client imports. Schema ready but migration pending due to Supabase connection timeout.
**Files touched:** schema.prisma
**Next steps:** Run `npx prisma db push` when Supabase connection is stable to enable ImportLog tracking.

## 2026-02-14
**What changed:** Added ClientFieldEdit model for audit trail of client field changes. Links edits to LocatorClient and LocatorProfile. Migration pushed successfully.
**Files touched:** schema.prisma
**Next steps:** None immediate.

## 2026-02-14
**What changed:** Separated MOVD and MOVD Pro user tables. Added ProUser and ProMagicLink models. Updated LocatorProfile to reference ProUser. Migrated 11 existing Pro users and 23 magic links.
**Files touched:** schema.prisma, migrations/migrate-to-pro-user.ts, migrations/run-migration.sql
**Next steps:** None immediate. Users may need to log in again due to session cookie name change.
