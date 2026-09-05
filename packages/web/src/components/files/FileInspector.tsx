import { useEffect, useState } from "preact/hooks"
import { Icon as FontAwesomeIcon } from "../Icon"
import { faGreaterThan, faLessThan, faXmark } from "@fortawesome/free-solid-svg-icons"
import { FileInspectorFileBody, type InspectorFile } from "./FileInspectorFileBody"
export function FileInspector({
  selection,
  directory,
  path = "",
  close,
}: {
  selection: InspectorFile[]
  directory?: InspectorFile
  path?: string
  close: () => void
}) {
  const selectedFiles = selection.length ? selection : directory ? [directory] : []
  const [fileIndex, setFileIndex] = useState(0)
  const maxIndex = selectedFiles.length - 1
  useEffect(() => {
    if (maxIndex < fileIndex) setFileIndex(maxIndex)
    if (fileIndex < 0) setFileIndex(0)
  }, [maxIndex, fileIndex])

  return (
    <>
      <div className="flex flex-row items-center justify-between border-b">
        <h2 className="font-heading text-xl font-bold ml-2">Inspector</h2>
        <button
          onClick={close}
          className="bg-orange-500 h-8 w-8 m-2 rounded-md hover:shadow-lg active:shadow-md text-white transition-shadow"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
      {selectedFiles.length === 1 && (
        <FileInspectorFileBody
          file={selectedFiles[0]!}
          path={selection.length ? path : path.split("/").slice(0, -1).join("/")}
        />
      )}
      {selectedFiles.length > 1 && (
        <>
          <FileInspectorFileBody
            file={selectedFiles[Math.max(0, Math.min(fileIndex, maxIndex))]!}
            path={path}
          />
          <div className="flex justify-center items-center">
            <button
              disabled={fileIndex === 0}
              onClick={() => setFileIndex((i) => i - 1)}
              className="bg-neutral-500 select-none disabled:bg-neutral-200 dark:disabled:bg-neutral-800 hover:bg-neutral-600 active:bg-neutral-700 transition-all rounded-md shadow-sm h-8 w-8 text-white"
            >
              <FontAwesomeIcon icon={faLessThan} />
            </button>
            <span className="font-bold m-2 italic inline-block w-12 text-center">
              {fileIndex + 1} / {maxIndex + 1}
            </span>
            <button
              disabled={fileIndex === maxIndex}
              onClick={() => setFileIndex((i) => i + 1)}
              className="bg-neutral-500 select-none disabled:bg-neutral-200 dark:disabled:bg-neutral-800 hover:bg-neutral-600 active:bg-neutral-700 transition-all rounded-md shadow-sm h-8 w-8 text-white"
            >
              <FontAwesomeIcon icon={faGreaterThan} />
            </button>
          </div>
        </>
      )}
      {selectedFiles.length === 0 && (
        <span className="text-sm m-2 italic inline-block">No files are selected.</span>
      )}
    </>
  )
}
