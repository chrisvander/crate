import { faGrip, faBars, faAdd } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import FormInput from "../FormInput"
import { Popover, PopoverButtonRow } from "../Popover"
import { StateUpdater, useEffect, useState } from "preact/hooks"
import { JSXInternal } from "preact/src/jsx"
import Dropdown, { FuncInput } from "./Dropdown"
import sanitizeFilename from "sanitize-filename"
import { useFileStore } from "../../store/FileStore"
import FileAPI from "../../api/FileAPI"
import { useStore as useFVStore } from "../../store/FileViewStore"
import shallow from "zustand/shallow"

function NewFileBody({ dismiss, type }: { dismiss: () => void; type: "directory" | "file" }) {
  const [makeDir, makeFile] = useFileStore((state) => [state.makeDir, state.makeFile], shallow)
  const path = useFVStore((state) => state.path)
  const [name, setName] = useState("")
  const invalid = sanitizeFilename(name) !== name

  const confirm = async () => {
    if (type === "directory") await makeDir(path, name)
    else await makeFile(path, name)
    dismiss()
  }

  return (
    <>
      <div className="p-2 w-96">
        <h1 className="mb-2 text-xl font-bold">New {type === "file" ? "File" : "Folder"}</h1>
        <FormInput
          placeholder={type === "file" ? "file name" : "folder name"}
          value={name}
          onInput={(e) => {
            setName(e.target.value)
          }}
        />
      </div>
      <PopoverButtonRow
        actions={[
          ["Done", confirm, invalid],
          ["Cancel", dismiss],
        ]}
      />
    </>
  )
}

export function AddBox() {
  const [inputEl, setInputEl] = useState<HTMLInputElement>(null)
  const [isSelectingFile, setIsSelectingFile] = useState(false)
  const [path, setPath] = useFVStore((state) => [state.path, state.setPath], shallow)
  const addFile = useFileStore((state) => state.add)

  useEffect(() => {
    const onUpload = async (e) => {
      const fileInput: HTMLInputElement = e.target
      const { files } = fileInput
      await FileAPI.upload(files, path)
      setIsSelectingFile(false)
    }

    const inpt = document.createElement("input")
    inpt.className = "hidden"
    inpt.onchange = onUpload
    inpt.type = "file"
    inpt.multiple = true
    setInputEl(inpt)
    return () => {
      setInputEl(null)
      inpt.remove()
    }
  }, [isSelectingFile, path, setPath, addFile])

  enum PopoverWindow {
    NEW_FILE,
    NEW_FOLDER,
    ADD_IPFS,
  }
  const [popover, setPopover] = useState<PopoverWindow | null>(null)

  useEffect(() => {
    const listener = (ev) => {
      if (ev.key === "Escape") setPopover(null)
    }
    window.addEventListener("keydown", listener)
    return () => {
      window.removeEventListener("keydown", listener)
    }
  }, [])

  const mOpt = (n, f) => ({ name: n, onClick: f })
  const dropdownOptions: FuncInput[] = [
    mOpt("New File", () => setPopover(PopoverWindow.NEW_FILE)),
    mOpt("New Folder", () => setPopover(PopoverWindow.NEW_FOLDER)),
    "divider",
    mOpt("Upload", () => {
      if (inputEl) {
        inputEl.click()
        setIsSelectingFile(true)
      }
    }),
    mOpt("Add from IPFS", () => setPopover(PopoverWindow.ADD_IPFS)),
  ]

  return (
    <div className="flex flex-col justify-between">
      <label htmlFor="search" className="text-sm font-medium text-stone-700 dark:text-stone-400">
        Add Files
      </label>
      <Dropdown options={dropdownOptions} display={<FontAwesomeIcon icon={faAdd} />} />
      {popover !== null && (
        <Popover key={popover}>
          {(popover === PopoverWindow.NEW_FILE || popover === PopoverWindow.NEW_FOLDER) && (
            <NewFileBody
              dismiss={() => setPopover(null)}
              type={popover === PopoverWindow.NEW_FILE ? "file" : "directory"}
            />
          )}
        </Popover>
      )}
    </div>
  )
}

export function SearchBar() {
  return (
    <div className="flex-col justify-between flex-1">
      <label
        htmlFor="search"
        className="hidden text-sm font-medium text-stone-700 dark:text-stone-400 md:block"
      >
        Search
      </label>
      <div className="relative mt-1 rounded-md shadow-sm">
        <FormInput type="text" name="search" id="search" placeholder="textfile.txt" />
        <div className="absolute inset-y-0 right-0 flex items-center">
          <button
            className="flex items-center h-full px-6 text-xs font-medium leading-tight text-white uppercase bg-orange-500 rounded shadow-md btn hover:bg-orange-600 hover:shadow-lg focus:bg-orange-600 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-orange-700 active:shadow-lg transition duration-150 ease-in-out"
            type="button"
            id="search-button"
          >
            <svg
              aria-hidden="true"
              focusable="false"
              data-prefix="fas"
              data-icon="search"
              className="w-4"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
            >
              <path
                fill="currentColor"
                d="M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

function MultiSelectBar<T>({
  selected,
  setSelected,
  elements,
}: {
  selected: T
  setSelected: StateUpdater<T>
  elements: { item: T; element: JSXInternal.Element }[]
}) {
  return (
    <>
      {elements.map(({ item, element }) => (
        <button
          key={element.key}
          className={`${
            item === selected
              ? "bg-neutral-300 dark:bg-neutral-600"
              : "bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
          }  text-neutral-800 dark:text-neutral-200 py-2 px-4`}
          onClick={() => setSelected(item)}
        >
          {element}
        </button>
      ))}
    </>
  )
}

export enum ViewMode {
  LIST = "list",
  GRID = "grid",
}

export function ViewBar({ viewMode, setViewMode }) {
  return (
    <div className="flex flex-col justify-between">
      <label htmlFor="view-mode" className="text-sm font-medium text-stone-700 dark:text-stone-400">
        View Mode
      </label>
      <div className="inline-flex overflow-hidden rounded shadow-sm" id="view-mode">
        <MultiSelectBar
          selected={viewMode}
          setSelected={setViewMode}
          elements={[
            { item: ViewMode.GRID, element: <FontAwesomeIcon icon={faGrip} /> },
            { item: ViewMode.LIST, element: <FontAwesomeIcon icon={faBars} /> },
          ]}
        />
      </div>
    </div>
  )
}

export enum SortBy {
  NAME = "Name",
  KIND = "Kind",
  DATE_CREATED = "Date Created",
  DATE_MODIFIED = "Date Modified",
  SIZE = "Size",
}

export enum SortDirection {
  UP = "Up",
  DOWN = "Down",
}

type SortBarProps = {
  sortBy: SortBy
  setSortBy: StateUpdater<SortBy>
}

export function SortBar({ sortBy, setSortBy }: SortBarProps) {
  return (
    <>
      <div className="flex flex-col justify-between">
        <label
          htmlFor="view-mode"
          className="text-sm font-medium text-stone-700 dark:text-stone-400"
        >
          Sorting
        </label>
        <div className="inline-flex overflow-hidden rounded shadow-sm" id="view-mode">
          <Dropdown options={Object.values(SortBy)} current={sortBy} setValue={setSortBy} />
        </div>
      </div>
      {/* <div className="flex flex-col justify-between">
        <span />
        <div
          className="inline-flex overflow-hidden rounded shadow-sm"
          id="view-mode"
        >
          Test2
        </div>
      </div> */}
    </>
  )
}
