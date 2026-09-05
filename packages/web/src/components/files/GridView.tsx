import { faFile, faFolder } from "@fortawesome/free-solid-svg-icons"
import { Icon as FontAwesomeIcon } from "../Icon"
import { useEffect, useRef, useState } from "preact/hooks"
import useClickOutside from "../../hooks/useClickOutside"
import RightClickMenu from "./RightClickMenu"
import type Anchor from "../../models/Anchor"
import DirectoryLoading from "./DirectoryLoading"
import DirectoryEmpty from "./DirectoryEmpty"
import type { FileEntry } from "../../lib/api"
import type { FileViewProps } from "./ListView"
import { validName } from "../../lib/files"

type IconState = "empty" | "selected" | "hovered"
const getIconState = (selected: boolean, hovered: boolean): IconState => {
  if (selected) return "selected"
  return hovered ? "hovered" : "empty"
}

function NameInput({
  oldName,
  onComplete,
  onCancel,
  pending,
}: {
  oldName: string
  pending: boolean
  onComplete: (newName: string) => void
  onCancel: () => void
}) {
  const fiRef = useRef<HTMLInputElement>(null)
  const [val, setVal] = useState(oldName)

  useEffect(() => {
    if (!fiRef.current) return
    fiRef.current.focus()
  }, [])

  useEffect(() => {
    const keyPressListener = (e: KeyboardEvent) => {
      if (pending) return
      if (e.key === "Escape") {
        onCancel()
      } else if (e.key === "Enter") {
        e.preventDefault()
        onComplete(fiRef.current?.value ?? val)
      }
    }
    document.addEventListener("keydown", keyPressListener)
    return () => document.removeEventListener("keydown", keyPressListener)
  }, [onCancel, onComplete, val, pending])

  useClickOutside({
    ref: fiRef,
    handler: () => {
      if (!fiRef.current || pending) return
      onComplete(fiRef.current?.value ?? val)
    },
  })

  return (
    <input
      className="h-5 text-sm text-center border-gray-500"
      type="text"
      disabled={pending}
      ref={fiRef}
      value={val}
      autoFocus={true}
      onInput={(e) => {
        if (e && e.target) setVal((e.target as HTMLInputElement).value)
      }}
    />
  )
}

function FileIcon({ file, ...props }: FileViewProps & { file: FileEntry }) {
  const [hovered, setHovered] = useState(false)
  const [selected, setSelected] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [anchorPos, setAnchorPos] = useState<null | Anchor>(null)
  const contextShown = Boolean(anchorPos)

  const selectionInfo = props.selected
  const select = (replace: boolean) => props.onSelect(file.id, !selected, !replace)
  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!selected) select(true)
    setAnchorPos({ top: e.clientY, left: e.clientX })
  }
  const handleClose = () => setAnchorPos(null)

  useEffect(() => {
    const newSelectedStatus = selectionInfo.includes(file.id)
    setSelected(newSelectedStatus)
    if (contextShown && !newSelectedStatus) setAnchorPos(null)
  }, [contextShown, file.id, selectionInfo])

  const iconRef = useRef<HTMLDivElement>(null)
  useClickOutside({
    ref: iconRef,
    handler: (e) => {
      if (e.ctrlKey || e.metaKey || !selected) return
      props.onDeselect?.(selectionInfo)
    },
    exclude: [
      document.getElementById("file-toolbar"),
      document.getElementById("file-inspector"),
      ...document.getElementsByClassName("popover-menu"),
      ...document.getElementsByClassName("rightclick-menu"),
      ...document.getElementsByClassName("popover"),
    ],
  })

  const iconState = getIconState(selected || editingName, hovered)
  return (
    <>
      <div
        className="flex flex-col items-center justify-center select-none w-36 h-36"
        onClick={(e) => !props.pending && !editingName && select(!e.ctrlKey && !e.metaKey)}
        onDblClick={() => {
          if (!editingName && !props.pending) props.onOpen(file)
        }}
        onContextMenu={onContextMenu}
        onMouseOver={() => setHovered(true)}
        onMouseOut={() => setHovered(false)}
        ref={iconRef}
      >
        <div
          className={"file-icon-pad flex justify-center items-center rounded-md m-1 w-24 h-24 [&_.icon]:size-16 ".concat(
            iconState === "hovered" ? "bg-neutral-500/10 " : "",
            iconState === "selected" ? "bg-neutral-500/40 " : "",
          )}
        >
          <FontAwesomeIcon
            icon={file.kind === "file" ? faFile : faFolder}
            className="w-16 h-16 m-2 text-orange-500"
          />
        </div>
        {editingName ? (
          <NameInput
            oldName={file.name}
            pending={props.pending}
            onCancel={() => {
              setEditingName(false)
            }}
            onComplete={async (newName) => {
              if (newName === file.name) {
                setEditingName(false)
                return
              }
              if (!validName(newName) || props.pending) return
              if (await props.onRename?.(file, newName)) setEditingName(false)
            }}
          />
        ) : (
          <span
            className={"file-label px-1 font-medium text-sm rounded-md select-text ".concat(
              iconState === "hovered" ? "bg-neutral-500/10 " : "",
              iconState === "selected" ? "bg-orange-500 text-white " : "",
            )}
          >
            {file.name.split(".")[0]}
          </span>
        )}
      </div>
      {contextShown && props.menuActions && (
        <RightClickMenu
          close={handleClose}
          anchor={anchorPos!}
          pending={props.pending}
          selection={props.files.filter((entry) => selectionInfo.includes(entry.id))}
          {...props.menuActions(props.files.filter((entry) => selectionInfo.includes(entry.id)))}
          onRenameRequest={() => setEditingName(true)}
        />
      )}
    </>
  )
}

export function GridView({ files, ...props }: FileViewProps) {
  const loading = props.loading
  return (
    <div className="p-2 mt-8 bg-white border sm:p-4 md:p-8 shadow-sm dark:bg-neutral-800 rounded-md border-neutral-200 dark:border-neutral-700">
      {loading && <DirectoryLoading />}
      {files.length === 0 && !loading && <DirectoryEmpty message={props.emptyMessage} />}
      {files.length !== 0 && !loading && (
        <div
          className="file-grid w-full grid"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(9rem, 1fr))",
          }}
        >
          {files.map((el) => (
            <FileIcon file={el} key={el.id} files={files} {...props} />
          ))}
        </div>
      )}
    </div>
  )
}
