import { faFile, faFolder } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useEffect, useRef, useState } from "preact/hooks"
import useClickOutside from "../../hooks/useClickOutside"
import RightClickMenu from "./RightClickMenu"
import Anchor from "../../models/Anchor"
import { useFileStore } from "../../store/FileStore"
import shallow from "zustand/shallow"
import { useStore as useFVStore } from "../../store/FileViewStore"
import { FileType, NamedFileModel } from "@crate/types"
import { joinPath } from "@crate/utils"
import DirectoryLoading from "./DirectoryLoading"
import DirectoryEmpty from "./DirectoryEmpty"

type IconState = "empty" | "selected" | "hovered"
const getIconState = (selected: boolean, hovered: boolean): IconState => {
  if (selected) return "selected"
  return hovered ? "hovered" : "empty"
}

function NameInput({
  oldName,
  onComplete,
  onCancel,
}: {
  oldName: string
  onComplete: (newName: string) => void
  onCancel: () => void
}) {
  const fiRef = useRef<HTMLInputElement>()
  const [val, setVal] = useState(oldName)

  useEffect(() => {
    if (!fiRef.current) return
    fiRef.current.focus()
  }, [])

  useEffect(() => {
    const keyPressListener = (e) => {
      if (e.key === "Escape") {
        onCancel()
      } else if (e.key === "Enter") {
        onComplete(val)
      }
    }
    document.addEventListener("keydown", keyPressListener)
    return () => document.removeEventListener("keydown", keyPressListener)
  }, [onCancel, onComplete, val])

  useClickOutside({
    ref: fiRef,
    handler: () => {
      if (!fiRef.current) return
      onComplete(val)
    },
  })

  return (
    <input
      className="h-5 text-sm text-center border-gray-500"
      type="text"
      ref={fiRef}
      value={val}
      autoFocus={true}
      onInput={(e) => {
        if (e && e.target) setVal((e.target as HTMLInputElement).value)
      }}
    />
  )
}

function FileIcon({ file }: { file: { name: string; cid: string; type?: FileType } }) {
  const [hovered, setHovered] = useState(false)
  const [selected, setSelected] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [anchorPos, setAnchorPos] = useState<null | Anchor>(null)
  const contextShown = Boolean(anchorPos)

  const [selectionInfo, select, deselect, path, setPath] = useFVStore(
    (state) => [state.selectedFiles, state.select, state.deselect, state.path, state.setPath],
    shallow,
  )

  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault()
    if (!selected) select(file, true)
    setAnchorPos({ top: e.pageY, left: e.pageX })
  }
  const handleClose = () => setAnchorPos(null)

  useEffect(() => {
    const newSelectedStatus = selectionInfo.map((i) => i.name).includes(file.name)
    setSelected(newSelectedStatus)
    if (contextShown && !newSelectedStatus) setAnchorPos(null)
  }, [contextShown, file.name, selectionInfo])

  const iconRef = useRef()
  useClickOutside({
    ref: iconRef,
    handler: (e) => {
      if (anchorPos !== null) handleClose()
      if (e.ctrlKey || e.metaKey || !selected) return
      deselect(selectionInfo)
    },
    exclude: [
      document.getElementById("file-toolbar"),
      document.getElementById("file-inspector"),
      ...document.getElementsByClassName("popover-menu"),
      ...document.getElementsByClassName("rightclick-menu"),
    ],
  })

  const renameFile = useFileStore((state) => state.rename)
  const iconState = getIconState(selected || editingName, hovered)
  return (
    <>
      <div
        className="flex flex-col items-center justify-center select-none w-36 h-36"
        onClick={(e) => select(file, !e.ctrlKey && !e.metaKey)}
        onDblClick={() => {
          if (file.type === "file" && !editingName)
            window.open(`https://crate.network/ipfs/${file.cid}`, "_blank")
          else if (file.type === "directory") {
            setPath(joinPath(path, file.name))
          }
        }}
        onContextMenu={onContextMenu}
        onMouseOver={() => setHovered(true)}
        onMouseOut={() => setHovered(false)}
        ref={iconRef}
      >
        <div
          className={"flex justify-center items-center rounded-md m-1 w-24 h-24 ".concat(
            iconState === "hovered" ? "bg-opacity-10 bg-neutral-500 " : "",
            iconState === "selected" ? "bg-opacity-40 bg-neutral-500 " : "",
          )}
        >
          <FontAwesomeIcon
            icon={file.type === "file" ? faFile : faFolder}
            className="w-16 h-16 m-2"
            color="rgb(249,115,22)"
          />
        </div>
        {editingName ? (
          <NameInput
            oldName={file.name}
            onCancel={() => {
              setEditingName(false)
            }}
            onComplete={(newName) => {
              setEditingName(false)
              if (newName === "") return
              renameFile(file.cid, newName)
            }}
          />
        ) : (
          <span
            className={"px-1 font-medium text-sm rounded-md select-text ".concat(
              iconState === "hovered" ? "bg-opacity-10 bg-neutral-500 " : "",
              iconState === "selected" ? "bg-orange-500 text-white " : "",
            )}
          >
            {file.name.split(".")[0]}
          </span>
        )}
      </div>
      {contextShown && (
        <RightClickMenu
          close={handleClose}
          anchor={anchorPos}
          onRenameRequest={() => setEditingName(true)}
        />
      )}
    </>
  )
}

export function GridView({ files }: { files: NamedFileModel[] }) {
  const loading = useFVStore((state) => state.loading)
  return (
    <div className="p-2 mt-8 bg-white border sm:p-4 md:p-8 shadow-sm dark:bg-neutral-800 rounded-md border-neutral-200 dark:border-neutral-700">
      {loading && <DirectoryLoading />}
      {files.length === 0 && !loading && <DirectoryEmpty />}
      {files.length !== 0 && !loading && (
        <div
          className="w-full grid"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(9rem, 1fr))",
          }}
        >
          {files.map((el) => (
            <FileIcon file={el} key={el.name} />
          ))}
        </div>
      )}
    </div>
  )
}
