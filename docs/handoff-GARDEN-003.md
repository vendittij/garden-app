# Handoff — GARDEN-003 Supabase + PowerSync Integration

**Branch:** `GARDEN-003-supabase-powersync`
**Base:** `develop`
**Status:** In Progress

---

## Goal

Install and configure the offline-first data sync layer. No business logic — structural foundation only. All tables are stubbed in the sync rules and will be filled in by feature tickets (GARDEN-006+).

## Scope

- Install `@powersync/react-native`, `@powersync/common`, `@journeyapps/react-native-quick-sqlite`, `@supabase/supabase-js`
- Add `cjs` to Metro `sourceExts` (required by PowerSync module resolution)
- `src/services/supabase.ts` — typed Supabase client, credentials via `EXPO_PUBLIC_*` env vars
- `src/services/powersync.ts` — `SupabaseConnector` implementing `PowerSyncBackendConnector`
- `config/powersync.yaml` — sync rules scaffold with all Phase 1 tables commented in, ready to uncomment per ticket

## Out of Scope

- Actual Supabase project creation / credentials (no `.env` values committed)
- PowerSync dashboard project setup
- Any database schema / migrations
- Table-level sync rules (filled in per feature ticket)
- Auth UI (GARDEN-014)

---

## Key Decisions

### No separate Supabase connector package

`@powersync/supabase-connector` does not exist on npm. The Supabase connector is a custom implementation of the `PowerSyncBackendConnector` interface — standard PowerSync pattern per their official docs and demo apps.

### Credentials via EXPO_PUBLIC_ env vars

Supabase URL and anon key are read from `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. These are set in `.env.local` for local dev (gitignored) and via EAS Secrets for cloud builds. The PowerSync endpoint is read from `EXPO_PUBLIC_POWERSYNC_URL`.

### uploadData strategy

Each CRUD entry is flushed individually (upsert/update/delete per row). This is correct for the low-write-volume garden use case. For high-throughput tables, batch RPC calls can be substituted later.

---

## Files Changed

| File | Change |
|---|---|
| `metro.config.js` | Added `cjs` to `sourceExts` |
| `src/services/supabase.ts` | New — Supabase client factory |
| `src/services/powersync.ts` | New — `SupabaseConnector` + singleton export |
| `tests/services/powersync.test.ts` | New — 9 unit tests for `SupabaseConnector` |
| `config/powersync.yaml` | New — sync rules scaffold |
| `package.json` / `package-lock.json` | 4 new packages |

---

## Environment Variables Required

```
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_POWERSYNC_URL=https://<powersync-instance>.powersync.journeyapps.com
```

Add these to `.env.local` for local dev. Add to EAS Secrets before any cloud build.

---

## Progress

- [x] Branch created: `GARDEN-003-supabase-powersync`
- [x] Dependencies installed
- [x] `metro.config.js` updated (`cjs` sourceExt)
- [x] `src/services/supabase.ts` created
- [x] `src/services/powersync.ts` created
- [x] `config/powersync.yaml` scaffold created
- [x] `tests/services/powersync.test.ts` — 9 unit tests for `SupabaseConnector`
- [x] Lint passing (0 errors, 0 warnings)
- [x] Tests passing (11/11)
- [ ] Committed

---

## Next Steps After This Branch

- **GARDEN-004:** Navigation shell (tab nav + placeholder screens) — pure JS, can start immediately
- **GARDEN-014:** Supabase auth (email/password + OAuth) — depends on GARDEN-003 merge
- **GARDEN-006+:** Feature tickets begin defining table schemas → uncomment sync rules in `config/powersync.yaml`

---

## Last Updated

2026-03-22 — Foundation complete. Lint clean, tests green, ready for commit review.
