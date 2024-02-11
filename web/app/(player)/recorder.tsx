"use client"

import { MicrophoneIcon } from '@heroicons/react/24/solid';
import * as ort from 'onnxruntime-web'
import { useEffect, useState } from 'react'
import { OslynSlide } from '@/core/types';

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
  const [ sess, setSess ] = useState<Whisper>()

  const main = async () => {
    ort.env.wasm.wasmPaths = {
      'ort-wasm.wasm': '/models/onnx/dist/ort-wasm.wasm',
      'ort-wasm-simd.wasm': '/models/onnx/dist/ort-wasm-simd.wasm',
      'ort-wasm-threaded.wasm': '/models/onnx/dist/ort-wasm-threaded.wasm',
    }

    log("loading model")
    try {
      setSess(new Whisper(kModel, (e: any) => {
        if (e === undefined) {
          log(`${kModel} loaded, ${ort.env.wasm.numThreads} threads`)
          ready()
        } else { log(`Error: ${e}`) }
      }))

      setContext(new AudioContext({
        sampleRate: kSampleRate,
        channelCount: 1,
        echoCancellation: false,
        autoGainControl: true,
        noiseSuppression: true,
      } as AudioContextOptions))

      if (!context) {
        throw new Error("no AudioContext, make sure domain has access to Microphone");
      }
    } catch (e) {
      log(`Error: ${e}`);
    }
  }

  const [context, setContext] = useState<AudioContext|null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder|null>(null)
  const [ isLoading, setIsLoading ] = useState(false)
  const [ isRecording, setIsRecording] = useState(false)
  const [timerStart, setTimerStart] = useState<number>(0)
  const [logText, setLogText] = useState("")
  
  //const [ showModal, setShowModal ] = useState(false)
  const [ chunks, setChunks ] = useState<BlobPart[]>([])
  //const [ storeInterval, setStoreInterval ] = useState<NodeJS.Timeout>()

  useEffect(() => { main(); getMicrophone(); return () => { stopRecord(); closeMicrophone() } }, [])
  useEffect(() => {
    if (context && mediaRecorder && sess) {
      if (!isRecording) startRecord()
      //if (!storeInterval) setStoreInterval( setInterval( store_audio_and_transcribe, 2000 ) )
    }
  }, [context, mediaRecorder, sess])

  // helpers
  const log = (i: string) => { console.log(`[${performance.now().toFixed(2)}] ${i}`); setLogText((p) => { return `${p}\n[${performance.now().toFixed(2)}] ${i}` }) }
  const sleep = (ms: number) => { return new Promise(resolve => setTimeout(resolve, ms)) }
  const busy = () => { setIsLoading(true) }
  const ready = () => { setIsLoading(false) }
  const update_status = (d: number) => {  }

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

  const closeMicrophone = () => {
    mediaRecorder && mediaRecorder.stop()
    mediaRecorder? mediaRecorder.ondataavailable = null : console.log("could not deregister recorder.ondataavailable")
    mediaRecorder? mediaRecorder.onstop = null : console.log("could not deregister recorder.onstop")
    setMediaRecorder(null)
    console.log(`closed Microphone!`)
  }

  // const startRecord = async () => {
  //   if (mediaRecorder === null) { log("ERROR no media recorder found."); return }
  //   if (!audioRef || !audioRef.current) { log("ERROR audio reference not found."); return }
  //   if (!context) { log("ERROR no audio context found."); return }
  //   setIsRecording(true)
      
  //   let recording_start = performance.now();
  //   setTimerStart(recording_start)
  //   let chunks: BlobPart[] = [];

  //   mediaRecorder.ondataavailable = (e) => { 
  //     chunks.push(e.data)
  //     log(`chunk length: ${chunks.length}`)
  //     if (chunks.length > chunkLen && !isLoading) { 
  //       const blob = new Blob(chunks, { 'type': 'audio/ogg; codecs=opus' })
  //       transcribe_file(window.URL.createObjectURL(blob), context)

  //       chunks = chunks.slice( Math.floor(chunkLen / 2) )
  //     }
  //   }

  //   mediaRecorder.onstop = () => {
  //     const blob = new Blob(chunks, { 'type': 'audio/ogg; codecs=opus' });
  //     log(`recorded ${((performance.now() - recording_start) / 1000).toFixed(1)}sec audio`);
  //     audioRef.current!.src = window.URL.createObjectURL(blob);
  //     setIsRecording(false)
  //   }
  //   mediaRecorder.start(kIntervalAudio_ms);
  // }

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
      if (chunks.length > chunkLen && !isLoading) { 
        mediaRecorder.stop()
        
        // we cannot put this in onStop because 
        // that will cause the recording to restart, IF stop was called manually
        await sleep(900); chunks=[]; 
        mediaRecorder.start(kIntervalAudio_ms)
      }
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { 'type': 'audio/ogg; codecs=opus' });
      log(`recorded ${((performance.now() - recording_start) / 1000).toFixed(1)}sec audio`);
      transcribe_file(window.URL.createObjectURL(blob), context)
    }
    
    mediaRecorder.start(kIntervalAudio_ms);
  }

  const stopRecord = () => {
    if (mediaRecorder) {
      setIsRecording(false)
      mediaRecorder.stop()
      setMediaRecorder(null)
      let time = performance.now() - timerStart
      log(`Recording stopped, ${time}`)
    }
  }

  // transcribe audio source
  async function transcribe_file(url: string, context: AudioContext|null) {
    if (!context) { log("Error: context is null"); return}

    busy();
    log("start transcribe ...");
    try {
        const buffer = await (await fetch(url)).arrayBuffer();
        const audioBuffer = await context.decodeAudioData(buffer);
        var offlineContext = new OfflineAudioContext(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate);
        var source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(offlineContext.destination);
        source.start();
        const renderedBuffer = await offlineContext.startRendering();
        const audio = renderedBuffer.getChannelData(0);
        process_audio(audio, performance.now(), 0, 0);
    }
    catch (e) {
        log(`Error: ${e}`);
        ready();
    }
  }

  // process audio buffer
  async function process_audio(audio: Float32Array, starttime: number, idx: number, pos: number) {
    if (!sess) { log("Error: sess is empty"); return }
    if (idx < audio.length) {
      // not done
      try {
        await sleep(kDelay);

        // run inference for 30 sec
        const xa = audio.slice(idx, idx + kSteps);
        const start = performance.now();
        const ret = await sess.run(new ort.Tensor(xa, [1, xa.length]));
        const diff = performance.now() - start;
        update_status(diff);

        // append results to textarea 
        setText((a) => { 
          console.log(`page: ${p.page}`)
          let ans = placementInSlide(ret.str.data[0] as string, p.slides, p.page)
          return `${a}${ret.str.data[0]} ${JSON.stringify(ans)}\n` 
        })
        await sleep(kDelay);
        process_audio(audio, starttime, idx + kSteps, pos + 30);
      } catch (e) {
        log(`Error: ${e}`);
        ready();
      }
    } else {
      // done with audio buffer
      const processing_time = ((performance.now() - starttime) / 1000);
      const total = (audio.length / kSampleRate);
      log(`total ${processing_time.toFixed(1)}sec for ${total.toFixed(1)}sec`);
      ready();
    }
  }

  const [ text, setText ] = useState("")

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
                We&apos;re using AI to help you turn the page automatically! Please let us listen to your beautiful voice! 😊
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
    <div className='text-gray-200 absolute right-0 bottom-0 h-52 w-64 overflow-y-scroll' style={{font: "1em consolas", whiteSpace: "pre-wrap"}}>
      {text}
    </div>
  </>
}

// wrapper around onnxruntime and model
class Whisper {
  sess: ort.InferenceSession | null
  min_length: Int32Array
  max_length: Int32Array
  num_return_sequences: Int32Array
  length_penalty: Float32Array
  repetition_penalty: Float32Array
  attention_mask: Int32Array

  constructor(url: string, cb: any) {
      ort.env.logLevel = "error";
      this.sess = null;

      // semi constants that we initialize once and pass to every run() call
      this.min_length = Int32Array.from({ length: 1 }, () => 1);
      this.max_length = Int32Array.from({ length: 1 }, () => 448);
      this.num_return_sequences = Int32Array.from({ length: 1 }, () => 1);
      this.length_penalty = Float32Array.from({ length: 1 }, () => 1.);
      this.repetition_penalty = Float32Array.from({ length: 1 }, () => 1.);
      this.attention_mask = Int32Array.from({ length: 1 * 80 * 3000 }, () => 0);

      const opt = {
          executionProviders: ["wasm"],
          logSeverityLevel: 0,
          logVerbosityLevel: 0
      } as ort.InferenceSession.SessionOptions
      ort.InferenceSession.create(`${window.location.protocol}//${window.location.hostname}${window.location.port?`:${window.location.port}`:""}/${url}`, opt).then((s) => {
          this.sess = s;
          cb();
      }, (e) => { cb(e); })
    }

    async run(audio_pcm: ort.TypedTensor<"float32">, beams = 1) {
      if (!this.sess) throw "no session available"
      // clone semi constants into feed. The clone is needed if we run with ort.env.wasm.proxy=true
      const feed = {
          "audio_pcm": audio_pcm,
          "max_length": new ort.Tensor(new Int32Array(this.max_length), [1]),
          "min_length": new ort.Tensor(new Int32Array(this.min_length), [1]),
          "num_beams": new ort.Tensor(Int32Array.from({ length: 1 }, () => beams), [1]),
          "num_return_sequences": new ort.Tensor(new Int32Array(this.num_return_sequences), [1]),
          "length_penalty": new ort.Tensor(new Float32Array(this.length_penalty), [1]),
          "repetition_penalty": new ort.Tensor(new Float32Array(this.repetition_penalty), [1]),
          //"attention_mask": new ort.Tensor(new Int32Array(this.attention_mask), [1, 80, 3000]),
      }
      console.log(this.sess)
      console.log(feed)

      console.log("transcribe started")
      const result = await this.sess.run(feed)
      console.log("transcribe ended")

      console.log(result)
      return result
  }
}

interface Suggestion {
  wordsUntilEnd: number
  page: number
}

/**
 * @param s1          string output by ASR to be matched with reference
 * @param reference   reference oslyn slides
 * @param pn          page number
 * 
 * given a string, s1, output by ASR (openai/Whisper).
 * find the placement
 */
function placementInSlide(s1: string, reference: OslynSlide, pn: number, cutoff=0.9) {
  let input = s1.replace(/[!"#$%&()*+,.:;<=>?@[\]^_`{|}~]/g, '').trim().toLowerCase()
  console.log(input)
  
  // start with current page
  if (reference.pages.length < pn ) { console.error("page doesnt exist in slides"); return }
  let slide = reference.pages[pn]

  let refText = ""
  for (const l of slide.lines) { refText = `${refText} ${l.lyric}` }
  refText = refText.replace(/[!"#$%&()*+,.:;<=>?@[\]^_`{|}~]/g, '').trim().toLowerCase()
    
  const ans = findApproximateSubstringLocation(input, refText)
  if ( ans.percentageMatch <= cutoff ) return { ...ans, pn }
  
  console.log(`could not find ans with large cutoff > ${cutoff}`)
  console.log(ans)
  return
}

function findApproximateSubstringLocation(x: string, y: string): { position: number; percentageMatch: number } {
  const xLength = x.length;
  const yLength = y.length;

  let maxMatch = 0;
  let bestPosition = -1;

  for (let i = 0; i <= yLength - xLength; i++) {
      const substringY = y.substring(i, i + xLength);
      let matchCount = 0;

      // Count matching characters
      for (let j = 0; j < xLength; j++) {
          if (x[j] === substringY[j]) {
              matchCount++;
          }
      }

      // Calculate percentage match
      const percentageMatch = (matchCount / xLength) * 100;

      // Update if this position has a higher match percentage
      if (percentageMatch > maxMatch) {
          maxMatch = percentageMatch;
          bestPosition = i;
      }
  }

  return {
      position: bestPosition,
      percentageMatch: maxMatch,
  };
}