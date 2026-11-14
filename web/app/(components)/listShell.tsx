"use client"

import { ReactNode } from "react"
import { useSideBarContext } from "../context"

export default function ListShell({ children }: { children: ReactNode }) {
  const { openSidebar } = useSideBarContext()
  return <div className={openSidebar ? "min-w-[640px]" : ""}>{children}</div>
}
