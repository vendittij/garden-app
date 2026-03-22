# Handoff — GARDEN-002 Expo Scaffold

**Branch:** `GARDEN-002-expo-scaffold`
**Base:** `develop`
**Status:** Ready for Review

---

## Goal

Scaffold the React Native + Expo bare workflow project with all Phase 1 core dependencies installed and configured. No business logic — structural foundation only.

## Scope

- Expo bare workflow initialized (EAS-ready)
- `src/` folder structure in place
- Core Phase 1 dependencies installed
- TypeScript configured
- ESLint + Prettier configured

## Out of Scope

- Supabase project config / credentials
- PowerSync YAML sync rules
- Any actual screens, components, or business logic
- Plant database population
- Babylon.js scene setup

---

## Tech Stack (from design.md)

| Layer | Choice |
|---|---|
| Framework | React Native + Expo bare workflow |
| Backend | Supabase (`@supabase/supabase-js`) |
| Offline sync | PowerSync (`@powersync/react-native`) |
| 3D rendering | Babylon.js React Native (`@babylonjs/react-native`) |
| AI vision | Google Gemini Flash (service interface only at scaffold stage) |
| Weather | Open-Meteo (no SDK needed — plain fetch) |
| Local DB | expo-sqlite (plant reference data) |

---

## Target Folder Structure

```
src/
  components/       # Shared UI components
  screens/          # Screen-level components
  navigation/       # React Navigation config
  services/         # External service interfaces (AI, weather, sync)
  database/         # SQLite plant DB access layer
  hooks/            # Custom React hooks
  types/            # TypeScript interfaces and types
  utils/            # Pure utility functions
config/             # EAS, app config
```

---

## Progress

- [x] Branch created: `GARDEN-002-expo-scaffold`
- [x] Handoff document created
- [x] Expo bare workflow initialized (bare-minimum template, RN 0.83.2, Expo SDK 55)
- [x] `src/` folder structure created
- [x] Core dependencies installed
- [x] TypeScript configured (strict mode, path aliases `@/*`)
- [x] ESLint (v9 flat config) + Prettier configured
- [x] Lint passing (0 errors, 0 warnings)
- [ ] Committed

---

## Deferred

- **@powersync/react-native** — deferred to GARDEN-003 (Supabase+PowerSync integration). Peer deps: `@journeyapps/react-native-quick-sqlite@^2.5.1`, `@powersync/common@^1.49.0`. Metro config needs `cjs` added to `sourceExts`.
- **@babylonjs/react-native** — **spike ticket required** (see below). Binary packages only confirmed up to RN 0.73; we are on RN 0.83.2. No confirmed binary exists for our RN version.

## Babylon.js Spike — GARDEN-BJS-001

**Problem:** `@babylonjs/react-native` ships RN-version-specific binary packages (`@babylonjs/react-native-iosandroid-0-XX`). As of research (Aug 2025 cutoff + npm verification Mar 2026), no binary exists for RN 0.83+. The library moved to a v2.x package (`@babylonjs/react-native@2.0.1`) whose distribution model is unclear.

**Spike goal:** Determine if Babylon.js supports RN 0.83.2, and if not, evaluate alternatives:
- Continue with Babylon (may require downgrading to Expo SDK 50 / RN 0.73)
- Three.js via `@react-three/fiber` + `expo-gl`
- `@shopify/react-native-skia` for stylized 2D/2.5D fallback
- Defer 3D entirely to Phase 2

**This blocks GARDEN-3D (3D visualization feature).** Does not block Phase 1 core features.

## iOS Build Strategy — EAS Build

`ios/` is **not committed** and never will be. EAS Build generates it on a macOS cloud worker on every build.

**Windows development workflow:**
```bash
# One-time EAS setup (GARDEN-015)
npm install -g eas-cli
eas login
eas build:configure

# Build dev client (cloud, ~10-25 min) — only needed when native changes
eas build --profile development --platform ios

# Daily development — hot reload from Windows
npx expo start --dev-client
```

**What requires a new EAS build:**
- New native npm package installed
- `app.json` plugin config changed
- iOS permissions added

**What does NOT require a rebuild (just restart Metro):**
- All JS/TSX changes
- Pure-JS npm packages

**Prerequisites:** Apple Developer account ($99/yr) + physical iPhone for dev client testing.

Android native files are correctly generated with package `com.garden.app` and are committed.

## Open Questions / Blockers

_None blocking Phase 1 core_

---

## Next Steps After This Branch

- **GARDEN-003:** Supabase + PowerSync integration and sync rules
- **GARDEN-004:** Navigation shell (tab nav + placeholder screens)
- **GARDEN-005:** Bundled SQLite plant database setup
- **GARDEN-BJS-001:** Babylon.js spike — RN 0.83 compatibility investigation

---

## Last Updated

2026-03-21 — Scaffold complete. All deps installed, lint clean, ready for commit review.
