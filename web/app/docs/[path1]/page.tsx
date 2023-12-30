"use client"
import { usePathname } from 'next/navigation'

import Login from './login.mdx'


export default function DocsMain() {
  const pathname = usePathname()

  return <main className="p-5">
    <div className='article container mx-auto max-w-4xl mt-10 mb-20'>
      <article className='prose dark:prose-invert max-w-none prose-xl'>
        { pathname === "/docs/login" && <Login /> }
      </article>
    </div>
  </main>
}