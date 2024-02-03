"use client"

import { MicrophoneIcon } from '@heroicons/react/24/solid'
import { useMemo, useEffect, useState } from 'react'
import { OslynSlide } from '@/core/types'
import { Message } from './(workers)/ai';

const kSampleRate = 16000;
const kIntervalAudio_ms = 1000;
const kSteps = kSampleRate * 30;
const kDelay = 100;
const kModel = "models/onnx/v3/whisper_cpu_int8_cpu-cpu_model.onnx"

const chunkLen = 4

interface RecorderProps {
  slides: OslynSlide,
  page: number
}

export default function Recorder(p: RecorderProps) {
  const aiWorker: Worker = useMemo(() => new Worker(new URL("./(workers)/ai.ts", import.meta.url )), [])

  const [context, setContext] = useState<AudioContext|null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder|null>(null)
  const [timerStart, setTimerStart] = useState<number>(0)
  const [isRecording, setIsRecording] = useState(false)
  const [logText, setLogText] = useState("")

  // helpers
  const log = (i: string) => { console.log(`[${performance.now().toFixed(2)}] ${i}`); setLogText((p) => { return `${p}\n[${performance.now().toFixed(2)}] ${i}` }) }
  const sleep = (ms: number) => { return new Promise(resolve => setTimeout(resolve, ms)) }

  const getMicrophone = async () => {
    if (mediaRecorder === null) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        setMediaRecorder(new MediaRecorder(stream))
      } catch (e) {
        setIsRecording(false)
        log(`Access to Microphone, ${e}`);
      }
    }
  }

  const startRecord = async () => {
    if (mediaRecorder === null) { log("ERROR no media recorder found."); return }
    if (!context) { log("ERROR no audio context found."); return }
    setIsRecording(true)
      
    let recording_start = performance.now();
    setTimerStart(recording_start)
    let chunks: BlobPart[] = [];

    mediaRecorder.ondataavailable = async (e) => { 
      chunks.push(e.data)
      log(`chunk length: ${chunks.length}`)
      if (chunks.length > chunkLen) { 
        mediaRecorder.stop()
        
        // we cannot put this in onStop because 
        // that will cause the recording to restart, IF stop was called manually
        await sleep(900); chunks=[]; 
        //mediaRecorder.start(kIntervalAudio_ms)
      }
    }

    mediaRecorder.onstop = async () => {
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
    
    mediaRecorder.start(kIntervalAudio_ms);
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
    }
  }, [aiWorker])

  return <>

    <div id="authentication-modal" tabIndex={-1} aria-hidden="true" className={`${ !context || !mediaRecorder || !isRecording ? "":"hidden"} fixed top-0 left-0 right-0 z-50 w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(110%)] max-h-full bg-gray-900/75`}>
      <div className="relative w-full h-full max-w-md max-h-full mx-auto flex flex-col">
        <div className='flex-1' />
        <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
          <button type="button" onClick={() => {}}
              className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-800 dark:hover:text-white" data-modal-hide="authentication-modal">
            <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            <span className="sr-only">Close modal</span>
          </button>
          <div className="px-6 py-6 lg:px-8">
              <h3 className="mb-4 text-xl font-medium text-gray-900 dark:text-white">Enable Audio for AI!</h3>
              <p className="mb-6 text-sm font-normal dark:text-gray-400 text-gray-800">
                We're using AI to help you turn the page automatically! Please let us listen to your beautiful voice! 😊
              </p>
              <span className="space-y-2">

                <button onClick={() => { startRecord() }} disabled={ !context || !mediaRecorder}
                    className="w-full flex flex-row text-white bg-oslyn-700 hover:bg-oslyn-800 focus:ring-4 focus:outline-none focus:ring-oslyn-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-oslyn-600 dark:hover:bg-oslyn-700 dark:focus:ring-oslyn-800">
                      <div className='flex-1' />
                      <MicrophoneIcon className='ml-2.5 w-6 h-6' />
                      <div className="px-10 pr-2.5 pl-1.5" >Enable Audio</div>
                      <div className='flex-1' />
                </button>

                <div className="pt-4 text-sm font-medium text-gray-500 dark:text-gray-300">
                  Why can't I use this tool without AI? <a href="#" className="text-blue-700 hover:underline dark:text-blue-500">Instructions</a>
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