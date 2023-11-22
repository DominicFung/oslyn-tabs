"use client"

import Image from 'next/image'
import { useState, useCallback } from "react"

import { PhotoIcon } from "@heroicons/react/24/solid"
import { JamSong } from "@/../src/API"

import { useDropzone } from 'react-dropzone'
import { ChromePicker } from 'react-color'

interface BackgroundProps {
  song: JamSong
}

export default function Background(p: BackgroundProps) {
  const onDrop = useCallback((acceptedFiles: any) => {
    console.log(acceptedFiles)
  }, [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({onDrop})
  
  const [backgroundColor, setBackgroundColor] = useState("#000")

  return <>
    <div className='ml-6'>
      <span className='dark:text-gray-300 text-2xl bold py-4' >Background</span><br />
      <span className='dark:text-gray-500 text-xs py-4'>
        Choose a background picture! We will zoom until it fits the screen. For best results, choose a wider picture.
      </span>
    </div>

    <div {...getRootProps()}>
      <input {...getInputProps()} />
      { isDragActive ?
          <p>Drop the files here ...</p> :
          <div className='block w-48 h-48 m-4 mx-auto rounded-lg border bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500'>
            { p.song.defaultSlideConfig?.backgroundImg ? <Image src={p.song.defaultSlideConfig!.backgroundImg} alt={''} width={192} height={192} 
                className='w-48 h-48 rounded-lg border focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500' />:
              <span><PhotoIcon className='h-12 w-12 mx-auto mt-20' /></span>
            }
          </div>
      }
    </div>

    <div className='mx-auto'>
      <span className='dark:text-gray-300' >- or -</span>
    </div>

    <div className='ml-6 mb-6'>
      <span className='dark:text-gray-500 text-xs py-4'>
        Choose a colour!
      </span>
    </div>

    <div className='mx-auto'>
      <ChromePicker
          color={backgroundColor}
          onChange={(c) => { setBackgroundColor(c.hex) }}
        />
    </div>
  </>
}