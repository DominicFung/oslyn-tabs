"use client"
import { useEffect, useRef } from 'react'

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

export default function PasteTabs() {
  const monaco = useMonaco()
  const monacoRef = useRef(null)

  useEffect(() => {
    if (monaco) {
      console.log(monaco)
      
      monaco.editor.defineTheme("myTheme", theme)
      monaco.editor.setTheme("myTheme")
    }
  }, [monaco])

  const setEditorTheme = (editor: any) => {
    if (monaco) {
      console.log("mounted")
      monacoRef.current = editor

      monaco.editor.defineTheme("myTheme", theme)
      monaco.editor.setTheme("myTheme")
    }
  }

  return <Editor height="80vh" options={{ }} beforeMount={setEditorTheme} />
}
