
import { OslynSlide } from "oslyn-core/types"
import { useEffect, useState } from "react"
import { Text, View, TextLayoutEventData, NativeSyntheticEvent } from "react-native"

interface CalcProps {
  slide?: OslynSlide
  onLayout: (widths: number[][]) => void
}

interface TextCalc {
  text: string
  page: number,
  line: number,
  chord: number
}

/**
 * This react component is ONLY used to calculate the line widths.
 */
export default function Calc(p: CalcProps) {
  const [lines, setLines] = useState<TextCalc[]>([])
  const [widths, setWidths] = useState<number[]>([])
  
  useEffect(() => {
    console.log("OH HELL YES")
    //console.log(p.slide?.pages)
    if (p.slide) {
      const l = []
      for (let s=0; s<p.slide.pages.length; s++) {
        for (let i=0; i<p.slide.pages[s].lines.length; i++) {          
          for (let c=0; c<p.slide.pages[s].lines[i].chords.length; c++) {
            l.push({
              text: p.slide.pages[s].lines[i].lyric.slice(0, p.slide.pages[s].lines[i].chords[c].position),
              page: s as number, line: i as number, chord: c as number
            } as TextCalc)
          }
        }
      }
      setLines(l)
      setWidths(new Array(l.length).fill(-1))
      //console.log(l)
    } else { console.log(" Oh no ...") }
  }, [p.slide])

  // const onLyricLayout = (event: NativeSyntheticEvent<TextLayoutEventData>) => {
  //   console.log(JSON.stringify(event.nativeEvent.lines))
  //   if (event.nativeEvent.lines.length !== lines.length || lines.length <= 0) { return }
  //   let ws = new Array(lines.length).fill(-1)
  //   for (let i=0; i<ws.length; i++) {
  //     ws[i] = event.nativeEvent.lines[i].width
  //   }
  //   console.log(ws)
  //   setWidths(ws)
  // }

  const onLyricLayout = (event: NativeSyntheticEvent<TextLayoutEventData>, i: number) => {
    const w = event.nativeEvent?.lines[0]?.width || 0
    console.log(`${w} ${i}`)
    setWidths((prev) => {
      console.log(prev)
      if (prev.length > 0) {
        prev[i] = w
        return [...prev]
      } else return []
    })
  }

  return (
    <Text className="bg-blue-900 flex flex-shrink-0">
      { lines.map((e, i) =>
          <Text key={i} numberOfLines={1} onTextLayout={(e) => { onLyricLayout(e, i) } }
            className="text-black bg-purple-50 m-5">{e.text}</Text>
      ) }
    </Text>
  );
}