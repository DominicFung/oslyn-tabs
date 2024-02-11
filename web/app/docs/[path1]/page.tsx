"use client"
import { usePathname } from 'next/navigation'

import Introduction from './introduction.mdx'
import FirstSong from './first-song.mdx'
import SetList from './set-list.mdx'

export default function DocsMain() {
  const pathname = usePathname()

  return <main className="p-5">
    <div className='article container mx-auto max-w-4xl mt-10 mb-20'>
      <article className='prose dark:prose-invert max-w-none prose-lg'>
        { pathname === "/docs/introduction" && <Introduction /> }
        { pathname === "/docs/first-song" && <FirstSong /> }
        { pathname === "/docs/set-list" && <SetList />}
      </article>
    </div>
  </main>
}