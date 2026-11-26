# Android release

Package name: `com.oslyn.tabs`. The app is not on Google Play yet. `versionName` tracks the iOS app version on main (`1.0.5` in `app.json` / `ios/Oslyn/Info.plist`). `versionCode` is `2` (`android.versionCode` in `app.json`). Release builds compile and target Android API 36 (`expo-build-properties` in `app.json`). Install Android SDK Platform 36 and Build-Tools 36.0.0 before `./gradlew bundleRelease`.

AWS calls use profile `a1` and region `us-east-1`, same as `scripts/fastlane.sh`. The scripts do not print secret values.

## One-time Play Console setup

1. Create the app in Play Console with package name `com.oslyn.tabs`.
2. Enroll in Play App Signing. The upload key is the PKCS12 keystore in Secrets Manager (`oslynstudio/android-upload-keystore`, alias `oslyn-upload`). Passwords and the alias are in `oslynstudio/android-upload-keystore-props`.
3. Build the first AAB locally (commands below) and upload it by hand to Internal testing. The Play Developer API cannot create the first release.
4. In Google Cloud, create a service account. In Play Console, invite that account with permission to upload releases (Release manager, or Admin). Download its JSON key and store the JSON as Secrets Manager secret `oslynstudio/play-store-key` in `us-east-1` (SecretString is the raw JSON).

## Regular internal upload

From `app/`:

```sh
./scripts/fastlane-android.sh
cd android && bundle exec fastlane android internal
```

`fastlane-android.sh` copies `fastlane_assets/android` into `android/fastlane`, writes the upload keystore, and downloads `play-store-key.json` when the secret exists. If `oslynstudio/play-store-key` is not created yet, the script says so and leaves the keystore in place.

The `internal` lane reads the highest version code on the Play internal track, adds one, and passes it as Gradle property `OSLYN_VERSION_CODE`. If Play has no version codes yet, it uses `expo.android.versionCode` from `app.json`. It then runs `bundleRelease` and uploads the AAB to the internal track as a draft.

## First AAB, without Play API

From `app/`:

```sh
./scripts/android-release-env.sh
cd android && ./gradlew bundleRelease
```

Output:

`android/app/build/outputs/bundle/release/app-release.aab`

`android-release-env.sh` writes:

- `android/app/oslyn-upload.keystore` (mode 600)
- `android/keystore.properties` (mode 600) with `OSLYN_UPLOAD_STORE_FILE`, `OSLYN_UPLOAD_STORE_PASSWORD`, `OSLYN_UPLOAD_KEY_ALIAS`, and `OSLYN_UPLOAD_KEY_PASSWORD`

Those files are gitignored. Release signing comes from `plugins/withAndroidReleaseSigning.js`, which also reads the same four names from Gradle properties or the environment. When they are absent, release builds use `debug.keystore`, so `yarn android` keeps working.
