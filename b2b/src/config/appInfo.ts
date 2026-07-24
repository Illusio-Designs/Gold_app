// The app version shown in the Profile screen.
//
// This is the version users install from the Play Store / App Store, so keep
// it in sync with the native build on each release:
//   - Android: android/app/build.gradle  →  versionName
//   - iOS:     ios project  →  MARKETING_VERSION (CFBundleShortVersionString)
//
// (We intentionally don't fetch the version from the backend anymore — store
// builds are the single source of truth for the installed version.)
export const APP_VERSION = '1.2';
