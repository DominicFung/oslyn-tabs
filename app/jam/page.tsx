"use client"

import { useRouter } from "next/navigation"
import Html5QrcodePlugin from "./qrScanner"

export default function StartJam() {
  const router = useRouter()

  const onNewScanResult = (decodedText: string, decodedResult: any) => {
    console.log(decodedText)
    console.log(decodedResult)

    if (decodedText.startsWith("http://localhost:3000/jam/") || decodedText.startsWith("https://tabs.oslyn.io/jam/")) {
      router.push(decodedText)
    }
  }

  return <>
    <Html5QrcodePlugin 
      fps={10}
      qrbox={250}
      disableFlip={false}
      qrCodeSuccessCallback={onNewScanResult} />
  </>
}