"use client"

import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode'
import { useEffect } from 'react'

const qrcodeRegionId = "html5qr-code-full-region"

interface Html5QrcodeProps {
  verbose?: boolean
  fps?: number
  qrbox?: number
  disableFlip?: boolean 
  aspectRatio?: any

  qrCodeSuccessCallback: (decodedText: string, decodedResult: any) => void
  qrCodeErrorCallback?: () => void
}

// Creates the configuration object for Html5QrcodeScanner.
const createConfig = (props: Html5QrcodeProps) => {
    let config = {} as any
    if (props.fps) { config.fps = props.fps }
    if (props.qrbox) { config.qrbox = props.qrbox }
    if (props.aspectRatio) config.aspectRatio = props.aspectRatio
    if (props.disableFlip !== undefined) {
        config.disableFlip = props.disableFlip
    }
    return config
};

export default function Html5QrcodePlugin(props: Html5QrcodeProps) {

    useEffect(() => {
        // when component mounts
        const config = createConfig(props)
        const verbose = props.verbose === true;
        // Suceess callback is required.
        if (!(props.qrCodeSuccessCallback)) {
            throw "qrCodeSuccessCallback is required callback.";
        }
        const html5QrcodeScanner = new Html5QrcodeScanner(qrcodeRegionId, config, verbose)
        html5QrcodeScanner.render(props.qrCodeSuccessCallback, props.qrCodeErrorCallback)

        // cleanup function when component will unmount
        return () => {
            html5QrcodeScanner.clear().catch(error => {
                console.error("Failed to clear html5QrcodeScanner. ", error);
            })
        };
    }, []);

    return (<>
      <div className='my-6 mx-auto max-w-sm text-white'>
        <div id={qrcodeRegionId} className='text-white border-white' />
      </div>
    </>)
}