import useClickOutside from "../../hooks/useClickOutside"
import type Anchor from "../../models/Anchor"
import { useEffect, useRef, useState } from "preact/hooks"
import RightClickMenu, { type FileMenuActions } from "./RightClickMenu"
import type { FileEntry } from "../../lib/api"
import formatFileSize from "../../utils/formatFileSize"
import DirectoryEmpty from "./DirectoryEmpty"
import DirectoryLoading from "./DirectoryLoading"

export type FileViewProps = {
  loading?: boolean
  emptyMessage?: string
  files: FileEntry[]
  selected: string[]
  pending: boolean
  onSelect: (id: string, selected: boolean, additive?: boolean) => void
  onOpen: (file: FileEntry) => void
  menuActions?: (selection: FileEntry[]) => FileMenuActions
  onDeselect?: (ids: string[]) => void
  onRename?: (file: FileEntry, name: string) => Promise<boolean>
}
export function FileRow({ file, ...props }: FileViewProps & { file: FileEntry }) {
  const [selected, setSelected] = useState(false)
  const selectionInfo = props.selected
  const select = (replace: boolean) => props.onSelect(file.id, !selected, !replace)
  const rowRef = useRef<HTMLTableRowElement>(null)

  const [anchorPos, setAnchorPos] = useState<null | Anchor>(null)
  const contextShown = Boolean(anchorPos)
  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setAnchorPos({ top: e.clientY, left: e.clientX })
    if (!selected) select(true)
  }
  const handleClose = () => setAnchorPos(null)

  useEffect(() => {
    const newSelectedStatus = selectionInfo.includes(file.id)
    setSelected(newSelectedStatus)
    if (contextShown && !newSelectedStatus) setAnchorPos(null)
  }, [contextShown, file.id, selectionInfo])

  useClickOutside({
    handler: (e) => {
      if (e.ctrlKey || e.metaKey || !selected) return
      props.onDeselect?.(selectionInfo)
    },
    ref: rowRef,
    exclude: [
      document.getElementById("file-toolbar"),
      document.getElementById("file-inspector"),
      ...document.getElementsByClassName("popover-menu"),
      ...document.getElementsByClassName("rightclick-menu"),
      ...document.getElementsByClassName("popover"),
    ],
  })

  return (
    <>
      <tr
        ref={rowRef}
        onDblClick={() => !props.pending && props.onOpen(file)}
        onClick={(e) => !props.pending && select(!e.ctrlKey && !e.metaKey)}
        onContextMenu={onContextMenu}
        className={`border-b border-neutral-500/30 ${
          selected ? "bg-orange-500 text-white" : "hover:bg-neutral-200 active:bg-neutral-300"
        } select-none cursor-pointer`}
      >
        <td className="p-2 pb-1 pt-1">{file.name}</td>
        <td />
        <td>{file.kind === "directory" ? "—" : formatFileSize(file.size)}</td>
      </tr>

      {contextShown && props.menuActions && (
        <RightClickMenu
          close={handleClose}
          anchor={anchorPos!}
          pending={props.pending}
          selection={props.files.filter((entry) => selectionInfo.includes(entry.id))}
          {...props.menuActions(props.files.filter((entry) => selectionInfo.includes(entry.id)))}
        />
      )}
    </>
  )
}

export function ListView({ files, ...props }: FileViewProps) {
  const loading = props.loading
  return (
    <div className="mt-8 shadow-sm bg-white dark:bg-neutral-800 rounded-md border border-neutral-200 dark:border-neutral-700">
      {files.length === 0 && loading && <DirectoryLoading />}
      {files.length === 0 && !loading && <DirectoryEmpty message={props.emptyMessage} />}
      {files.length !== 0 && (
        <table className="file-table min-w-full text-left">
          <thead className="border-b border-neutral-500/30">
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
              <FileRow file={file} key={file.id} files={files} {...props} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
