"use client"

import { useRouter } from "next/navigation"

export interface ClickableCellProps {
  children: React.ReactNode
  href: string
  className?: string
}

export default function ClickableCell({ children, href, className }: ClickableCellProps) {
  const router = useRouter()
  return <td className={`${className} hover:cursor-pointer`} onClick={() => router.push(href)}>
    {children}
  </td>
}