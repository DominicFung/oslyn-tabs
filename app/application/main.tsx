// App.js or screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import { Platform, View, Button, StyleSheet } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import QRScanner from './QRScanner';

export default function HomeScreen() {
  const [cameraOn, setCameraOn] = useState(false);

  useEffect(() => {
    requestCameraPermission()
  }, [])

  async function requestCameraPermission() {
    const permission = Platform.select({
      ios: PERMISSIONS.IOS.CAMERA,
      android: PERMISSIONS.ANDROID.CAMERA,
    });

    if (permission) {
      const result = await request(permission);
      if (result === RESULTS.GRANTED) {
        console.log('Camera permission granted');
      } else {
        console.log('Camera permission denied:', result);
      }
    }
  } 

  return (
    <View style={styles.container}>
      {cameraOn ? (
        <QRScanner onRead={(data: string) => {
          setCameraOn(false);
          console.log('Scanned QR Code:', data);
        }} />
      ) : (
        <Button title="Open Camera" onPress={() => setCameraOn(true)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
