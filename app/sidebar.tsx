"use client"

import Image from "next/image";
import { usePathname } from "next/navigation"
import { useSideBarContext } from "@/app/context";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

export default function Sidebar () {
  const path = usePathname()
  const {openSidebar, setOpenSidebar } = useSideBarContext()

  return <>
  <aside id="cta-button-sidebar" className={`fixed top-0 left-0 z-40 w-64 h-screen transition-transform ${openSidebar?"translate-x-0":"-translate-x-full"}`} aria-label="Sidebar">
    <div className={`relative h-0 w-0 top-4 ${openSidebar?"left-56":"left-72"}`}>
      <button onClick={() => setOpenSidebar(!openSidebar)}
        className="z-90 bg-gray-50 dark:bg-gray-700 w-16 h-16
        rounded-full p-4 drop-shadow-lg flex justify-center items-center text-4xl hover:bg-coral-300"
      >
        {openSidebar ? <ChevronLeftIcon className="w-16 h-16 text-white"/> :
        <ChevronRightIcon className="w-16 h-16 text-white"/> }
      </button>
    </div>
   
    <div className="h-full px-3 py-4 pt-4 overflow-y-auto bg-gray-50 dark:bg-gray-800">
      <a href="/" className="flex items-center pl-2.5 my-5">
         <Image src="/logo-wave.png" className="h-6 mr-3 md:h-7" width={50} height={50} alt="Oslyn Logo" />
         <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white">Oslyn Tabs</span>
      </a>
     <ul className="space-y-2 font-medium">
        <li>
          <a href="/jam/start" className={`flex items-center p-2 rounded-lg text-gray-900 dark:text-white ${
            path.startsWith('/jam') ? "bg-gray-100 dark:bg-gray-700" : "hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}>
              <svg aria-hidden="true" className="flex-shrink-0 w-6 h-6 transition duration-75 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
              <span className="flex-1 ml-3 whitespace-nowrap">Jam Session</span>
              <span className="inline-flex items-center justify-center px-2 ml-3 text-sm font-medium text-gray-800 bg-gray-200 rounded-full dark:bg-gray-700 dark:text-gray-300">Start</span>
           </a>
        </li>
        <li>
          <a href="/songs" className={`flex items-center p-2 rounded-lg text-gray-900 dark:text-white ${
            path.startsWith('/songs') ? "bg-gray-100 dark:bg-gray-700" : "hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}>
              <svg aria-hidden="true" className="flex-shrink-0 w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M8.707 7.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l2-2a1 1 0 00-1.414-1.414L11 7.586V3a1 1 0 10-2 0v4.586l-.293-.293z"></path><path d="M3 5a2 2 0 012-2h1a1 1 0 010 2H5v7h2l1 2h4l1-2h2V5h-1a1 1 0 110-2h1a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z"></path></svg>
              <span className="flex-1 ml-3 whitespace-nowrap">My Songs</span>
              <span className="inline-flex items-center justify-center w-3 h-3 p-3 ml-3 text-sm font-medium text-oslyn-800 bg-oslyn-100 rounded-full dark:bg-oslyn-900 dark:text-oslyn-300">20</span>
           </a>
        </li>
        <li>
          <a href="/sets" className={`flex items-center p-2 rounded-lg text-gray-900 dark:text-white ${
            path.startsWith('/sets') ? "bg-gray-100 dark:bg-gray-700" : "hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}>
              <svg aria-hidden="true" className="flex-shrink-0 w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M8.707 7.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l2-2a1 1 0 00-1.414-1.414L11 7.586V3a1 1 0 10-2 0v4.586l-.293-.293z"></path><path d="M3 5a2 2 0 012-2h1a1 1 0 010 2H5v7h2l1 2h4l1-2h2V5h-1a1 1 0 110-2h1a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z"></path></svg>
              <span className="flex-1 ml-3 whitespace-nowrap">My Sets</span>
              <span className="inline-flex items-center justify-center w-3 h-3 p-3 ml-3 text-sm font-medium text-oslyn-800 bg-oslyn-100 rounded-full dark:bg-oslyn-900 dark:text-oslyn-300">3</span>
           </a>
        </li>
        <li>
           <a href="#" className={`flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700`}>
              <svg aria-hidden="true" className="flex-shrink-0 w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
              <span className="flex-1 ml-3 whitespace-nowrap">My Band</span>
           </a>
        </li>
        <li>
           <a href="#" className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
              <svg aria-hidden="true" className="flex-shrink-0 w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"></path></svg>
              <span className="flex-1 ml-3 whitespace-nowrap">Sign In</span>
           </a>
        </li>
     </ul>
     <div id="dropdown-cta" className="p-4 mt-6 rounded-lg bg-oslyn-50 dark:bg-oslyn-900" role="alert">
        <div className="flex items-center mb-3">
           <span className="bg-coral-100 text-coral-800 text-sm font-semibold mr-2 px-2.5 py-0.5 rounded dark:bg-coral-200 dark:text-coral-900">Alpha</span>
           <button type="button" className="ml-auto -mx-1.5 -my-1.5 bg-oslyn-50 text-oslyn-900 rounded-lg focus:ring-2 focus:ring-oslyn-400 p-1 hover:bg-oslyn-200 inline-flex h-6 w-6 dark:bg-oslyn-900 dark:text-oslyn-400 dark:hover:bg-oslyn-800" data-dismiss-target="#dropdown-cta" aria-label="Close">
                 <span className="sr-only">Close</span>
                 <svg aria-hidden="true" className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
           </button>
        </div>
        <p className="mb-3 text-sm text-oslyn-800 dark:text-oslyn-200">
           This App is currently in Alpha! Music brings people together and online tabs should reflect that! Help us make this app better by providing feedback.
        </p>
        <a className="text-sm text-oslyn-800 underline font-medium hover:text-oslyn-900 dark:text-oslyn-400 dark:hover:text-oslyn-300" href="#">Give Feedback!</a>
     </div>
    </div>
  </aside>
  
</>}