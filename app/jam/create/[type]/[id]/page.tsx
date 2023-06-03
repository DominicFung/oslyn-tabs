import Image from "next/image"
import KeySelector from "./keySelector"

const _types = ["song", "set"]
const _img = "https://i.scdn.co/image/ab67616d00001e02b84fbe2988f4056c658634c8"

export default async function CreateJam({ params }: { params: { type: string, id: string } }) {
  
  if (!params.type || !_types.includes(params.type.toLowerCase()) ) { 
    throw `Jam Submission type: ${params.type} Not Found.` 
  }

  if (!params.id) {
    throw `Jam Submission SongId: ${params.id} Not Provided.` 
  }

  const type = params.type.toLowerCase()
  const songId = params.id

  console.log(`PAGE: /jam/create/${type}/${songId}`)

  const data = {
    songId, title: "Your Love Awakens Me", artist: "Phil Wickham",
    album: "Children of God", albumCover: _img
  }


  return <>
    {type === "song" && <>
      <section className="bg-white dark:bg-gray-900 bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern.svg')] dark:bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern-dark.svg')]">
        <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16 z-10 relative">
            <Image src={data.albumCover} alt={""} width={192} height={192} className="w-48 m-2 mx-auto" />
            <div className="mt-6">
              <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl lg:text-5xl dark:text-gray-100">{data.title}</h1>
              <p className="mb-4 text-lg font-normal text-gray-500 lg:text-lg dark:text-blue-300">
                {data.artist} - {data.album}
              </p>
              <p className="mb-0 text-lg font-normal text-gray-500 lg:text-xl dark:text-gray-300">
                Choose your key to get started on your Jam!
              </p>
            </div>
        </div>
        <div className="bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-900 w-full h-full absolute top-0 left-0 z-0"></div>
      </section>
      <div className="mt-4 mx-auto max-w-xl flex flex-row">
        <KeySelector songId={songId} />
        <button></button>
      </div>
    </>}

    {type === "set" && <>
    
    </>}
  </>
}