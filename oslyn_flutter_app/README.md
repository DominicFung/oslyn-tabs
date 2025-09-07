# Oslyn Flutter App

This is the Flutter mobile app for Oslyn Tabs, providing jam session functionality on mobile devices.

## 🚨 IMPORTANT: Security Setup

**NEVER commit sensitive files to Git!** This includes:
- `amplifyconfiguration.json` (contains AWS API keys)
- `secret.json` (contains third-party service keys)
- Any files with `.key`, `.pem`, or `.p12` extensions

## 🔧 Setup Instructions

### 1. Install Dependencies
```bash
flutter pub get
```

### 2. Configure AWS Backend
Copy the template and fill in your real AWS credentials:

```bash
cp assets/amplifyconfiguration.template.json assets/amplifyconfiguration.json
```

Then edit `assets/amplifyconfiguration.json` with your real values:
```json
{
  "aws_project_region": "us-east-1",
  "aws_appsync_graphqlEndpoint": "https://your-endpoint.appsync-api.us-east-1.amazonaws.com/graphql",
  "aws_appsync_region": "us-east-1",
  "aws_appsync_authenticationType": "API_KEY",
  "aws_appsync_apiKey": "your-api-key"
}
```

### 3. Run the App
```bash
# Web
flutter run -d chrome

# iOS Simulator
flutter run -d "iPhone 16 Pro"

# Android Emulator
flutter run -d android
```

## 🏗️ Architecture

This app integrates with your existing AWS AppSync backend:

- **Same GraphQL queries** as your web app
- **Same data models** (JamSession, User, etc.)
- **Same real-time subscriptions** for live updates
- **Same backend** - no duplicate functionality

## 📱 Features

- View public jam sessions
- Join jam sessions (coming soon)
- Real-time updates (coming soon)
- Same jam functionality as web app

## 🔒 Security Notes

- The `assets/` folder is protected in `.gitignore`
- Template files show structure without real credentials
- AWS configuration is loaded at runtime
- No hardcoded API keys in source code

## 🚀 Development

This app follows the same patterns as your web app:
1. **GraphQL queries** in `lib/graphql/`
2. **Data models** in `lib/models/`
3. **Services** in `lib/services/`
4. **UI components** in `lib/`

## 📚 Dependencies

- **Flutter**: UI framework
- **AWS Amplify**: Backend integration
- **HTTP**: GraphQL API calls
- **JSON Serialization**: Data parsing
