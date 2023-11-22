import './globals.css'
import { Inter } from 'next/font/google'
import { ContextProvider } from './context'
import Sidebar from './sidebar'
import AuthContext from './authcontext'
import { ThemeProvider } from "./theme"

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Oslyn Tabs',
  description: 'Oslyn Tabs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-oslyn-200 dark:bg-black`}>
        <div className="bg-gradient-to-b from-coral-50 to-oslyn-200 dark:from-oslyn-900 dark:to-black w-full h-full absolute top-0 left-0 z-0 overflow-x-hidden">
        <ThemeProvider attribute='class' defaultTheme='light' enableSystem storageKey={"oslynTheme"}>
          <AuthContext>
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
