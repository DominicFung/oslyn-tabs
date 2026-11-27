"use client"

import { useEffect } from "react"
import toast, { type Toast } from "react-hot-toast"
import { isUpdateDismissed, updateBuildId, UPDATE_DISMISS_KEY } from "@/core/updateToast"

/**
 * Registers the production service worker and asks before reloading, so a
 * jam in progress is not interrupted when a new version takes control.
 */
export default function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return
    if (!("serviceWorker" in navigator)) return

    let sawController = Boolean(navigator.serviceWorker.controller)
    let prompted = false

    const buildIdFor = (registration?: ServiceWorkerRegistration) => updateBuildId(
      process.env.NEXT_PUBLIC_GIT_SHA,
      registration?.waiting?.scriptURL || navigator.serviceWorker.controller?.scriptURL,
    )

    const promptReload = (registration?: ServiceWorkerRegistration) => {
      if (prompted) return
      const buildId = buildIdFor(registration)
      let dismissed = false
      try { dismissed = isUpdateDismissed(buildId, localStorage.getItem(UPDATE_DISMISS_KEY)) } catch { /* private mode */ }
      if (dismissed) {
        prompted = true
        return
      }
      prompted = true
      const dismiss = (id: string) => {
        try { localStorage.setItem(UPDATE_DISMISS_KEY, buildId) } catch { /* private mode */ }
        toast.dismiss(id)
      }
      toast.custom((t: Toast) => (
        <div className="mb-[env(safe-area-inset-bottom)] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-lg bg-oslyn-900 px-4 py-3 text-sm text-white shadow-lg">
          <span>A new version of Oslyn Tabs is ready.</span>
          <button
            type="button"
            className="rounded-full bg-oslyn-500 px-3 py-1 font-semibold"
            onClick={() => {
              toast.dismiss(t.id)
              const waiting = registration?.waiting
              if (waiting) {
                waiting.postMessage({ type: "SKIP_WAITING" })
                const reload = () => window.location.reload()
                navigator.serviceWorker.addEventListener("controllerchange", reload, { once: true })
                window.setTimeout(reload, 1000)
                return
              }
              window.location.reload()
            }}
          >
            Reload
          </button>
          <button
            type="button"
            aria-label="Dismiss"
            className="ml-auto rounded-full p-1 text-lg leading-none text-white/80 hover:bg-white/10 hover:text-white"
            onClick={() => dismiss(t.id)}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      ), { duration: Infinity, id: "oslyn-sw-update" })
    }

    const onControllerChange = () => {
      if (sawController) promptReload()
      sawController = true
    }
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange)

    let cancelled = false
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((registration) => {
      if (cancelled) return
      if (registration.waiting && navigator.serviceWorker.controller) promptReload(registration)
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing
        if (!worker) return
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && registration.waiting && navigator.serviceWorker.controller) {
            promptReload(registration)
          }
        })
      })
    }).catch((error) => {
      console.warn("Service worker registration failed", error)
    })

    return () => {
      cancelled = true
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange)
    }
  }, [])

  return null
}
