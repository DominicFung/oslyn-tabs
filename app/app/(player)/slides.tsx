import { chordSheetToSlides } from "oslyn-core/oslyn"
import { OslynSlide } from "oslyn-core/types"
import { Song } from "@src/API"
import { useEffect, useState } from "react"
import Line from "./line2"

import { transpose as trans } from "oslyn-core/oslyn"
import { Text, View, Image, Pressable, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

import { useKeepAwake } from 'expo-keep-awake'
import Svg, { Path } from 'react-native-svg'

interface SlidesProps {
  song: Song
  skey?: string

  transpose?: number
  textSize?: string
  complex?: boolean
  headsUp?: boolean

  /** page can be externalized / enable graphql call to sync pages */
  page?: number
  setPage?: (p: number) => void

  /** padding top */
  pt?: boolean

  /**  */
  setLastPage?: (b: boolean) => void
}

export default function Slides(p: SlidesProps) {
  useKeepAwake()

  return <>
    
  </>
}