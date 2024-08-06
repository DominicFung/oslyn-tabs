# Oslyn Tabs iOS / Android App Guide

**Preface**: This project uses:

- Expo - 
- React Native
- Fastlane

### iOS (Development)

```
npm run ios

# old
cd app/ios
npx expo run:ios --device
```

### iOS (Deploy to TestFlight)

```
cd ios
fastlane beta
```

### Prebuild

```
npx expo prebuild --platform ios
```