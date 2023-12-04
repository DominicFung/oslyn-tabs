'use client';

import { ReactNode, createContext, useContext, useState } from "react"
const Context = createContext({slideView: false, setSlideView: (b: any) => {} })
const Provider = Context.Provider as any

interface SongPreviewContextProps {
  children: ReactNode
}

export const SongPreviewContextProvider: React.FC<SongPreviewContextProps> = ({ children }) => {
  const [slideView, setSlideView] = useState(false)
  return <Provider value={{ slideView, setSlideView }}>{children}</Provider>
}

export const useSongPreviewContext = () => useContext(Context)