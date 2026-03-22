# Garden App — Ticket Tracker

Tickets are tracked as GitHub Issues at https://github.com/vendittij/garden-app/issues
This file is a quick-reference index. GitHub Issues is authoritative.

---

## Naming Convention

`GARDEN-NNN-brief-description` — branch name format
GitHub Issue title: `GARDEN-NNN: Brief description`

---

## Active

| Ticket | Title | Branch | Status |
|--------|-------|--------|--------|
| GARDEN-002 | Scaffold Expo bare workflow | `GARDEN-002-expo-scaffold` | ✅ Committed, awaiting PR |

---

## Backlog — Phase 1

| Ticket | Title | Labels | Notes |
|--------|-------|--------|-------|
| GARDEN-003 | Supabase + PowerSync integration | `phase-1`, `native` | Install `@powersync/react-native`, `@journeyapps/react-native-quick-sqlite`, `@powersync/common`, `@powersync/supabase-connector`. Add `cjs` to metro sourceExts. |
| GARDEN-004 | Navigation shell | `phase-1` | Tab nav + stack nav, placeholder screens for all Phase 1 features |
| GARDEN-005 | Bundled SQLite plant database | `phase-1` | ~500 plants from OpenFarm + USDA PLANTS + NOAA. Build ingest script. |
| GARDEN-006 | Garden builder UI | `phase-1` | Create/edit beds, dimensions, type (raised/in-ground/container) |
| GARDEN-007 | Plant placement + companion planning | `phase-1` | Add plants to beds, spacing enforcement, companion warnings |
| GARDEN-008 | Growing zone + planting calendar | `phase-1` | GPS/zip → USDA zone → frost dates → planting windows |
| GARDEN-009 | Smart watering engine | `phase-1` | Open-Meteo integration, water need calc, watering log |
| GARDEN-010 | Growth tracking + harvest schedule | `phase-1` | Per-plant schedule, days to maturity, harvest window calc |
| GARDEN-011 | AI photo features | `phase-1` | Gemini Flash integration behind AIVisionService interface. Plant onboarding + progress check. |
| GARDEN-012 | 3D garden visualization | `phase-1` | Stack: `@react-three/fiber/native` + `expo-gl` + `@react-three/drei`. See handoff-GARDEN-BJS-001.md. |
| GARDEN-013 | Harvest tracking + notifications | `phase-1` | Harvest window alerts, log events, missed harvest flags |
| GARDEN-014 | Auth + user accounts | `phase-1` | Supabase auth, email/password + OAuth |
| GARDEN-015 | EAS Build + iOS dev workflow | `phase-1`, `native` | EAS project setup, dev client build, Windows → iOS workflow |

---

## Spikes

_None open._

---

## Backlog — Phase 2

| Ticket | Title | Labels |
|--------|-------|--------|
| GARDEN-P2-001 | AI bed mapping from photo | `phase-2` |
| GARDEN-P2-002 | Social/sharing features | `phase-2` |
| GARDEN-P2-003 | Community plant notes | `phase-2` |
| GARDEN-P2-004 | Advanced weather history integration | `phase-2` |
| GARDEN-P2-005 | Multiple garden support | `phase-2` |

---

## Completed

| Ticket | Title | PR/Commit |
|--------|-------|-----------|
| GARDEN-001 | Initial project setup with design doc and gitignore | 885648e |
| GARDEN-002 | Scaffold Expo bare workflow with core dependencies | 3586520 |
| GARDEN-BJS-001 | Babylon.js RN 0.83 compatibility spike | Decision: R3F + expo-gl. See docs/handoff-GARDEN-BJS-001.md |
