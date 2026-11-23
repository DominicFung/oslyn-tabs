import React, { createContext, useContext, useEffect, useState } from 'react'
import { Appearance, ColorSchemeName } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY = 'oslyn.theme.v1'
export type ThemeMode = 'light' | 'dark' | 'system'

export type Palette = {
  text: string
  muted: string
  card: string
  line: string
  accent: string
  accentText: string
  danger: string
  input: string
  chip: string
}

const light: Palette = {
  text: '#1f2937',
  muted: '#6b7280',
  card: '#ffffff',
  line: '#e5e7eb',
  accent: '#6d28d9',
  accentText: '#ffffff',
  danger: '#b91c1c',
  input: '#f9fafb',
  chip: '#ede9fe',
}

const dark: Palette = {
  text: '#f9fafb',
  muted: '#d1d5db',
  card: '#1f2937',
  line: '#374151',
  accent: '#7c3aed',
  accentText: '#ffffff',
  danger: '#fca5a5',
  input: '#111827',
  chip: '#4c1d95',
}

type ThemeValue = {
  mode: ThemeMode
  scheme: 'light' | 'dark'
  colors: Palette
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeValue>({
  mode: 'system',
  scheme: 'light',
  colors: light,
  setMode: () => {},
})

function resolve(mode: ThemeMode, system: ColorSchemeName): 'light' | 'dark' {
  if (mode === 'light' || mode === 'dark') return mode
  return system === 'dark' ? 'dark' : 'light'
}

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system')
  const [system, setSystem] = useState<ColorSchemeName>(Appearance.getColorScheme())

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') setModeState(saved)
    })
    const sub = Appearance.addChangeListener(({ colorScheme }) => setSystem(colorScheme))
    return () => sub.remove()
  }, [])

  const setMode = (next: ThemeMode) => {
    setModeState(next)
    AsyncStorage.setItem(KEY, next).catch(() => {})
  }

  const scheme = resolve(mode, system)
  const colors = scheme === 'dark' ? dark : light
  return <ThemeContext.Provider value={{ mode, scheme, colors, setMode }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
