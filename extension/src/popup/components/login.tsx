import React from "react"

interface LoginProps {}

export default function Login(p: LoginProps) {
  return <>
      <div className="relative max-w-md max-h-full mx-auto flex flex-col">
        <div className='flex-1' />
        <div className="relative bg-white shadow dark:bg-gray-700">
          <button type="button" onClick={() => { window.close() } }
              className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-800 dark:hover:text-white" data-modal-hide="authentication-modal">
            <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            <span className="sr-only">Close modal</span>
          </button>
          <div className="px-6 py-6 lg:px-8">
              <h3 className="mb-4 text-xl font-medium text-gray-900 dark:text-white">Oslyn Extension</h3>
              <p className="mb-6 text-sm font-normal dark:text-gray-400">Looks like your session is expired on Oslyn, Click below to login.</p>
              <span className="space-y-2">

                <button onClick={() => { chrome.tabs.create({ url: "https://tabs.oslyn.io/login" }) } }
                    className="w-full flex flex-row text-white bg-oslyn-700 hover:bg-oslyn-800 focus:ring-4 focus:outline-none focus:ring-oslyn-300 font-medium rounded-lg text-sm px-5 py-1 text-center dark:bg-oslyn-600 dark:hover:bg-oslyn-700 dark:focus:ring-oslyn-800">
                      <div className='flex-1' />
                      <div className="px-10 py-2.5" >Oslyn Login</div>
                      <div className='flex-1' />
                </button>


                <div className="pt-4 text-sm font-medium text-gray-500 dark:text-gray-300">
                    Social media? What&apos;s Social media?? <a href="#" className="text-blue-700 hover:underline dark:text-blue-500">Instructions</a>
                </div>

              </span>
          </div>
        </div>
        <div className='flex-1' />
      </div>
  </>
}