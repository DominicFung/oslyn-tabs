

export default function StartJam() {
  return <div className="text-white w-full">
    <ol className="m-4 flex items-center p-3 space-x-2 text-sm font-medium text-center text-gray-500 bg-white border border-gray-200 rounded-lg shadow-sm dark:text-gray-400 sm:text-base dark:bg-gray-800 dark:border-gray-700 sm:p-4 sm:space-x-4">
        <li className="flex items-center text-blue-600 dark:text-blue-500">
            <span className="flex items-center justify-center w-5 h-5 mr-2 text-xs border border-blue-600 rounded-full shrink-0 dark:border-blue-500">1</span>
            Select / Create a Song
            <svg aria-hidden="true" className="w-4 h-4 ml-2 md:ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
        </li>
        <li className="flex items-center">
            <span className="flex items-center justify-center w-5 h-5 mr-2 text-xs border border-gray-500 rounded-full shrink-0 dark:border-gray-400">2</span>
            Select a Key
            <svg aria-hidden="true" className="w-4 h-4 ml-2 md:ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
        </li>
        <li className="flex items-center">
            <span className="flex items-center justify-center w-5 h-5 mr-2 text-xs border border-gray-500 rounded-full shrink-0 dark:border-gray-400">3</span>
            QR Code
        </li>
    </ol>
  </div>
}