"use client"

import { MicrophoneIcon } from '@heroicons/react/24/solid'
import { useMemo, useEffect, useState } from 'react'
import { OslynSlide } from '@/core/types'
import { Message } from './(workers)/inference'

import { S3Client, S3ClientConfig, PutObjectCommand } from '@aws-sdk/client-s3'
import cdk from "@/cdk-outputs.json"
import { Recording } from '../../../src/API'
import { SaveRecordingRequest } from '../api/recording/[id]/route'

const kSampleRate = 16000;
const kIntervalAudio_ms = 1000;
const chunkLen = 4

const pageTurnId = "page-turn"

interface RecorderProps {
  jamId: string,
  userId: string,
  slides: OslynSlide,
  page: number
}

export default function Recorder(p: RecorderProps) {
  const aiWorker: Worker = useMemo(() => new Worker(new URL("./(workers)/inference.ts", import.meta.url )), [])

  const recordingId = crypto.randomUUID()
  const [context, setContext] = useState<AudioContext|null>(null)

  const [mediaRecorderForAI, setMediaRecorderForAI] = useState<MediaRecorder|null>(null)
  const [mediaRecorderForS3, setMediaRecorderForS3] = useState<MediaRecorder|null>(null)

  const [timerStart, setTimerStart] = useState<number>(Date.now())
  const [isRecording, setIsRecording] = useState(false)
  const [logText, setLogText] = useState("")

  // help train the AI later
  const [pageturns, setPageturns] = useState<number[]>([])

  // helpers
  const log = (i: string) => { console.log(`[${performance.now().toFixed(2)}] ${i}`); setLogText((p) => { return `${p}\n[${performance.now().toFixed(2)}] ${i}` }) }
  const sleep = (ms: number) => { return new Promise(resolve => setTimeout(resolve, ms)) }

  useEffect(() => {
    if (mediaRecorderForAI != null) { 
      console.log(`adding event listener "${pageTurnId}"`)
      document.body.addEventListener(pageTurnId, handlePageTurn) }
    return document.body.removeEventListener(pageTurnId, handlePageTurn)
  }, [mediaRecorderForAI])

  const handlePageTurn = async (e: Event) => {
    console.log(`PAGE TURN! start time: ${timerStart}`)
    console.log(e)
    // if (!mediaRecorderForAI) { console.error("no media recorder for AI, used to save audio for fine tuning"); return }
    // mediaRecorderForAI.stop()
    // await sleep(500)
    // mediaRecorderForAI.start()

    setPageturns([...pageturns, Date.now() - timerStart])
  }

  const getMicrophone = async () => {
    if (mediaRecorderForS3 === null || mediaRecorderForAI === null) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { 
          echoCancellation: false,
          noiseSuppression: false,
        }, video: false })

        setMediaRecorderForS3(new MediaRecorder(stream))
        // setMediaRecorderForAI(new MediaRecorder(stream))
      } catch (e) {
        setIsRecording(false)
        log(`Access to Microphone, ${e}`);
      }
    }
  }

  const startRecordforAI = async () => {
    if (mediaRecorderForAI === null) { log("ERROR no media recorder 2 found."); return }
    if (!context) { log("ERROR no audio context found."); return }
    setIsRecording(true)

    let recording_start = performance.now();
    setTimerStart(recording_start)
    let chunks: BlobPart[] = [];

    mediaRecorderForAI.ondataavailable = async (e) => { chunks.push(e.data) }

    mediaRecorderForAI.onstop = async () => {
      console.log("recorder 2 stop call")
      const blob = new Blob(chunks, { 'type': 'audio/ogg; codecs=opus' });
      log(`recorded ${((performance.now() - recording_start) / 1000).toFixed(1)}sec audio`);
      const ab = await context.decodeAudioData(await blob.arrayBuffer())
      console.log(ab.getChannelData(0))
      
      const buffer = Buffer.from(ab.getChannelData(0))
      console.log(buffer)

      let input = {
        page: p.page,
        oslynSlides: p.slides,
        buffer: encodeFloatArr(ab.getChannelData(0))
      } as Message

      aiWorker.postMessage(JSON.stringify(input))
    }
  }

  const saveAudio = async ( blob: Blob, fileName: string):Promise<any> => {
    const s3 = new S3Client({
      region: "us-east-1",
      credentials: {
        accessKeyId: cdk["oslynstudio-IamStack"].AccessKey, 
        secretAccessKey: cdk["oslynstudio-IamStack"].SecretKey 
      }
    } as S3ClientConfig)

    const res1 = await s3.send(new PutObjectCommand({
      Bucket: cdk["oslynstudio-S3Stack"].bucketName,
      Key: fileName,
      Body: blob
    }))

    return res1
  }

  const saveTrainingData = async (recordingId: string, sessionId: string, userId: string, fileName: string, sampleRate: number, pageturns: number[]) => {
    const data = await (await fetch(`/api/recording/${recordingId}`, {
      method: "POST",
      body: JSON.stringify({
        sessionId, userId, fileName,
        samplingRate: sampleRate,
        pageturns: pageturns.map(String)
      } as SaveRecordingRequest)
    })).json() as Recording
    console.log(data)
  }

  const startRecord = async () => {
    console.log("recording started ...")
    if (mediaRecorderForS3 === null) { log("ERROR no media recorder found."); return }
    if (!context) { log("ERROR no audio context found."); return }
    setIsRecording(true)
      
    let recording_start = performance.now()
    // const duration = 1000 * 60 * 3 // 3 mins
    const duration = 1000 * 10 // 10 seconds
    setTimerStart(recording_start)

    let chunks: BlobPart[] = [];
    let count = 1

    mediaRecorderForS3.ondataavailable = async (e) => { 
      chunks.push(e.data)
      log(`chunk length: ${chunks.length}, duration: ${performance.now() - recording_start}`)
      if (performance.now() - recording_start > duration) {
        mediaRecorderForS3.stop()
        
        console.log(mediaRecorderForS3.state)
        while (!mediaRecorderForS3.state) {
          console.log(mediaRecorderForS3.state)
          await sleep(1200); chunks=[]; // not a good solution
        }
        
        recording_start = performance.now()
        setTimerStart(performance.now())
        mediaRecorderForS3.start(kIntervalAudio_ms);
      }
    }

    count = count + 1

    mediaRecorderForS3.onstop = async () => {
      const blob = new Blob(chunks, { type: 'audio/wav' });
      log(`recorded ${((performance.now() - recording_start) / 1000).toFixed(1)}sec audio`);
      let d = new Date().toISOString()
      let fileName = `recordings/${p.jamId}/${recordingId}/${String(count). padStart(3, '0')}_${d}.wav`

      saveAudio(blob, fileName)
      saveTrainingData(recordingId, p.jamId, p.userId, fileName, kSampleRate, pageturns)
      setPageturns([]); setTimerStart(performance.now()); recording_start = performance.now()
      chunks=[];
      return
    }
    
    mediaRecorderForS3.start(kIntervalAudio_ms);
  }

  useEffect(() => {
    setContext(new AudioContext({
      sampleRate: kSampleRate,
      channelCount: 1,
      echoCancellation: false,
      autoGainControl: true,
      noiseSuppression: true,
    } as AudioContextOptions))

    if (window.Worker) {
      getMicrophone()
      startRecord()
      //startRecordforAI()
    }
  }, [aiWorker])

  return <>
    <div id="recording-modal" tabIndex={-1} aria-hidden="true" className={`${ !context || !mediaRecorderForS3 || isRecording ? "hidden":""} fixed top-0 left-0 right-0 z-50 w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(110%)] max-h-full bg-gray-900/75`}>
      <div className="relative w-full h-full max-w-md max-h-full mx-auto flex flex-col">
        <div className='flex-1' />
        <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
          <button type="button" onClick={() => {}}
              className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-800 dark:hover:text-white" data-modal-hide="recording-modal">
            <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            <span className="sr-only">Close modal</span>
          </button>
          <div className="px-6 py-6 lg:px-8">
              <h3 className="mb-4 text-xl font-medium text-gray-900 dark:text-white">Enable Audio for AI!</h3>
              <p className="mb-6 text-sm font-normal dark:text-gray-400 text-gray-800">
                We&apos;re using AI to help you turn the page automatically! Please let us listen to your beautiful voice! 😊
              </p>
              <span className="space-y-2">

                <button onClick={() => { startRecord() }} disabled={ !context || !mediaRecorderForS3}
                    className="w-full flex flex-row text-white bg-oslyn-700 hover:bg-oslyn-800 disabled:bg-gray-500 focus:ring-4 focus:outline-none focus:ring-oslyn-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-oslyn-600 dark:hover:bg-oslyn-700 dark:focus:ring-oslyn-800">
                      <div className='flex-1' />
                      <MicrophoneIcon className='ml-2.5 w-6 h-6' />
                      <div className="px-10 pr-2.5 pl-1.5" >Enable Audio</div>
                      <div className='flex-1' />
                </button>

                <div className="pt-4 text-sm font-medium text-gray-500 dark:text-gray-300">
                  Why can&apos;t I use this tool without AI? <a href="#" className="text-blue-700 hover:underline dark:text-blue-500">Instructions</a>
                </div>

              </span>
          </div>
        </div>
        <div className='flex-1' />
      </div>
    </div>

    <div className='text-gray-200 absolute left-0 bottom-0 h-52 w-64 overflow-y-scroll' style={{font: "1em consolas", whiteSpace: "pre-wrap"}}>
      {logText}
    </div>
  </>
}

function encodeFloatArr(f32arr: Float32Array){
  if (Object.prototype.toString.call(f32arr) != "[object Float32Array]") {
      f32arr =  new Float32Array(f32arr);
  }

  let encoded = '';
  new Uint8Array(f32arr.buffer).forEach(x => { encoded += (x | 0x100).toString(16).slice(1); })
  //for (let x of u) encoded  += (x | 0x100).toString(16).slice(1);

  console.log(encoded)
  return encoded;
}