export default function DirectoryEmpty({
  message = "This directory is empty.",
}: {
  message?: string
}) {
  return <div className="w-full text-center italic">{message}</div>
}
