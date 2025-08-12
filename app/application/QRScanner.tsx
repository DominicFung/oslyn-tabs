import React from 'react';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { RNCamera } from 'react-native-camera';
import { ViewStyle } from 'react-native';

interface QRScannerProps {
  onRead: (data: string) => void;
}

export default function QRScanner({ onRead }: QRScannerProps) {
  return (
    <QRCodeScanner
      onRead={(e) => onRead(e.data)}
      flashMode={RNCamera.Constants.FlashMode.off}
      showMarker
      topContent={<></>}
      bottomContent={<></>}
      containerStyle={{ flex: 1 } as ViewStyle}
    />
  );
}