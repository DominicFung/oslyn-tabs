import './globals.css'
import type { Metadata, Viewport } from "next"
import { Inter } from 'next/font/google'
import { ContextProvider } from './context'
import Sidebar from './sidebar'
import AuthContext from './authcontext'
import { Toaster } from "react-hot-toast"
import SongDeletedListener from "./songDeleted"
import { ThemeProvider } from "./theme"
import RegisterServiceWorker from "./registerServiceWorker"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Oslyn Tabs',
  description: 'Synchronized chord sheets for jam sessions.',
  applicationName: 'Oslyn Tabs',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Oslyn Tabs',
  },
  formatDetection: {
    telephone: false,
  },
  // Next emits `mobile-web-app-capable`. iOS still reads the apple-prefixed tag.
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#e4bcbb' },
    { media: '(prefers-color-scheme: dark)', color: '#2a1a4a' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-oslyn-200 dark:bg-black`}>
        <div className="bg-gradient-to-b from-coral-50 to-oslyn-200 dark:from-oslyn-900 dark:to-black w-full h-full absolute top-0 left-0 z-0 overflow-x-hidden">
        <ThemeProvider attribute='class' defaultTheme='light' enableSystem={false} storageKey={"oslynTheme"}>
          <AuthContext>
            <Toaster
              position="bottom-left"
              containerStyle={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
            />
            <RegisterServiceWorker />
            <SongDeletedListener />
            <ContextProvider>
              {children}
              <Sidebar />
            </ContextProvider>
          </AuthContext>
        </ThemeProvider>
        </div>
      </body>
    </html>
  )
}
