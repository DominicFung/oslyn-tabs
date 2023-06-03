"use client"
import { useEffect, useRef, useState } from 'react'

import Editor, { useMonaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'

const theme = {
  base: 'vs-dark',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#000000',
  },
} as editor.IStandaloneThemeData

interface PasteTabsProps {
  tabs: string
  setTabs: (tabs: string) => void
}

export default function PasteTabs(p: PasteTabsProps) {
  const monaco = useMonaco()
  const monacoRef = useRef(null)

  // used in first monaco load ..
  useEffect(() => {
    if (monaco) {
      console.log(monaco)
    
      monaco.editor.defineTheme("myTheme", theme)
      monaco.editor.setTheme("myTheme")
    }
  }, [monaco])


  // used in subsequent monaco loads
  const setEditorTheme = (editor: any) => {
    if (monaco) {
      console.log("mounted")
      monacoRef.current = editor

      monaco.editor.defineTheme("myTheme", theme)
      monaco.editor.setTheme("myTheme")
    }
  }

  return <Editor height="80vh" options={{ }} value={p.tabs} 
    onChange={(e) => { console.log(e); if(e) p.setTabs(e)}} onMount={setEditorTheme} 
  />
}
