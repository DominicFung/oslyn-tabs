"use client"
import { useEffect, useRef, useState } from 'react'
import { useTheme } from "next-themes"

import Editor, { useMonaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'

const darktheme = {
  base: 'vs-dark',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#000000',
  },
} as editor.IStandaloneThemeData

const lighttheme = {
  base: 'vs',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#ffffff',
  },
} as editor.IStandaloneThemeData

interface PasteTabsProps {
  tabs: string
  setTabs: (tabs: string) => void
}

export default function PasteTabs(p: PasteTabsProps) {
  const { theme, setTheme } = useTheme()
  const monaco = useMonaco()
  const monacoRef = useRef(null)

  // used in first monaco load ..
  useEffect(() => {
    if (monaco) {  
      monaco.editor.defineTheme("myTheme", theme === 'dark' ? darktheme : lighttheme)
      monaco.editor.setTheme("myTheme")
    }
  }, [monaco, theme])


  // used in subsequent monaco loads
  const setEditorTheme = (editor: any) => {
    if (monaco) {
      console.log("mounted")
      monacoRef.current = editor

      monaco.editor.defineTheme("myTheme", theme === 'dark' ? darktheme : lighttheme)
      monaco.editor.setTheme("myTheme")
    }
  }

  return <Editor height="80vh" options={{ }} value={p.tabs} 
    onChange={(e) => { e && p.setTabs(e) }} onMount={setEditorTheme} 
  />
}
