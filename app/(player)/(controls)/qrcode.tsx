"use client"

import { QRCode } from 'react-qrcode-logo'
import { useTheme } from "next-themes"
import { useEffect, useState } from 'react'

export default function QrCode() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  return <>
    <div className="ml-3 text-sm font-normal">
      <div className="pb-2 text-xl font-semibold text-gray-900 dark:text-white">QR Code</div>
      <div className="pb-3 text-sm font-normal">Quickly share this jam sessions with your friends!</div> 

      {mounted && <div className='mx-auto w-[170px] flex flex-row'>
      <div className="mt-16 mr-4 text-lg font-normal text-gray-900">Slides</div>
        <QRCode value={`${window.location.href}/slides`}
            bgColor={ theme === "dark" ? "#1f2937" : "#FFFFFF" }
            fgColor={ theme === "dark" ? "#FFFFFF" : "#1f2937" }
        />
      </div>}

      <hr className="my-2 h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-oslyn-900 to-transparent opacity-25 dark:opacity-100" />

      {mounted && <div className='mx-auto w-[170px] flex flex-row-reverse'>
        <div className="mt-16 ml-4 px-2 text-lg font-normal text-gray-900">Jam</div> 
          <QRCode value={window.location.href}
              bgColor={ theme === "dark" ? "#1f2937" : "#FFFFFF" }
              fgColor={ theme === "dark" ? "#FFFFFF" : "#1f2937" }
          />
      </div>}
    </div>
  </>
}