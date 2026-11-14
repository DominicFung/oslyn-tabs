export default function ListFallback({ label }: { label: string }) {
  return (
    <div className="mx-5 my-10 text-center text-gray-500 dark:text-gray-300" role="status">
      {label}
    </div>
  )
}
