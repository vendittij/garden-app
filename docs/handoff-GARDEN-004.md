# Handoff — GARDEN-004 Navigation Shell

**Branch:** `GARDEN-004-navigation-shell`
**Base:** `develop`
**Status:** Complete — ready for PR

---

## Goal

Wire up the full React Navigation skeleton — 5-tab bottom navigator, 4 stack navigators, 12 placeholder screens, typed route params. No business logic — structural shell only.

## Scope

- `src/types/navigation.ts` — typed param lists for all navigators
- `src/navigation/AppNavigator.tsx` — root stack (auth gate placeholder → MainTabs)
- `src/navigation/TabNavigator.tsx` — 5-tab bottom navigator
- `src/navigation/GardenStack.tsx` — Garden tab stack
- `src/navigation/PlannerStack.tsx` — Planner tab stack
- `src/navigation/PlantsStack.tsx` — Plants tab stack
- `src/navigation/SettingsStack.tsx` — Settings tab stack
- 12 placeholder screens (all tabs)
- Updated `App.tsx` — `NavigationContainer` + `AppNavigator`
- `tests/App.test.tsx` — updated smoke tests for `GardenScreen`

## Out of Scope

- Auth logic (GARDEN-014) — `LoginScreen` is a placeholder; `AppNavigator` defaults to MainTabs
- Any real screen content — that's for GARDEN-006 through GARDEN-013
- Tab icons as image assets — using emoji Text for now, suitable placeholder

---

## Tab Structure

| Tab | Icon | Initial Screen | Stack Screens | Tickets |
|---|---|---|---|---|
| Garden | 🌿 | GardenScreen | BedDetail, GardenVisualization | GARDEN-006, 007, 012 |
| Planner | 📅 | PlannerScreen | WateringDetail, HarvestDetail | GARDEN-008, 009, 010, 013 |
| Plants | 🔍 | PlantBrowser | PlantReferenceDetail | GARDEN-005, 007 |
| Camera | 📷 | CameraScreen | — (single screen) | GARDEN-011 |
| Settings | ⚙️ | SettingsScreen | ZoneSettings | GARDEN-008 (zone), GARDEN-014 |

---

## Key Decisions

### Test strategy: screen isolation, not full navigator

React Navigation's native-stack depends on `react-native-screens` native bindings that cannot run in Jest. Rather than maintain a brittle full-navigator mock, tests render individual screens directly with a `NavigationContainer` wrapper. This is sufficient for a smoke-test of placeholder screens; integration testing of navigation flows requires a device or Detox.

### AppNavigator defaults to MainTabs

`Login` screen is registered but `MainTabs` is the initial route. GARDEN-014 will add the real auth check (if no Supabase session → Login; post-sign-in → navigate to MainTabs).

### Tab icons as Text (emoji)

Using a `<Text>` emoji component as tab icons. No icon library added — avoids a native dependency for placeholder work. GARDEN-006+ can swap in a proper icon set (e.g., `@expo/vector-icons`) when the real UI is built.

---

## Files Changed

| File | Change |
|---|---|
| `App.tsx` | Replaced placeholder View with `NavigationContainer` + `AppNavigator` |
| `src/types/navigation.ts` | New — typed param lists + screen prop types |
| `src/navigation/AppNavigator.tsx` | New — root stack |
| `src/navigation/TabNavigator.tsx` | New — 5-tab bottom navigator |
| `src/navigation/GardenStack.tsx` | New |
| `src/navigation/PlannerStack.tsx` | New |
| `src/navigation/PlantsStack.tsx` | New |
| `src/navigation/SettingsStack.tsx` | New |
| `src/screens/garden/GardenScreen.tsx` | New — placeholder |
| `src/screens/garden/BedDetailScreen.tsx` | New — placeholder |
| `src/screens/garden/GardenVisualizationScreen.tsx` | New — placeholder |
| `src/screens/planner/PlannerScreen.tsx` | New — placeholder |
| `src/screens/planner/WateringDetailScreen.tsx` | New — placeholder |
| `src/screens/planner/HarvestDetailScreen.tsx` | New — placeholder |
| `src/screens/plants/PlantBrowserScreen.tsx` | New — placeholder |
| `src/screens/plants/PlantReferenceDetailScreen.tsx` | New — placeholder |
| `src/screens/camera/CameraScreen.tsx` | New — placeholder |
| `src/screens/settings/SettingsScreen.tsx` | New — placeholder |
| `src/screens/settings/ZoneSettingsScreen.tsx` | New — placeholder |
| `src/screens/auth/LoginScreen.tsx` | New — placeholder |
| `tests/App.test.tsx` | Updated — GardenScreen smoke tests |

---

## Progress

- [x] Branch created: `GARDEN-004-navigation-shell`
- [x] `src/types/navigation.ts` — all param lists + screen prop types
- [x] All 4 stack navigators created
- [x] `TabNavigator.tsx` — 5-tab bottom nav
- [x] `AppNavigator.tsx` — root stack
- [x] `App.tsx` updated — `NavigationContainer` + `AppNavigator`
- [x] 12 placeholder screens
- [x] `tests/App.test.tsx` — 3 passing smoke tests
- [x] Lint passing (0 errors, 0 warnings)
- [x] Tests passing (12/12)
- [x] Committed: `db4263a`
- [ ] PR raised to `develop`

---

## Next Steps After This Branch

- **GARDEN-005:** Bundled SQLite plant database (pure JS — can start immediately)
- **GARDEN-006:** Garden builder UI — will fill in `GardenScreen` and `BedDetailScreen`
- **GARDEN-014:** Auth — will fill in `LoginScreen` and wire the `AppNavigator` auth gate

---

## Last Updated

2026-03-22 — Committed. Ready for PR to develop.
