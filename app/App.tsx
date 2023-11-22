import { StatusBar } from 'expo-status-bar'
import { Text, View } from 'react-native'

import { NativeWindStyleSheet } from "nativewind";

NativeWindStyleSheet.setOutput({
  default: "native",
})

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text>Open up App.tsx to start working on your app!</Text>
      <StatusBar style="auto" />
    </View>
  );
}
