'use client';

import { createContext, useContext, useState } from "react"
const Context = createContext({index: 0, setIndex: (b: any) => {} })

export const BandContextProvider = ({ children }: any) => {
  const [index, setIndex] = useState(0)
  return (
    <Context.Provider value={{ index, setIndex }}>{children}</Context.Provider>
  )
}

export const useBandContext = () => useContext(Context)