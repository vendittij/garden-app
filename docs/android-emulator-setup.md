# Android Emulator Setup — Windows 11

For running Garden App locally on an Android emulator (or physical device) from Windows 11.

---

## Requirements

| Component | Version | Notes |
|---|---|---|
| Android Studio | Panda 2 (2025.3.2) or latest stable | |
| JDK | 17 (Azul Zulu or Microsoft OpenJDK) | JDK 18+ breaks Gradle |
| Android SDK Platform | API 35 (Android 15) | |
| SDK Build-Tools | 36.0.0 | |
| AVD system image | Google APIs x86_64, API 35 | |
| Hypervisor | Windows Hypervisor Platform (WHPX) | Built into Windows 11, not HAXM |

**Disk space:** ~15 GB free on C: required.

> Do NOT install Intel HAXM — it was deprecated in January 2023. WHPX is the correct accelerator for Windows 11.

---

## Step 1 — Enable WHPX Hypervisor

Before installing anything:

1. Start → "Turn Windows features on or off"
2. Check **Windows Hypervisor Platform**
3. Click OK → **restart the machine**

Also confirm virtualization is enabled in BIOS:
- Intel: "Intel Virtualization Technology" or "VT-x"
- AMD: "SVM Mode" or "AMD Virtualization"

---

## Step 2 — Install JDK 17

Download **Azul Zulu JDK 17** from azul.com (Windows x64 .msi installer).

After install, set environment variable:
- `JAVA_HOME` = `C:\Program Files\Microsoft\jdk-17.x.x.x-hotspot` (or wherever Zulu installed)

---

## Step 3 — Install Android Studio

1. Download from developer.android.com/studio
2. Run installer, on component screen check:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device
   - **Skip Intel HAXM**
3. Launch Android Studio and complete the setup wizard

---

## Step 4 — Install Required SDK Components

More Actions → SDK Manager:

**SDK Platforms tab** (check "Show Package Details"):
- Android 15 (VanillaIceCream / API 35)
  - Android SDK Platform 35
  - Sources for Android 35
  - Google APIs Intel x86_64 Atom System Image

**SDK Tools tab:**
- Android SDK Build-Tools 36.0.0
- Android SDK Command-line Tools (latest)
- Android Emulator
- Android SDK Platform-Tools

Click Apply, accept licenses.

---

## Step 5 — Set Environment Variables

Control Panel → User Accounts → Change my environment variables:

| Variable | Value |
|---|---|
| `ANDROID_HOME` | `%LOCALAPPDATA%\Android\Sdk` |
| Add to `PATH` | `%LOCALAPPDATA%\Android\Sdk\platform-tools` |
| Add to `PATH` | `%LOCALAPPDATA%\Android\Sdk\emulator` |

Open a **new** terminal and verify:
```bash
adb --version
# Android Debug Bridge version X.X.X
```

---

## Step 6 — Create the AVD

More Actions → Virtual Device Manager → Create Device:

1. Phone category → **Pixel 9** → Next
2. System image → **VanillaIceCream (API 35)** → Download if needed → Next
3. Name: `Pixel_9_API_35` → Finish

---

## Step 7 — Launch Emulator and Verify

Click the green play button next to the AVD. First boot takes 2-5 minutes.

Once Android home screen is visible:
```bash
adb devices
# emulator-5554  device
```

If it shows `offline` or `unauthorized`, wait longer or restart the emulator.

---

## Step 8 — Run Garden App

From the project root with the emulator running:
```bash
npx expo run:android
```

This will:
1. Run `expo prebuild --platform android` if `android/` folder doesn't exist
2. Build the native project via Gradle (slow on first run — ~5-10 min)
3. Install the APK on the emulator
4. Start Metro bundler
5. Launch the app

Subsequent runs are much faster. For JS-only changes Metro hot-reloads without a rebuild.

---

## Physical Android Device (Alternative, Often Faster)

Skip the emulator entirely if you have an Android phone (Android 12+ / API 31+ recommended):

1. Settings → About Phone → tap **Build Number** 7 times
2. Settings → Developer Options → enable **USB Debugging**
3. Connect via USB → accept "Allow USB debugging?" prompt on phone
4. `adb devices` should show the device
5. `npx expo run:android` — Expo auto-detects it

**Wireless (Android 11+):**
1. Developer Options → enable **Wireless Debugging**
2. `adb pair <ip>:<port>` (shown on phone) then `adb connect <ip>:<port>`
3. Unplug USB — fully wireless after this

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Emulator very slow / "No accelerator found" | Confirm VT-x/SVM enabled in BIOS; run `emulator -accel-check` |
| Emulator crashes on launch (window flashes) | AVD settings → Emulated Performance → Graphics: Software. Update GPU drivers then switch back to Automatic |
| WHPX conflict with Docker | Docker Desktop → Settings → General → "Use WSL 2 based engine" (not Hyper-V) |
| `ANDROID_HOME` not found | Open a fresh terminal after setting env vars |
| AV/anticheat blocking hypervisor | Add `%LOCALAPPDATA%\Android\Sdk\emulator\` to AV exclusions |
| Gradle build fails with JDK error | Confirm JDK 17 is active — `java -version` must show 17.x |
| `expo run:android` can't find device | Confirm `adb devices` shows `device` (not offline) before running |
