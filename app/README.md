# Oslyn Tabs iOS / Android App Guide

**Preface**: This project uses:

- Expo - 
- React Native
- Fastlane

### iOS (Development)

```
yarn install
cd ios
pod install

npm run ios
```

Open workspace `Oslyn.xcworkspace`. NOT `.xcproj`

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