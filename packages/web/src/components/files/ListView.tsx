import useClickOutside from "../../hooks/useClickOutside"
import Anchor from "../../models/Anchor"
import { useEffect, useRef, useState } from "preact/hooks"
import RightClickMenu from "./RightClickMenu"
import shallow from "zustand/shallow"
import { useStore as useFVStore } from "../../store/FileViewStore"
import { FileModel, NamedFileModel } from "@crate/types"
import formatFileSize from "../../utils/formatFileSize"
import DirectoryEmpty from "./DirectoryEmpty"
import DirectoryLoading from "./DirectoryLoading"

export function FileRow({ file }: { file: FileModel }) {
  const [selected, setSelected] = useState(false)
  const [selectionInfo, select, deselect] = useFVStore(
    (state) => [state.selectedFiles, state.select, state.deselect],
    shallow,
  )
  const rowRef = useRef()

  const [anchorPos, setAnchorPos] = useState<null | Anchor>(null)
  const contextShown = Boolean(anchorPos)
  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault()
    setAnchorPos({ top: e.pageY, left: e.pageX })
    if (!selected) select(selectionInfo, true)
  }
  const handleClose = () => setAnchorPos(null)

  useEffect(() => {
    const newSelectedStatus = selectionInfo.map((i) => i.name).includes(file.name)
    setSelected(newSelectedStatus)
    if (contextShown && !newSelectedStatus) setAnchorPos(null)
  }, [contextShown, file.name, selectionInfo])

  useClickOutside({
    handler: (e) => {
      if (e.ctrlKey || e.metaKey || !selected) return
      deselect(selectionInfo)
    },
    ref: rowRef,
    exclude: [
      document.getElementById("file-toolbar"),
      document.getElementById("file-inspector"),
      ...document.getElementsByClassName("popover-menu"),
      ...document.getElementsByClassName("rightclick-menu"),
    ],
  })

  return (
    <>
      <tr
        onClick={(e) => select(selectionInfo, !e.ctrlKey && !e.metaKey)}
        onContextMenu={onContextMenu}
        className={`border-b border-opacity-30 ${
          selected ? "bg-orange-500 text-white" : "hover:bg-neutral-200 active:bg-neutral-300"
        } select-none cursor-pointer`}
      >
        <td className="p-2 pb-1 pt-1">{file.name}</td>
        <td />
        <td>{formatFileSize(file.size)}</td>
      </tr>

      {contextShown && <RightClickMenu close={handleClose} anchor={anchorPos} />}
    </>
  )
}

export function ListView({ files }: { files: NamedFileModel[] }) {
  const loading = useFVStore((state) => state.loading)
  return (
    <div className="mt-8 shadow-sm bg-white dark:bg-neutral-800 rounded-md border border-neutral-200 dark:border-neutral-700">
      {files.length === 0 && loading && <DirectoryLoading />}
      {files.length === 0 && !loading && <DirectoryEmpty />}
      {files.length !== 0 && (
        <table className="min-w-full text-left">
          <thead className="border-b border-opacity-30">
            <tr>
              <th className="p-2" scope="col">
                File Name
              </th>
              <th className="p-2" scope="col">
                Date
              </th>
              <th className="p-2" scope="col">
                Size
              </th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => (
              <FileRow file={file} key={file.name} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
