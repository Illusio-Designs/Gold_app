# iOS deployment (Amrut B2B)

The app builds & uploads to **TestFlight** from GitHub Actions (macOS runner)
via fastlane — no Mac required on your side. Bundle id: **`com.Amrutt`**,
Firebase: **amrut-jewels** (already configured), team: `8LARDGKQSN`.

## One-time Apple setup (you)

1. **App Store Connect app record** — My Apps → **＋** → New App → platform iOS,
   bundle id `com.Amrutt`, pick the app name + primary language.
2. **App Store Connect API key** — Users and Access → **Integrations** → App
   Store Connect API → generate a key with **App Manager** role → download the
   `AuthKey_XXXX.p8` (you can only download once). Note the **Key ID** and the
   **Issuer ID**.
3. **APNs key for push** — Certificates, IDs & Profiles → **Keys** → **＋** →
   enable **Apple Push Notifications service (APNs)** → download that `.p8`.
   Then Firebase Console → **amrut-jewels** → Project settings → **Cloud
   Messaging** → Apple app `com.Amrutt` → **Upload** the APNs key (with its Key
   ID + your Team ID). This is what makes iOS push actually deliver.

## GitHub secrets (you)

Repo → Settings → Secrets and variables → Actions → **New repository secret**:

| Secret | Value |
|---|---|
| `ASC_KEY_ID` | the API Key ID from step 2 |
| `ASC_ISSUER_ID` | the Issuer ID from step 2 |
| `ASC_KEY_CONTENT` | the `.p8` file, **base64**: `base64 -i AuthKey_XXXX.p8` |

## Ship a build

Actions tab → **iOS Build (TestFlight)** → **Run workflow**. It installs pods,
builds a signed archive (automatic signing creates the profile), and uploads to
TestFlight. After ~10–30 min of Apple processing the build appears in
TestFlight → install via the TestFlight app to test, then submit to the App
Store from App Store Connect when ready.

## Notes

- Version is `1.3` / build `4`; the lane auto-increments the build number per
  upload so re-runs don't collide.
- Push entitlement (`aps-environment`) is wired in `Amrut/Amrut.entitlements`.
- If signing fails on the first run, the fallback is fastlane **match** (stored
  certs) — ask and we'll switch to it.
