"use client"

import { BandRequest } from "@/app/api/band/create/route"
import { getArrayBufferFromObjectURL } from "@/core/utils/frontend"
import { Band } from "@/../src/API"
import { InboxArrowDownIcon } from "@heroicons/react/24/solid"
import { useRouter } from "next/navigation"
import { PutObjectCommand, S3Client, S3ClientConfig } from "@aws-sdk/client-s3"
import { Popover, Transition } from "@headlessui/react"
import { usePopper } from 'react-popper'

import cdk from '@/cdk-outputs.json'
import secret from '@/secret.json'
import { Fragment, useRef, useState } from "react"

export interface SaveProps {
  band: Band,
  type: "create" | "update"
}

export default function Save(p: SaveProps) {
  const router = useRouter()
  const [ loading, setLoading ] = useState(false)

  const buttonRef = useRef<any>(null)
  let [referenceElement, setReferenceElement] = useState<any>()
  let [popperElement, setPopperElement] = useState<any>()
  let { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "left"
  })
  const timeoutDuration = 500
  let timeout: any

  const closePopover = () => {
    return buttonRef.current?.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true
      })
    )
  }

  const onMouseEnter = (open:boolean) => {
    clearTimeout(timeout)
    if (open) return

    console.log(buttonRef.current)
    return buttonRef.current?.click()
  }

  const onMouseLeave = (open:boolean) => {
    if (!open) return
    timeout = setTimeout(() => closePopover(), timeoutDuration)
  }

  const updateBand = async () => {
    if (!p.band?.bandId) { console.error("bandId not available"); return }
    if (!p.band.description || !p.band.name) { console.error("name and description not available"); return }

    const data = await (await fetch(`/api/band/${p.band?.bandId}/update`, {
      method: "POST",
      body: JSON.stringify(p.band as BandRequest)
    })).json() as Band
    console.log(data)
    router.push(`/band`)
  }

  const createBand = async () => {
    if (!p.band.description || !p.band.name || !p.band.imageUrl) { console.error("name, description or imageUrl not available"); return }

    let bandRequest = {
      name: p.band.name, policy: p.band.policy,
      description: p.band.description, 
      imageUrl: p.band.imageUrl
    } as BandRequest

    let s3 = null as S3Client | null
    let img = null as string | ArrayBuffer | null | undefined

    if (p.band.imageUrl.startsWith("blob")) {
      img = await getArrayBufferFromObjectURL(p.band.imageUrl)
      console.log(bandRequest.imageUrl)
      console.log(img)

      if (img) {
        bandRequest.imageUrl = "bucket"

        s3 = new S3Client({ 
          region: "us-east-1",
          credentials: {
            accessKeyId: cdk["oslynstudio-IamStack"].AccessKey, 
            secretAccessKey: cdk["oslynstudio-IamStack"].SecretKey 
          }
        } as S3ClientConfig)

      } else {
        console.error("unable to process blob arraybuffer")
      }
    }

    const data = await (await fetch(`/api/band/create`, {
      method: "POST",
      body: JSON.stringify(bandRequest)
    })).json() as Band
    console.log(data)

    console.log(img)
    console.log(s3)

    if (img && s3) {
      const res1 = await s3.send( new PutObjectCommand({
        Bucket: cdk["oslynstudio-S3Stack"].bucketName,
        Key: `band/${data.bandId}/latest.jpg`,
        Body: img as Buffer
      }))
  
      console.log("Image Uploaded to S3.")
      console.log(res1)
    }
    // router.push(`/band`)
  }

  return <>
    <div className="fixed z-90 bottom-20 right-20">
      <Popover className="relative">
        {({ open }) => {
          return <>
            <div onMouseLeave={onMouseLeave.bind(null, open)}>
              <button
                className="absolute disabled:text-gray-600 text-oslyn-800 hover:text-oslyn-900 disabled:bg-gray-400 bg-coral-400 w-16 h-16 rounded-full p-4 drop-shadow-lg flex justify-center items-center text-4xl hover:bg-coral-300 hover:drop-shadow-2xl"
                disabled={
                  p.band.description === "" || p.band.name === "" || p.band.imageUrl === "" || 
                  loading }
              >
                <InboxArrowDownIcon className={`w-8 h-8 ${loading && "text-gray-500"}`} />
                { loading && <div className="absolute pb-1">
                  <svg aria-hidden="true" className="inline w-9 h-9 text-gray-200 animate-spin dark:text-oslyn-50 fill-oslyn-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                      <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                  </svg>
                  <span className="sr-only">Loading...</span>
                </div> }
              </button>
              <Popover.Button onMouseUp={() => { 
                  console.log("MouseUp!"); 
                  if (!loading && p.type === "create") createBand()
                  if (!loading && p.type === "update") updateBand() 
                }} ref={buttonRef}
                onMouseEnter={onMouseEnter.bind(null, open)}
                onMouseLeave={onMouseLeave.bind(null, open)}
                className={`absolute ${loading && 'cursor-default'}`}
              >
                <div className="w-16 h-16" ref={setReferenceElement} />
              </Popover.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel /*className="absolute z-10 w-screen max-w-sm px-4 mt-0 sm:px-0 lg:max-w-3xl"*/
                ref={setPopperElement}
                style={styles.popper}
                {...attributes.popper}
              >
                <div
                  className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 text-gray-700 dark:text-gray-100"
                  onMouseEnter={onMouseEnter.bind(null, open)}
                  onMouseLeave={onMouseLeave.bind(null, open)}
                >
                  {  }
                  { loading && <p className="w-36">Please wait as upload your image!</p>}
                  { !loading && <p className="mx-5">Save!</p> }
                </div>
              </Popover.Panel>
            </Transition>
          </>
        }}
      </Popover>
    </div>
  </>

}