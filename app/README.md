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

### Prebuild

```
npx expo prebuild --platform ios
```