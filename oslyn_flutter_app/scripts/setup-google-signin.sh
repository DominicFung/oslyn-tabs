#!/bin/bash

# Google Sign-In Setup Script for Flutter App
# This script helps you set up Google Sign-In using your existing OAuth credentials

echo "🔧 Google Sign-In Setup for Flutter App"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "pubspec.yaml" ]; then
    echo "❌ Error: Please run this script from the Flutter app root directory"
    echo "   Expected: oslyn_flutter_app/"
    exit 1
fi

echo "✅ Found Flutter app directory"
echo ""

# Check if secret.json exists in the web directory
if [ -f "../web/secret.json" ]; then
    echo "✅ Found secret.json in web directory"
    echo "📋 Your Google OAuth credentials are available"
    echo ""
    
    # Extract the Google Client ID (basic extraction)
    if command -v jq &> /dev/null; then
        GOOGLE_CLIENT_ID=$(jq -r '.nextauth.google.GOOGLE_CLIENT_ID' ../web/secret.json)
        if [ "$GOOGLE_CLIENT_ID" != "null" ] && [ "$GOOGLE_CLIENT_ID" != "" ]; then
            echo "🔑 Found Google Client ID: $GOOGLE_CLIENT_ID"
            echo ""
            echo "📝 Next steps:"
            echo "1. Add Android platform to your OAuth client in Google Cloud Console"
            echo "2. Use this Client ID: $GOOGLE_CLIENT_ID"
            echo "3. Download google-services.json and place it in android/app/"
            echo "4. Update lib/services/auth_service.dart with your Client ID"
        else
            echo "⚠️  Could not extract Google Client ID from secret.json"
        fi
    else
        echo "⚠️  jq not found. Please install jq to extract credentials automatically"
        echo "   Or manually check ../web/secret.json for GOOGLE_CLIENT_ID"
    fi
else
    echo "⚠️  secret.json not found in web directory"
    echo "   Please ensure your web app's secret.json exists"
fi

echo ""
echo "📚 For detailed setup instructions, see: GOOGLE_SIGNIN_SETUP.md"
echo ""

# Generate SHA-1 fingerprint for Android
echo "🔐 Generating SHA-1 fingerprint for Android..."
if [ -d "android" ]; then
    cd android
    if [ -f "gradlew" ]; then
        echo "Running: ./gradlew signingReport"
        ./gradlew signingReport | grep -A 5 "Variant: debug" | grep SHA1 || echo "Could not extract SHA-1 fingerprint"
    else
        echo "❌ gradlew not found in android directory"
    fi
    cd ..
else
    echo "❌ android directory not found"
fi

echo ""
echo "🎯 Setup Checklist:"
echo "□ Add Android platform to OAuth client in Google Cloud Console"
echo "□ Download google-services.json to android/app/"
echo "□ Update auth_service.dart with your Client ID"
echo "□ Test Google Sign-In in the app"
echo ""
echo "✨ Happy coding!"
