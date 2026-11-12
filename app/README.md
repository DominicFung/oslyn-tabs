# Oslyn Tabs iOS / Android App Guide

**Preface**: This project uses:

- Expo SDK 58 (React Native 0.88, New Architecture)
- Fastlane for TestFlight and Play internal uploads

App Store Connect has required Xcode 26 since 28 April 2026. This SDK needs Xcode 26.4 or newer. The iOS deployment target is 16.4.

### iOS (Development)

On a Mac, from `app/`:

```
yarn install
cd ios
pod install
cd ..
npm run ios
```

Open `ios/Oslyn.xcworkspace`, not the `.xcodeproj`. `pod install` regenerates `Podfile.lock` and the `Pods` directory. CocoaPods must be installed (`gem install cocoapods` or `brew install cocoapods`). There is no checked-in `Podfile.lock` for SDK 58; the first `pod install` creates it.

### iOS (Deploy to TestFlight)

Marketing version is `MARKETING_VERSION` in `ios/Oslyn.xcodeproj` (currently 1.0.4). Build number is `CURRENT_PROJECT_VERSION` (currently 10). `Info.plist` reads both through `$(MARKETING_VERSION)` and `$(CURRENT_PROJECT_VERSION)`. `fastlane beta` increments the build number, then archives and uploads.

```
cd ios
pod install
fastlane beta
```

`fastlane beta` still expects `ios/fastlane/AuthKey_6889KV46S3.p8` next to the Fastfile, the `Oslyn` scheme, and `Oslyn.xcworkspace`.

### Android (Google Play)

Release bundles target API 36, compile against API 37, and are signed with an upload key that is not in git. The store bundle contains `arm64-v8a` and `x86_64` only, so every native library in the AAB is 16 KB aligned.

```
cp android/keystore.properties.example android/keystore.properties
# fill storeFile, storePassword, keyAlias, and keyPassword

yarn android:bundle

cd android
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=/absolute/path/play-service-account.json fastlane beta
```

`src/amplifyconfiguration.json` has to exist before either command. It is gitignored and is the same file the iOS bundle uses.

Release builds do not request the camera, microphone, storage, or advertising-id permissions. `SYSTEM_ALERT_WINDOW` stays on debug builds only. R8 minify is on for release (`android.enableMinifyInReleaseBuilds`).

### Prebuild

Native projects are committed. Regenerating them:

```
npx expo prebuild --platform ios
npx expo prebuild --platform android
```

`--clean` deletes `ios/fastlane`. Copy that directory aside first. After an iOS prebuild, set `CURRENT_PROJECT_VERSION` back to the current TestFlight build number before the next upload.

### Troubleshooting
You'll mostly be following the same steps:

```
# check for version dependnecy issues
npx expo-doctor

# reinstall and link dependencies
rm -rf node_modules package-lock.json yarn.lock
yarn install

# reinstall pod files
rm -rf ~/Library/Developer/Xcode/DerivedData
rm -rf Pods Podfile.lock
pod install
```

### iOS (Deploy to TestFlight)

Step 1: Update the version number in line 22 of app/ios/Oslyn/info.plist

Step 2:
```
cd ios
fastlane beta
```

### Android (Google Play)

The Android project targets API 36 and signs release bundles with an upload key that is not in git. iOS signing and the TestFlight lane are unchanged.

One-time setup is the checklist in the Play release pull request: Play Console app `com.oslyn.tabs`, Play App Signing, an upload keystore, and a service-account JSON.

```
cp android/keystore.properties.example android/keystore.properties
# fill storeFile, storePassword, keyAlias, and keyPassword

# local signed AAB (versionCode stays at the value in android/app/build.gradle)
yarn android:bundle

# internal-track upload (bumps versionCode, then uploads)
cd android
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON=/absolute/path/play-service-account.json fastlane beta
```

`src/amplifyconfiguration.json` has to exist before either command. It is gitignored and is the same file the iOS bundle uses.

Release builds do not request the camera, microphone, storage, or advertising-id permissions. `SYSTEM_ALERT_WINDOW` stays on debug builds only.

This binary targets API 36, which Play requires, but the Expo SDK 52 native libraries (`libreactnative.so`, `libhermes.so`, `libexpo-modules-core.so`) are aligned to 4 KB pages. Play also requires 16 KB page support for apps targeting Android 15 or higher, and Expo only ships that from SDK 53.0.14. That upgrade is not in this change because it would replace the React Native version the iOS TestFlight build is using.

### Prebuild

```
npx expo prebuild --platform ios
```