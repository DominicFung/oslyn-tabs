
/**
 * Lavender (web):  #ede7f6
 * Oslyn Purple:    #651fff
 * Coral:           #ff8a65
 * Rasin Black:     #23232d
 * Eerie Black:     #212121
 */

import { CameraIcon, QrCodeIcon } from "@heroicons/react/24/solid";

export default function Home() {
  return (
    <main className="">
      <section className="bg-white dark:bg-gray-900 bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern.svg')] dark:bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern-dark.svg')]">
        <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16 z-10 relative">
            <a href="#" className="inline-flex justify-between items-center py-1 px-1 pr-4 mb-7 text-sm text-oslyn-700 bg-oslyn-100 rounded-full dark:bg-oslyn-900 dark:text-oslyn-300 hover:bg-oslyn-200 dark:hover:bg-oslyn-800">
                <span className="text-xs bg-oslyn-600 rounded-full text-white px-4 py-1.5 mr-3">New</span> <span className="text-sm font-medium">Upload your chord sheets today!</span> 
                <svg aria-hidden="true" className="ml-2 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path></svg>
            </a>
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight leading-none text-gray-900 md:text-5xl lg:text-6xl dark:text-white">Jam Now!</h1>
            <p className="mb-8 text-lg font-normal text-gray-500 lg:text-xl sm:px-16 lg:px-48 dark:text-oslyn-200">
              Synchronized chord sheets, built for spontanious jamming! Let Oslyn choose the next song for you <span className="text-sm">(and your band)</span> in the key meant for your voice! 
              Elevate your jamming experience for FREE.
            </p>
            <form className="w-full max-w-md mx-auto">   
                <label htmlFor="default-email" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Jam Session Id</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <QrCodeIcon className="w-6 h-6 text-gray-200" />
                    </div>
                    <input type="text" id="default-text" className="block w-full p-4 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-oslyn-500 focus:border-oslyn-500 dark:bg-gray-800 dark:border-gray-700 dark:placeholder-gray-400 dark:text-white dark:focus:ring-oslyn-500 dark:focus:border-oslyn-500" placeholder="Jam Session Id" required />
                    <button type="submit" className="text-white absolute right-16 bottom-2.5 bg-oslyn-700 hover:bg-oslyn-800 focus:ring-4 focus:outline-none focus:ring-oslyn-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-oslyn-600 dark:hover:bg-oslyn-700 dark:focus:ring-oslyn-800">Submit</button>
                    <button type="submit" className="text-white absolute right-2.5 bottom-2.5 py-2.5 bg-oslyn-700 hover:bg-oslyn-800 focus:ring-4 focus:outline-none focus:ring-oslyn-300 font-medium rounded-lg text-sm px-4 dark:bg-oslyn-600 dark:hover:bg-oslyn-700 dark:focus:ring-oslyn-800">
                      <CameraIcon className="w-4 h-4 text-gray-200" />
                    </button>
                </div>
            </form>
        </div>
        <div className="bg-gradient-to-b from-oslyn-50 to-transparent dark:from-oslyn-900 w-full h-full absolute top-0 left-0 z-0"></div>
      </section>
    </main>
  )
}
