import type { MetadataRoute } from "next"

/**
 * Installed-app colors are taken from the web shell and the Oslyn mark:
 * oslyn-600 `#651fff` (logo purple), oslyn-200 `#bb9bff` (light body).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Oslyn Tabs",
    short_name: "Oslyn Tabs",
    description: "Synchronized chord sheets for jam sessions.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#bb9bff",
    theme_color: "#651fff",
    lang: "en",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
