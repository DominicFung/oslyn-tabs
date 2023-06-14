'use client';

import { createContext, useContext, useEffect, useState } from "react";

const Context = createContext({openSidebar: true, setOpenSidebar: (b: any) => {} })

export const ContextProvider = ({ children }: any) => {
    const [openSidebar, setOpenSidebar] = useState(true)

    useEffect(() => {

    }, [])

    return (
      <Context.Provider value={{ openSidebar, setOpenSidebar }}>
        <div className={`${openSidebar?"ml-64":"ml-0"}`}>
          {children}
        </div>
      </Context.Provider>
    )
};

export const useSideBarContext = () => useContext(Context)