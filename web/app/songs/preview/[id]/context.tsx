'use client';

import { createContext, useContext, useState } from "react"
const Context = createContext({slideView: false, setSlideView: (b: any) => {} })

export const SongPreviewContextProvider = ({ children }: any) => {
  const [slideView, setSlideView] = useState(false)
  return (
    <Context.Provider value={{ slideView, setSlideView }}>{children}</Context.Provider>
  )
}

export const useSongPreviewContext = () => useContext(Context)