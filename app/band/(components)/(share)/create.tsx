

interface CreateProps {
  bandId: string
  setClose: () => void
 }

export default function Create(p: CreateProps) {
  return <>
    <div className="ml-3 text-sm font-normal w-72">
      <div className="pb-2 text-xl font-semibold text-gray-900 dark:text-white">Create</div>
      <div className="pb-3 text-sm font-normal">Create a new Song!</div>

      <a href={`/songs/create?share=${p.bandId}`}>
        <button className="w-full flex flex-row text-white bg-oslyn-700 hover:bg-oslyn-800 focus:ring-4 focus:outline-none focus:ring-oslyn-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-oslyn-600 dark:hover:bg-oslyn-700 dark:focus:ring-oslyn-800 disabled:bg-gray-300 disabled:dark:bg-gray-700">
            <div className='flex-1' />
            <div className="px-10 py-0.5">Create</div>
            <div className='flex-1' />
        </button>
      </a>



    </div>
  </>
}