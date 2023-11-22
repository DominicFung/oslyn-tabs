"use client"

import { OslynPhrase } from "@/core/types"

import {useState } from "react"

export interface LineProps {
  phrase: OslynPhrase

  textSize?: string,
  color?: string
}

export default function Line(p: LineProps) {
  let style = {} as any
  if (p.color) style.color = p.color

  return <>
    { p.phrase && p.phrase.lyric.trim() != "" && <div className="relative h-12 mt-6">
      <div style={style}
        className={`${p.textSize || "text-lg"} ${p.color?"":"text-oslyn-700 dark:text-oslyn-200"} whitespace-nowrap`}>{p.phrase.lyric}</div>
    </div>
    }
  </>
}