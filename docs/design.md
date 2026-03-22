# Garden App — Design Document
**Date:** 2026-03-21
**Status:** Approved

---

## 1. Vision

A mobile-first garden planning and management app that helps users design, plant, maintain, and harvest their gardens successfully. The app is grounded in real horticultural data, adapts to each user's specific space and climate, and uses AI and 3D visualization to make gardening intuitive for beginners and powerful for experienced growers.

Built for public use — multi-user from day one, with the first user being the developer.

---

## 2. Platform & Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Mobile framework | React Native + Expo (bare workflow) | Single codebase for iOS + Android, native modules support, EAS Build |
| Expo workflow | Bare (EAS Build) | Required for Babylon.js native modules; standard for production RN apps |
| Primary test device | iOS | Developer's only device; Android covered by same codebase |
| Backend | Supabase | Auth, Postgres, real-time sync, file storage — all-in-one, generous free tier |
| Offline sync | PowerSync | Official Supabase connector, no custom sync code, SQLite on-device, last-write-wins |
| AI vision | Google Gemini Flash | Strongest free tier (1,500 req/day), native image support, swappable interface |
| Weather API | Open-Meteo | Free, no API key, 16-day forecast, 1km resolution, best free data quality. Frost alerts computed in-app from `temperature_2m_min` |
| Plant data | Bundled SQLite (~500 plants, ~2–5MB) | OpenFarm dump (CC BY-SA) + USDA PLANTS CSV (public domain) + NOAA frost dates for planting windows |
| 3D rendering | `@react-three/fiber/native` + `expo-gl` + `@react-three/drei` | JSI via expo-gl (SDK 55 native module), `<OrbitControls>` from drei, procedural Three.js geometry. Babylon.js ruled out — no RN 0.83 support (see GARDEN-BJS-001). |
| 3D model strategy | Procedural geometry (Three.js primitives), cached locally | Generated from growth parameters at runtime — no asset files. BoxGeometry (beds), CylinderGeometry + SphereGeometry (plants). Cached per plant instance, updated on growth events |

---

## 3. Architecture

### 3.1 Offline-First Strategy

- All core features work without internet
- Data lives locally in SQLite, synced to Supabase when online
- Internet-required features: weather recommendations, AI photo analysis, plant API fallback
- Sync strategy: last-write-wins via PowerSync (timestamp-based, enforced server-side)
- Plant reference data (bundled SQLite) is read-only, never synced

### 3.2 AI Service Layer

Built as a swappable interface — the app calls `AIVisionService.analyzePlant(image, plantName)` and the underlying provider (Gemini Flash today, anything else tomorrow) is a config-level swap. No provider-specific code leaks into feature logic.

### 3.3 3D Model Architecture

- Models are **procedurally generated** at runtime from growth parameters (height, stage, leaf density, fruiting state)
- Same inputs always produce the same geometry (deterministic)
- Generated geometry is **cached locally** per plant instance
- Cache is invalidated and regenerated when growth data changes (weekly time-based update or photo-triggered correction)
- No asset files to download — models are pure geometry derived from data

---

## 4. Core Features

### 4.1 Garden Builder

- Users define one or more beds/zones per account
- Each bed has: name, type (raised/in-ground/container), dimensions (width × length in feet), optional notes
- Standard visual templates for raised bed and in-ground (bed itself is modeled but lower detail priority than plants)
- Beds are arranged on a top-level garden canvas — users can have multiple beds visible at once

### 4.2 Plant Database

- ~500 common vegetables, herbs, and fruits bundled in SQLite at install (~2–5MB)
- Data fields per plant:
  - Common name, botanical name
  - Days to germination, days to maturity
  - Spacing requirements (in-row and between-row)
  - Companion plants (beneficial and antagonistic)
  - Water needs (low/medium/high + specific requirements)
  - Sun requirements
  - Frost tolerance / hardiness
  - Growth stages with expected height/characteristics per stage
  - Planting window by USDA zone
  - Harvest indicators
- **Sources:**
  - **OpenFarm** (CC BY-SA 4.0) — primary backbone: spacing, companion plants, water needs, growth stages, harvest indicators
  - **USDA PLANTS** (public domain) — botanical names, hardiness zones, taxonomic verification
  - **NOAA frost date data** (public domain) — used to derive planting windows algorithmically per USDA zone
  - Manual curation for ~100–150 gap records (fruit trees, obscure herbs) using extension publications as reference
- **Planting windows** derived algorithmically: `last_frost_date - days_to_transplant` / `first_frost_date - days_to_maturity` — more accurate than static tables, recalculated per user's zip code

### 4.3 Plant Placement & Companion Planning

- Users add plants to beds by selecting from the database
- App enforces/suggests spacing based on plant data
- Companion planting warnings and suggestions shown during placement
- Planting grid shows which squares are available, occupied, or incompatible

### 4.4 Growing Zone & Planting Calendar

- Zone detected via optional GPS or manual zip/city entry
- Zone mapped to USDA hardiness zone + local frost dates
- Planting calendar generated per plant per user's zone
- Users can plan ahead — add plants to the schedule before the planting window opens

### 4.5 Watering Engine

- Smart recommendations based on:
  - Plant-specific water needs
  - Soil type (user-defined per bed)
  - Current weather (temperature, recent rainfall)
  - Upcoming forecast (don't water if rain is coming)
  - User's manual watering log
  - Irrigation schedule (if user has an automatic system, they can input it)
- Heatwave/drought override — app can recommend off-schedule checks even if the user watered recently
- Weather data: Open-Meteo API (internet required)

### 4.6 Growth Tracking & Schedule

- Each planted instance has:
  - Species
  - Bed + position
  - Date planted
  - Starting growth stage (detected by AI or manually entered)
  - Expected harvest window (calculated from planting date + starting stage + days to maturity)
- Schedule adjusts dynamically when AI photo analysis detects plant is ahead or behind expected stage

### 4.7 AI Photo Features

**Plant Onboarding Photo** (at planting time):
- User takes a photo of the plant + provides species name
- Gemini Flash analyzes image → determines current growth stage
- App sets schedule based on detected stage, not from zero
- Example: store-bought tomato seedling at 8" → detected as "early vegetative" → harvest date adjusted accordingly

**Progress Check Photo** (any time after planting):
- User takes a photo of a plant in their garden
- App compares observed stage to expected stage for that date
- Schedule adjusted forward or backward based on finding
- Photo saved to plant's journal

**Photo Journal**:
- All progress photos stored chronologically per plant
- Visual history of the plant's growth over the season

**Phase 2 — Bed Mapping from Photo**:
- Upload photo of garden bed → AI detects boundaries and pre-fills dimensions
- Deferred to Phase 2

### 4.8 3D Garden Visualization

- Full 3D scene of the user's garden — pivotable (orbit controls), zoomable
- Each plant rendered as a low-poly procedural model
- Model reflects current growth state:
  - Height scales with real growth data
  - Stage transitions change model geometry (seedling → leafy → flowering → fruiting)
  - Fruiting plants show visible fruit
- Garden bed rendered as standard template (raised bed frame or in-ground border)
- Scene updates when:
  - Time passes (weekly growth increments)
  - AI photo analysis adjusts growth stage
  - User manually logs an observation

### 4.9 Harvest Tracking

- Harvest window calculated per plant (planting date + starting stage + days to maturity)
- Notifications sent ~1 week before expected harvest window
- Users can log harvest events (date, yield notes)
- Missed harvests flagged in the app

---

## 5. Notifications

All notifications are individually toggleable by the user.

| Notification | Trigger |
|---|---|
| Harvest window alert | ~7 days before expected harvest |
| Watering reminder | Smart engine determines watering is needed |
| Weather alert | Heatwave or frost warning for user's location |
| Planting window open | Season has reached optimal window for a planned plant |
| Weekly garden summary | Weekly digest of garden status |

---

## 6. User Accounts & Data

- Auth via Supabase (email/password + OAuth options)
- User data synced to Supabase when online
- Offline changes queued and synced on reconnect
- Photos stored in Supabase Storage
- Each user's garden data is private by default

---

## 7. Phased Rollout

### Phase 1 — Core App
- Garden builder (beds, plants, placement)
- Plant database (bundled SQLite)
- Growing zone + planting calendar
- Growth tracking + harvest notifications
- Smart watering engine
- AI photo onboarding + progress check
- Photo journal
- 3D garden visualization
- Basic notifications

### Phase 2 — Enhancements
- AI bed mapping from photo
- Social/sharing features (share your garden)
- Community plant notes
- Advanced weather history integration
- Multiple garden support (e.g. front yard + back yard)

---

## 8. Research Decisions (Resolved)

All pre-build research items are resolved:

| Item | Decision | Notes |
|---|---|---|
| Weather API | Open-Meteo | Free, no key, 16-day forecast, 1km resolution. Frost alerts computed in-app. |
| 3D library | `@react-three/fiber/native` + `expo-gl` | Spike GARDEN-BJS-001: Babylon.js `@2.0.1` only validated to RN 0.79.4, not compatible with RN 0.83.2. R3F 9.5 peer dep `>=0.78`, expo-gl 55 targets RN 0.83 exactly. Orbit controls via `@react-three/drei`. |
| Offline sync | PowerSync | Official Supabase connector, YAML sync rules, zero custom sync code |
| Plant data | OpenFarm + USDA PLANTS + NOAA | CC BY-SA + public domain sources only. ~100–150 records need manual curation. |

---

## 9. Key Design Principles

- **Offline-first** — core value never requires internet
- **Reality-grounded** — schedules adjust to what's actually happening, not just the calendar
- **Beginner-friendly** — a first-time gardener should be able to set up and succeed
- **Scalable** — built for one user now, ready for thousands without rewriting
- **Swappable services** — AI, weather, and data providers are behind interfaces, not hardcoded
