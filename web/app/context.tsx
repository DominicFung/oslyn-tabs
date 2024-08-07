'use client';

import { createContext, useContext, useEffect, useState, Suspense } from "react"

const Context = createContext({
  openSidebar: true, setOpenSidebar: (b: any) => {},
  openLogin: false, setOpenLogin: (b: any) => {},
  guestIdentity: {} as {[key: string]: string}, addGuestIdentity: (jamId: string, guestId: string) => {}, removeGuestIdentity: (jamId: string) => {}
})
const Provider = Context.Provider as any

export const ContextProvider = ({ children }: any) => {
  const [openSidebar, setOpenSidebar] = useState(true)
  const [openLogin, setOpenLogin ] = useState(false)

  const [ guestIdentity, setGuestIdentity ] = useState<{[jamId: string]: string}>({})
  useEffect(() => { const a = localStorage.getItem('jam/guestIdentity') || "{}"; if (a && a != "false") { setGuestIdentity(JSON.parse(a)) } }, [])
  useEffect(() => { localStorage.setItem('jam/guestIdentity', JSON.stringify(guestIdentity)) }, [guestIdentity])

  const addGuestIdentity = (jamId: string, guestId: string) => {
    let pgi = guestIdentity
    pgi[jamId] = guestId
    console.log(pgi)
    setGuestIdentity({ ...pgi })
  }

  const removeGuestIdentity = (jamId: string) => {
    let pgi = guestIdentity
    if (pgi[jamId]) delete pgi[jamId]
    console.log(pgi)
    setGuestIdentity({ ...pgi })
  }

  return (
    <Provider value={{ 
      openSidebar, setOpenSidebar,
      openLogin, setOpenLogin,
      guestIdentity, addGuestIdentity, removeGuestIdentity }}>
        <Suspense>
          <div className={`${openSidebar?"ml-64":"ml-0 overflow-x-hidden"}`}>
            {children}
          </div>
        </Suspense>
    </Provider>
  )
}

export const useSideBarContext = () => useContext(Context)