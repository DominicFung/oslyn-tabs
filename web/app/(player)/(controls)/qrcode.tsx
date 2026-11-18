"use client"

import { QRCode } from 'react-qrcode-logo'
import { useTheme } from "next-themes"
import { useEffect, useState } from 'react'

function withQuery(path: string, params: URLSearchParams) {
  const query = params.toString()
  return query ? `${path}?${query}` : path
}

export default function QrCode(p: { jamSessionId: string, canShare?: boolean, joinToken?: string }) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [addLogin, setAddLogin] = useState(true)
  const [token, setToken] = useState(p.joinToken || "")

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!p.canShare) return
    let cancelled = false
    fetch(`/api/jam/${p.jamSessionId}/join-link`, { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && typeof data?.joinToken === "string" && data.joinToken) setToken(data.joinToken)
      })
      .catch((error) => console.error(error))
    return () => { cancelled = true }
  }, [p.canShare, p.jamSessionId])

  const origin = mounted ? window.location.origin : ""
  const jamParams = new URLSearchParams()
  if (token) jamParams.set("join", token)
  if (addLogin) jamParams.set("login", "true")
  const slidesParams = new URLSearchParams()
  if (token) slidesParams.set("join", token)
  const jamUrl = withQuery(`${origin}/jam/${p.jamSessionId}`, jamParams)
  const slidesUrl = withQuery(`${origin}/jam/${p.jamSessionId}/slides`, slidesParams)

  return <>
    <div className="ml-3 text-sm font-normal overflow-auto">
      <div className="pb-2 text-xl font-semibold text-gray-900 dark:text-white">QR Code</div>
      <div className="pb-3 text-sm font-normal">Quickly share this jam sessions with your friends!</div> 

      <div className="flex mb-5">
        <div className="flex items-center h-5">
          <input id="helper-checkbox" aria-describedby="helper-checkbox-text" type="checkbox" value="" checked={addLogin} onChange={() => setAddLogin(!addLogin)}
              className="w-4 h-4 text-oslyn-600 bg-gray-100 border-gray-300 rounded focus:ring-oslyn-500 dark:focus:ring-oslyn-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
        </div>
        <div className="ml-2 text-sm">
          <label htmlFor="helper-checkbox" className="font-medium text-gray-900 dark:text-gray-300">Add Login</label>
          <p id="helper-checkbox-text" className="text-xs font-normal text-gray-500 dark:text-gray-300">This will prompt users to login right away, minimizing &quot;guests&quot;. This feature only applies to Jam.</p>
        </div>
      </div>

      <div className="max-h-[calc(100vh-20rem)] pl-2 pr-6">
        {mounted && <div className='mx-auto w-[170px] flex flex-row'>
        <div className="mt-16 mr-6 text-lg font-normal text-gray-900 dark:text-gray-50">Slides</div>
          <QRCode value={slidesUrl}
              bgColor={ theme === "dark" ? "#1f2937" : "#FFFFFF" }
              fgColor={ theme === "dark" ? "#FFFFFF" : "#1f2937" }
          />
        </div>}

        <hr className="my-2 h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-oslyn-900 to-transparent opacity-25 dark:opacity-100" />

        {mounted && <div className='mx-auto w-[170px] flex flex-row-reverse'>
          <div className="mt-16 ml-4 px-2 text-lg font-normal text-gray-900 dark:text-gray-50">Jam</div> 
            <QRCode value={jamUrl}
                bgColor={ theme === "dark" ? "#1f2937" : "#FFFFFF" }
                fgColor={ theme === "dark" ? "#FFFFFF" : "#1f2937" }
            />
        </div>}
      </div>
      
    </div>
  </>
}
