export default {
  "expo": {
    "name": "app",
    "slug": "app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "myapp",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.domfungus.app",
      infoPlist: {
        NSCameraUsageDescription: "We need camera access to scan QR codes"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.domfungus.app"
    },
    "web": {
      "bundler": "metro",
      "favicon": "./assets/images/favicon.png"
    },
    plugins: [
      [
        "react-native-permissions",
        {
          permissions: ["CAMERA"],
          iosPermissionPods: ["Permission-Camera"]
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
