# iOS Sideloading on Windows — SideStore + Feather Guide

For loading Garden App IPA onto an iPhone (iOS 26+) from Windows 11 without an Apple Developer account.

**Goal:** Get Feather on the device (it has confirmed iOS 26 support). SideStore is the bootstrap vehicle.

---

## Overview

| Tool | Role | iOS 26 | Persistent PC app needed? |
|---|---|---|---|
| SideServer (Windows) | One-time install of SideStore onto device | Unknown but likely | Yes, once only |
| SideStore | On-device app store, bootstraps Feather | Unknown but likely | No (self-refreshing via VPN) |
| Feather v2.6.0+ | On-device signing + install manager | **Confirmed** | No |

Once Feather is installed, it handles everything on-device. SideStore and SideServer are only needed for the initial bootstrap.

---

## Step 1 — Install SideServer for Windows

1. Download **SideServer for Windows v1.0.0.2.1** from GitHub (search: `SideStore/SideServer-Windows`)
2. Also download the latest **SideStore IPA** from github.com/SideStore/SideStore/releases
3. Install iTunes and iCloud for Windows from Apple's website (direct installers, not Microsoft Store) — SideServer needs these same DLLs
4. Connect iPhone via USB
5. Open SideServer, sign in with your Apple ID (use a secondary/burner Apple ID — not your primary)
6. Select the SideStore IPA and click Install

> **Note:** SideServer is a WIP x86 build. Run as Administrator. If it crashes, try compatibility mode (Windows 8).

---

## Step 2 — Generate a Pairing File (Required for SideStore)

SideStore needs a pairing file (`.mobiledevicepairing`) to communicate with the device without a persistent desktop app.

**Option A — pymobiledevice3 (Windows CLI):**
```bash
pip install pymobiledevice3
python -m pymobiledevice3 pair
# Output: saves pairing file, note the path
```

**Option B — PlumeImpactor (on-device):**
- Install PlumeImpactor IPA via SideServer first, run it on device, it generates the pairing file and exports it

Import the pairing file into SideStore via the on-device setup wizard.

---

## Step 3 — Trust SideStore and Enable Developer Mode

1. After SideServer installs SideStore on the device:
   - **Settings → General → VPN & Device Management** → find your Apple ID → **Trust**
2. **Settings → Privacy & Security → Developer Mode** → toggle on → restart phone → confirm

---

## Step 4 — Open SideStore and Install Feather

1. Open SideStore on the device
2. Complete the VPN/pairing setup (SideStore uses a local VPN to self-sign — this is normal)
3. Go to **Sources** and add the Feather source, or go to **My Apps → +** and load Feather IPA directly
4. Feather IPA: github.com/khcrysalis/Feather/releases — download v2.6.0 or later (iOS 26 confirmed)
5. Install Feather via SideStore

---

## Step 5 — Configure Feather with a Free Apple ID Certificate

Feather signs apps using a certificate pair (p12 + mobileprovision). With a free Apple ID these are valid for 7 days.

**Generate the certificate on Windows using pymobiledevice3:**
```bash
pip install pymobiledevice3
python -m pymobiledevice3 developer certificate --p12-output cert.p12 --mobileprovision-output cert.mobileprovision
```

Or use any tool that can produce a development-signed p12 from your Apple ID (Xcode on a Mac is the easiest if you have access to one).

**Import into Feather:**
1. Open Feather → Certificates tab → Import
2. Select `cert.p12` + `cert.mobileprovision`
3. Enter the p12 password

---

## Step 6 — Install Garden App with Feather

1. Transfer `GardenApp-unsigned.ipa` to your iPhone (AirDrop, iCloud Drive, or Files app via USB)
2. Open Feather → Library → Import IPA → select the file
3. Tap the IPA → Sign → Install
4. Go to **Settings → General → VPN & Device Management** → Trust the certificate
5. Open Garden App

---

## Re-signing (Every 7 Days with Free Apple ID)

Free Apple ID certificates expire every 7 days. To refresh:
- Open Feather → My Apps → tap Garden App → Re-sign
- Or set up **SideStore Wi-Fi refresh**: SideStore can auto-refresh apps over Wi-Fi when connected to the same network as a PC running a lightweight SideStore helper

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| SideServer crashes on launch | Missing Apple DLLs | Ensure iCloud + iTunes from Apple direct installers are installed, run as Admin |
| SideStore won't open on iOS 26 | UIKit API incompatibility | Check SideStore GitHub for an iOS 26 update; try SideStore beta channel |
| Feather certificate error | Expired p12 | Regenerate certificate, re-import into Feather |
| App crashes on launch after install | Missing entitlements | Feather may need the IPA re-bundled with the correct provisioning profile |
| "Unable to install" from Feather | Developer Mode off | Settings → Privacy & Security → Developer Mode → on |

---

## Notes

- Always use a **secondary Apple ID** for sideloading — not your primary personal account
- The Garden App IPA comes from the Codemagic `ios-unsigned` workflow (see `codemagic.yaml`)
- iOS 26 is Apple's year-based naming (formerly iOS 19) — tools targeting "iOS 18 and below" may not work
- Check Feather and SideStore GitHub release notes before each use for iOS version compatibility updates
