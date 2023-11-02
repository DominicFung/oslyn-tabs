"use client"
import { useEffect, useRef, useState } from 'react'
import { useTheme } from "next-themes"

import Editor, { useMonaco, Monaco } from '@monaco-editor/react'
import { editor, languages } from 'monaco-editor'

const darktheme = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: "section", foreground: "#ecafac", fontStyle: "italic" },
    { token: "chord", foreground: "#bb9bff", fontStyle: "bold" }
  ],
  colors: {
    'editor.background': '#100a1d',
  },
} as editor.IStandaloneThemeData

const lighttheme = {
  base: 'vs',
  inherit: true,
  rules: [
    { token: "section", foreground: "#d79961", fontStyle: "italic" },
    { token: "chord", foreground: "#651fff", fontStyle: "bold" }
  ],
  colors: {
    'editor.background': '#f7f4ff',
  },
} as editor.IStandaloneThemeData

interface PasteTabsProps {
  tabs: string
  setTabs: (tabs: string) => void
}

export default function PasteTabs(p: PasteTabsProps) {
  const { theme } = useTheme()
  const monaco = useMonaco()
  const monacoRef = useRef(null)

  const setup = (monaco: Monaco, editor: editor.IStandaloneCodeEditor) => {
    monaco.editor.defineTheme("myTheme", theme === 'dark' ? darktheme : lighttheme)
    
    monaco.languages.register({ id: 'mylang' })

    let keywords: string[] = ["[Verse]", "[Chorus]", "[Intro]"]
    monaco.languages.setMonarchTokensProvider('mylang', {
      keywords, tokenizer: {
        root: [
          [/\[.*?\]/gm, 'section'],
          [/(^| |\n)([A-G](##?|bb?)?(m|M)?[2-9]?(add|sus|maj|min|aug|dim)?[2-9]?(\/[A-G](##?|bb?)?)?)(\n| |$)/gm, "chord"]
        ]
      }
    })

    monaco.languages.registerCompletionItemProvider('mylang', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const suggestions = [
          ...keywords.map( k => {
            return {
              label: k,
              kind: languages.CompletionItemKind.Keyword,
              insertText: k,
              range: { 
                startLineNumber: position.lineNumber, 
                endLineNumber: position.lineNumber, 
                startColumn: word.startColumn, endColumn: word.endColumn }
            }
          })
        ]
        return { suggestions: suggestions }
      }
    })
    monaco.editor.setTheme("myTheme")
    

    const model = editor?.getModel()
    if (model) monaco.editor.setModelLanguage(model, "mylang")
  }

  // used in first monaco load ..
  useEffect(() => {
    if (monaco && monacoRef.current) { setup(monaco, monacoRef.current) }
  }, [monaco, theme, monacoRef.current])


  // used in subsequent monaco loads
  const setEditorTheme = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    if (monaco) {
      console.log("mounted")
      monacoRef.current = editor as any
      setup(monaco, editor)
    }
  }

  return <Editor height="80vh" options={{ }} value={p.tabs} 
    onChange={(e) => { e && p.setTabs(e) }} onMount={setEditorTheme} 
  />
}
