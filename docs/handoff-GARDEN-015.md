# Handoff — GARDEN-015 iOS Dev Workflow (Codemagic + Sideloadly)

**Branch:** `GARDEN-015-eas-ios-workflow`
**Base:** `develop`
**Status:** In Progress

---

## Goal

Get the app running on a physical iPhone from Windows without a paid Apple Developer account ($99/yr).

**Solution:** Codemagic (free cloud macOS builder) produces an unsigned `.ipa`. Sideloadly (Windows tool) re-signs it with your free Apple ID and installs it via USB.

---

## Architecture

```
Windows machine                    Codemagic (cloud macOS)
───────────────                    ───────────────────────
git push                ────────►  npm ci
                                   expo prebuild --platform ios
                                   pod install
                                   xcodebuild archive (unsigned)
                                   zip .app → .ipa
                        ◄────────  Download GardenApp-unsigned.ipa artifact

Sideloadly (Windows)
────────────────────
Drag .ipa onto Sideloadly
Enter free Apple ID
Signs + installs via USB  ──────►  iPhone
                                   (runs for 7 days, then re-sign)
```

---

## Files Changed

| File | Change |
|---|---|
| `codemagic.yaml` | New — Codemagic workflow for unsigned iOS build |
| `app.json` | Added missing expo plugins: `expo-camera`, `expo-location`, `expo-notifications` |

---

## One-Time Setup

### 1. Codemagic account

1. Go to [codemagic.io](https://codemagic.io) → **Sign up free**
2. Connect your GitHub account when prompted
3. Add the `vendittij/garden-app` repository
4. Codemagic will detect `codemagic.yaml` automatically
5. Navigate to the **ios-unsigned** workflow

### 2. Sideloadly (Windows)

1. **Uninstall** Microsoft Store versions of iTunes and iCloud if you have them
2. Install **iTunes** from [apple.com/itunes](https://www.apple.com/itunes/) (direct download, not Store)
3. Install **iCloud** from [apple.com](https://support.apple.com/en-us/103551) (direct download, not Store)
4. Download and install **Sideloadly** from [sideloadly.io](https://sideloadly.io/) (Windows 64-bit)

### 3. iPhone preparation

1. Settings → **Privacy & Security → Developer Mode** → Enable (required on iOS 16+)
2. Restart when prompted
3. Connect iPhone to Windows PC via USB and tap **Trust** when asked

---

## Build + Install Workflow

### Trigger a build

1. Open [codemagic.io](https://codemagic.io) → your project → **ios-unsigned** workflow
2. Click **Start new build** → select branch (e.g. `develop` or `GARDEN-004-navigation-shell`)
3. Build takes ~15–25 minutes
4. When complete, download **GardenApp-unsigned.ipa** from the Artifacts section

### Install via Sideloadly

1. Connect iPhone to PC via USB
2. Open **Sideloadly**
3. Drag `GardenApp-unsigned.ipa` onto the Sideloadly window
4. Enter your **Apple ID email** — Sideloadly uses it to generate a development certificate (it contacts Apple's servers directly; your credentials are not stored by Sideloadly)
5. Click **Start** — installation takes 1–2 minutes
6. On iPhone: **Settings → General → VPN & Device Management → [your Apple ID] → Trust**
7. Launch **Garden App** from the home screen ✅

### Re-signing (every 7 days)

Apple free-account certificates expire after 7 days. To refresh:
1. Connect iPhone via USB
2. Open Sideloadly → drag the same `.ipa` → Start
3. App data on the phone is **preserved** — only the certificate is refreshed
4. Takes ~1 minute

---

## Limitations (Free Apple ID)

| Limit | Details |
|---|---|
| Certificate expiry | 7 days — re-sign with Sideloadly in ~1 min |
| Sideloaded app slots | 3 apps maximum simultaneously on device |
| Push notifications | APNs requires paid Apple Developer account — not functional until then |
| TestFlight / App Store | Requires paid Apple Developer account ($99/yr) |

**When to get the paid Apple Developer account:**
- When you want to share the app via TestFlight with beta testers
- When you want App Store submission
- The 7-day re-sign cycle is acceptable for solo development

---

## When to Rebuild (New IPA Required)

| Change | New IPA needed? |
|---|---|
| JS/TSX code changes | ❌ — Metro hot reload handles this via `npx expo start --dev-client` |
| New native npm package installed | ✅ — native code changed |
| `app.json` plugin config changed | ✅ — regenerates native files |
| iOS permissions added | ✅ |
| Pure JS npm package installed | ❌ |

**Daily development flow (after initial install):**
```bash
npx expo start --dev-client
# Scan QR code on iPhone → hot reload works instantly
# No new IPA needed for JS-only changes
```

---

## Build Configuration Notes

### Why unsigned?

Sideloadly re-signs the IPA with your personal development certificate on your Windows machine. This means the IPA produced by Codemagic needs no signing credentials — no Apple Developer account is required for the build step.

### Why `expo prebuild` in CI?

`ios/` is gitignored (strategy from GARDEN-002 — cloud builds generate it). `expo prebuild --platform ios --clean` generates `ios/` from `app.json` plugins on the Codemagic macOS worker before every build.

### Why dynamic workspace discovery?

`expo prebuild` generates the Xcode workspace name from `app.json`'s `name` field. Rather than hardcode "Garden App.xcworkspace" (which could break if the name changes), the CI script uses `find` to discover the workspace name at runtime.

---

## Troubleshooting

| Issue | Fix |
|---|---|
| Sideloadly fails: "iTunes not found" | Uninstall Microsoft Store iTunes, install from apple.com directly |
| iPhone not detected by Sideloadly | Ensure you installed iCloud from apple.com (not Store), reconnect USB, tap Trust |
| "Unable to install" on phone | Go to Settings → VPN & Device Management → Trust the certificate |
| App crashes immediately | Check Codemagic build logs — pod install or xcodebuild error |
| Build fails at `pod install` | Check that `expo prebuild` succeeded; a new native package may need a Podfile entry |

---

## Progress

- [x] Branch created: `GARDEN-015-eas-ios-workflow`
- [x] `app.json` — added missing expo plugins (camera, location, notifications)
- [x] `codemagic.yaml` — unsigned iOS build workflow
- [x] Lint passing (0 errors, 0 warnings)
- [x] Tests passing
- [ ] Committed
- [ ] First successful Codemagic build
- [ ] App installed on iPhone via Sideloadly

---

## Next Steps

1. Merge this PR
2. Trigger first Codemagic build on `develop`
3. Download `.ipa` → install via Sideloadly
4. Verify navigation shell (GARDEN-004) renders correctly on device
5. For hot reload on subsequent JS changes: `npx expo start --dev-client`

---

## Last Updated

2026-03-22 — Codemagic + Sideloadly workflow configured. Ready for first build.
