/// <reference lib="webworker" />
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist"
import { CacheableResponsePlugin, CacheFirst, ExpirationPlugin, NetworkFirst, NetworkOnly, Serwist } from "serwist"

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

/**
 * Same-origin API routes, including NextAuth (`/api/auth/*`), are never stored.
 * AppSync GraphQL and its realtime websocket are cross-origin and are not
 * matched here, so the service worker does not intercept them.
 */
const isSameOriginApi = ({ url, sameOrigin }: { url: URL; sameOrigin: boolean }) =>
  sameOrigin && url.pathname.startsWith("/api/")

const isStaticAsset = ({
  request,
  url,
  sameOrigin,
}: {
  request: Request
  url: URL
  sameOrigin: boolean
}) => {
  if (!sameOrigin || url.pathname.startsWith("/api/")) return false
  if (url.pathname.startsWith("/_next/static/")) return true
  return request.destination === "style"
    || request.destination === "script"
    || request.destination === "image"
    || request.destination === "font"
    || request.destination === "worker"
}

/** Document navigations and Next.js RSC payloads. Network-first. */
const isPageRequest = ({
  request,
  url,
  sameOrigin,
}: {
  request: Request
  url: URL
  sameOrigin: boolean
}) => {
  if (!sameOrigin || url.pathname.startsWith("/api/")) return false
  if (request.mode === "navigate" || request.destination === "document") return true
  const headers = request.headers
  return headers.get("RSC") === "1" || headers.get("Next-Router-Prefetch") === "1" || url.searchParams.has("_rsc")
}

const runtimeCaching: RuntimeCaching[] = [
  {
    matcher: isSameOriginApi,
    handler: new NetworkOnly(),
  },
  {
    matcher: isStaticAsset,
    handler: new CacheFirst({
      cacheName: "oslyn-static",
      plugins: [
        new CacheableResponsePlugin({ statuses: [200] }),
        new ExpirationPlugin({
          maxEntries: 128,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        }),
      ],
    }),
  },
  {
    matcher: isPageRequest,
    handler: new NetworkFirst({
      cacheName: "oslyn-pages",
      plugins: [
        new CacheableResponsePlugin({ statuses: [200] }),
        new ExpirationPlugin({
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60,
        }),
      ],
    }),
  },
]

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        url: "/offline.html",
        matcher({ request }) {
          return request.destination === "document"
        },
      },
    ],
  },
})

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting()
})

serwist.addEventListeners()
