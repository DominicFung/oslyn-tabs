'use client';

import { createContext, useContext, useState } from "react"
const Context = createContext({index: 0, setIndex: (b: any) => {} })
const Provider = Context.Provider as any

export const BandContextProvider = ({ children }: any) => {
  const [index, setIndex] = useState(0)
  return (
    <Provider value={{ index, setIndex }}>{children}</Provider>
  )
}

export const useBandContext = () => useContext(Context)