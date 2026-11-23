import React, { createContext, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY = 'oslyn.account.v1'

export type Account = {
  userId: string
  email: string
  username: string
  firstName?: string | null
  lastName?: string | null
  imageUrl?: string | null
}

type SessionValue = {
  account: Account | null
  ready: boolean
  signIn: (account: Account) => Promise<void>
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionValue>({
  account: null,
  ready: false,
  signIn: async () => {},
  signOut: async () => {},
})

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    AsyncStorage.getItem(KEY).then((raw) => {
      if (cancelled || !raw) return
      try {
        const parsed = JSON.parse(raw) as Account
        if (parsed?.userId && parsed.email) setAccount(parsed)
      } catch {
        /* ignore a corrupt saved account */
      }
    }).finally(() => {
      if (!cancelled) setReady(true)
    })
    return () => { cancelled = true }
  }, [])

  const signIn = async (next: Account) => {
    setAccount(next)
    await AsyncStorage.setItem(KEY, JSON.stringify(next))
  }

  const signOut = async () => {
    setAccount(null)
    await AsyncStorage.removeItem(KEY)
  }

  return <SessionContext.Provider value={{ account, ready, signIn, signOut }}>{children}</SessionContext.Provider>
}

export function useSession() {
  return useContext(SessionContext)
}
