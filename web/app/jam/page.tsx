"use client"

import { useRouter } from "next/navigation"
import Html5QrcodePlugin from "./qrScanner"

function jamPath(decoded: string): string | null {
  try {
    const url = new URL(decoded)
    const hostOk = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "tabs.oslyn.io"
    if (!hostOk || !url.pathname.startsWith("/jam/")) return null
    return `${url.pathname}${url.search}`
  } catch {
    return null
  }
}

export default function StartJam() {
  const router = useRouter()

  const onNewScanResult = (decodedText: string, decodedResult: any) => {
    console.log(decodedText)
    console.log(decodedResult)
    const path = jamPath(decodedText)
    if (path) router.push(path)
  }

  return <>
    <Html5QrcodePlugin 
      fps={10}
      qrbox={250}
      disableFlip={false}
      qrCodeSuccessCallback={onNewScanResult} />
  </>
}