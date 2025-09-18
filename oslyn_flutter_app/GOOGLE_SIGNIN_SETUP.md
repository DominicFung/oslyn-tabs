# Google Sign-In Setup for Flutter App

This guide will help you configure Google Sign-In for your Flutter app using your existing OAuth credentials.

## Prerequisites

You already have Google OAuth working in your web app with these credentials:
- `GOOGLE_CLIENT_ID` 
- `GOOGLE_CLIENT_SECRET`

## Step 1: Add Flutter Platforms to Your OAuth Client

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your existing project (the same one used for your web app)
3. Navigate to **APIs & Services** > **Credentials**
4. Find your existing OAuth 2.0 Client ID
5. Click **Edit** and add these platforms:

### Android Platform
- **Application type**: Android
- **Package name**: `com.example.oslyn_flutter_app`
- **SHA-1 certificate fingerprint**: Run this command to get it:
  ```bash
  cd oslyn_flutter_app/android
  ./gradlew signingReport
  ```
  Look for the SHA1 fingerprint in the debug section.

### iOS Platform (if needed)
- **Application type**: iOS
- **Bundle ID**: `com.example.oslynFlutterApp` (or your preferred bundle ID)

### Web Platform (if not already added)
- **Application type**: Web application
- **Authorized redirect URIs**: Your web app's callback URLs

## Step 2: Create Configuration Files

### For Android: google-services.json

1. In Google Cloud Console, go to **Project Settings** > **General**
2. Under "Your apps", click **Add app** > **Android**
3. Enter package name: `com.example.oslyn_flutter_app`
4. Download the `google-services.json` file
5. Place it in: `oslyn_flutter_app/android/app/google-services.json`

### For iOS: GoogleService-Info.plist (if needed)

1. In Google Cloud Console, go to **Project Settings** > **General**
2. Under "Your apps", click **Add app** > **iOS**
3. Enter bundle ID: `com.example.oslynFlutterApp`
4. Download the `GoogleService-Info.plist` file
5. Place it in: `oslyn_flutter_app/ios/Runner/GoogleService-Info.plist`

## Step 3: Update Flutter Code

### Update AuthService with your OAuth Client ID

1. Open `oslyn_flutter_app/lib/services/auth_service.dart`
2. Replace `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com` with your actual client ID
3. The client ID should be the same one used in your web app

### Example:
```dart
final GoogleSignIn _googleSignIn = GoogleSignIn(
  scopes: ['email', 'profile'],
  clientId: '123456789-abcdefghijklmnop.apps.googleusercontent.com',
);
```

## Step 4: Test the Setup

1. Run the Flutter app:
   ```bash
   cd oslyn_flutter_app
   flutter run
   ```

2. Try to sign in with Google
3. Check the console logs for any errors

## Troubleshooting

### Common Issues:

1. **"Sign in failed" error**:
   - Verify the SHA-1 fingerprint is correct
   - Ensure the package name matches exactly
   - Check that the OAuth client is configured for Android

2. **"Developer Error"**:
   - Make sure `google-services.json` is in the correct location
   - Verify the Google Services plugin is added to build.gradle

3. **"Network Error"**:
   - Check your internet connection
   - Verify the OAuth client is properly configured

### Debug Steps:

1. Check console logs for detailed error messages
2. Verify the OAuth client configuration in Google Cloud Console
3. Ensure all configuration files are in the correct locations
4. Test with a clean build: `flutter clean && flutter pub get`

## Security Notes

- Never commit `google-services.json` or `GoogleService-Info.plist` to version control
- Use environment variables or secure configuration for production
- Consider using Firebase App Check for additional security

## Next Steps

Once Google Sign-In is working:
1. Integrate with your existing AWS backend
2. Sync user data with your GraphQL API
3. Implement proper error handling and user feedback
