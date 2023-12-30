"use client"

import Content from './content.mdx'

export default function DocsMain() {
  return <main className="p-5">
    <div className='article container mx-auto max-w-4xl mt-10 mb-20'>
      <article className='prose dark:prose-invert max-w-none prose-xl'>
        <Content />
      </article>
    </div>
  </main>
}