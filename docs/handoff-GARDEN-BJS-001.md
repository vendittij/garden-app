# Handoff — GARDEN-BJS-001 Babylon.js RN 0.83 Compatibility Spike

**Type:** Spike
**Status:** Complete — Decision Reached
**Date:** 2026-03-22
**Unblocks:** GARDEN-012 (3D Garden Visualization)

---

## Question

Does `@babylonjs/react-native@2.x` support React Native 0.83.2 (Expo SDK 55)? If not, what is the best alternative for 3D garden visualization?

---

## Verdict: Babylon.js is NOT compatible with RN 0.83.2

**Evidence:**

- Latest published: `@babylonjs/react-native@2.0.1` (March 18, 2025)
- The library's own playground app is pinned to **RN 0.79.4** — the highest version the Babylon team has validated against
- The module-level `devDependencies` reference RN 0.73.5, meaning the native build environment has not moved past 0.73
- `peerDependencies` says `"react-native": "*"` — this is not a compatibility guarantee; it means the authors have not restricted the range, not that it works
- No binary exists for RN 0.83 (the v2.x bundle includes compiled native code targeting 0.79.4 at best)
- RN 0.83 ships Bridgeless New Architecture as the default. Babylon.js React Native has not validated this path and has not published any RN 0.83+ release notes or issues indicating work in progress
- No community reports of successful installation on RN 0.83+

**Conclusion:** Installing `@babylonjs/react-native` on RN 0.83.2 will very likely fail at native build time or crash at runtime due to JSI/New Architecture incompatibility. Do not pursue.

---

## Alternatives Evaluated

### Option A — `@react-three/fiber/native` + `expo-gl` ✅ RECOMMENDED

| Package | Version | RN Peer Dep | RN 0.83 Compatible |
|---|---|---|---|
| `@react-three/fiber` | 9.5.0 | >=0.78 | Yes |
| `expo-gl` | 55.0.10 | SDK 55 (RN 0.83) | Yes — exact match |
| `@react-three/drei` | 9.x | same range | Yes |
| `three` | 0.x | — | Yes (pure JS) |

**Why it works for this project:**
- `expo-gl` v55 is literally the Expo SDK 55 package — designed for this exact environment, pre-built EAS binaries included, no custom Podfile or gradle changes needed
- R3F peer dep `>=0.78` explicitly covers RN 0.83.2; R3F 9.3+ includes specific New Architecture compatibility fixes
- Procedural geometry is a Three.js strength: `BoxGeometry`, `CylinderGeometry`, `SphereGeometry`, `LatheGeometry`, `InstancedMesh` — all the primitives needed for garden beds and plant models are first-class
- Orbit controls via `@react-three/drei`'s `<OrbitControls>` — ~10 lines of JSX for pivot/zoom/rotate
- Declarative R3F component model maps naturally to data-driven garden scenes (plant data props → mesh geometry)
- Large, active community; excellent documentation

**Score: 9/10**

---

### Option B — `@shopify/react-native-skia` (2D/2.5D fallback)

- RN 0.83 compatible (`>=0.78` peer dep, actively maintained by Shopify)
- **Not the right tool:** Skia is a 2D vector/raster renderer. A genuine 3D orbit-around-a-garden experience cannot be built on it
- Could render a top-down flat plan view, but loses camera orbit, Z-depth occlusion, perspective, plant height, shadows
- Viable only as a flat garden map — a significant UX downgrade from the design intent

**Score: 4/10** — ruled out for GARDEN-012 as designed

---

### Option C — Downgrade to Expo SDK 50 / RN 0.73

- The only combination with documented Babylon.js RN support (1.8.x, not 2.x)
- Expo SDK 50 reached end of support mid-2025 — no security patches
- RN 0.73 is out of active support
- All other Phase 1 dependencies would need audit and potential downgrade
- A dead-end path that trades a 3D library problem for a platform debt problem

**Score: 2/10** — not recommended

---

## Decision

**Adopt `@react-three/fiber/native` + `expo-gl` as the 3D rendering stack.**

This replaces the original Babylon.js decision in `design.md`. The reasoning for the original choice (JSI-based native rendering, orbit controls, best mobile performance) is equally met by R3F + expo-gl on RN 0.83, with the added benefit that it actually works on our target platform.

---

## Impact on Design Doc

| Field | Old | New |
|---|---|---|
| 3D rendering | `@babylonjs/react-native` — JSI-based, ArcRotateCamera | `@react-three/fiber/native` + `expo-gl` — JSI via expo-gl, OrbitControls via drei |
| Bare workflow requirement | Required for Babylon.js native modules | Still required (expo-gl is a native module) |
| Procedural geometry | BabylonJS Mesh | Three.js BufferGeometry / parametric primitives |

---

## Risks

| Risk | Severity | Mitigation |
|---|---|---|
| `drei` OrbitControls touch behavior on device | Medium | Validate pinch/pan early on physical iOS + Android. Fallback: manual gesture handler via `react-native-gesture-handler` + camera manipulation |
| R3F React version upper bound `<19.3` | Low | Expo SDK 55 ships React 19.0 — in range. Monitor when SDK 56 arrives |
| expo-gl OpenGL ES ceiling | Low | Acceptable for low-poly procedural style. Not a blocker |
| New Arch JSI threading with expo-gl on Android | Medium | expo-gl 55.x built for New Arch; R3F 9.3+ has New Arch fixes. Test render loop on Android early |

---

## Next Steps for GARDEN-012

1. **Install the stack** (in GARDEN-012 branch):
   ```bash
   npx expo install expo-gl
   npm install three @react-three/fiber @react-three/drei
   ```

2. **Smoke test** — a single `<Canvas>` with `<BoxGeometry>` and `<OrbitControls>` on physical iOS and Android via EAS dev client before writing any garden logic

3. **Always import from the native path:**
   ```ts
   import { Canvas } from '@react-three/fiber/native';
   import { OrbitControls } from '@react-three/drei/native';
   ```

4. **Prototype one procedural plant mesh** (cylinder trunk + sphere canopy driven by `height` and `growthStage` props) to validate the data → geometry pipeline

5. **Do not install `expo-three`** — not needed when using R3F; R3F speaks to expo-gl directly

6. **Do not install `@babylonjs/react-native`** — not viable for RN 0.83.2

---

## Key Version Table (2026-03-22)

| Package | Version | Notes |
|---|---|---|
| `@react-three/fiber` | 9.5.0 | Import from `/native` path |
| `expo-gl` | 55.0.10 | Expo SDK 55 native module |
| `@react-three/drei` | 9.x | OrbitControls, helpers |
| `three` | 0.x | Pure JS — no native build |
| `@babylonjs/react-native` | 2.0.1 | ❌ Do not use on RN 0.83 |
