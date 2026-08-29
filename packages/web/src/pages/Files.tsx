import { GridView } from "../components/files/GridView"
import { ListView } from "../components/files/ListView"
import { SearchBar, SortBar, SortBy, AddBox, ViewBar, ViewMode } from "../components/files/Toolbar"
import useStoredState from "../hooks/useStoredState"
import { FileInspector } from "../components/files/FileInspector"
import {
  createStore as createFVStore,
  useStore as useFVStore,
  Provider as FVProvider,
} from "../store/FileViewStore"
import { useEffect, useState } from "preact/hooks"
import { joinPath, splitPath } from "@crate/utils"
import { useFileStore } from "../store/FileStore"
import { NamedFileModel } from "@crate/types"

function Breadcrumbs() {
  const { path, setPath } = useFVStore()
  return (
    <>
      <button
        className="cursor-pointer hover:underline"
        onClick={() => {
          setPath("/")
        }}
      >
        Files
      </button>
      <span className="text-sm font-bold lg:text-lg text-neutral-700 dark:text-neutral-200">
        {splitPath(path).map((el, idx) => (
          <span key={el}>
            <span className="inline-block mx-3 font-light text-neutral-500">&gt;</span>
            <button
              className="cursor-pointer hover:text-neutral-400 hover:underline"
              onClick={() => {
                setPath(joinPath(...splitPath(path).slice(0, idx + 1)))
              }}
            >
              {el}
            </button>
          </span>
        ))}
      </span>
    </>
  )
}

function FilesChild() {
  const { inspectorVisible, hideInspector, path, setLoading } = useFVStore()
  const { getChildren, revision } = useFileStore()
  const [files, setFiles] = useState<Record<string, NamedFileModel>>({})

  useEffect(() => {
    setLoading(true)
    getChildren(path)
      .then((files) => {
        setLoading(false)
        setFiles(files)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [getChildren, path, revision, setLoading])

  const [viewMode, setViewMode] = useStoredState<ViewMode>(ViewMode.LIST, "view-mode")
  const [sortBy, setSortBy] = useStoredState<SortBy>(SortBy.NAME, "sort-order")

  const orderedFiles = Object.values(files).sort((a, b) => {
    switch (sortBy) {
      case SortBy.NAME:
        return a.name > b.name ? 1 : -1
      case SortBy.SIZE:
        return a.size < b.size ? 1 : -1
      default:
        return a.name > b.name ? 1 : -1
    }
  })

  return (
    <main className="flex flex-row">
      <div className="grow">
        <h1 className="flex items-center lg:items-end">
          <Breadcrumbs />
        </h1>
        <div
          id="file-toolbar"
          className="flex flex-col justify-between space-x-0 md:space-x-8 lg:space-x-24 2xl:space-x-48 md:flex-row"
        >
          <SearchBar />

          <div className="flex justify-end mt-4 space-x-8 md:mt-0">
            <AddBox />
            <SortBar sortBy={sortBy} setSortBy={setSortBy} />
            <ViewBar viewMode={viewMode} setViewMode={setViewMode} />
          </div>
        </div>
        {viewMode === ViewMode.LIST && <ListView files={orderedFiles} />}
        {viewMode === ViewMode.GRID && <GridView files={orderedFiles} />}
      </div>
      <div
        id="file-inspector"
        className={`bg-white overflow-x-hidden top-8 dark:bg-neutral-800 rounded-md shadow-md sm:mt-12 md:mt-16 lg:mt-20 ml-8 hidden lg:block lg:sticky transition-all duration-300 h-fit ${
          inspectorVisible ? "opacity-100 w-80" : "opacity-0 w-0"
        }`}
      >
        <div className="w-80">
          <FileInspector close={hideInspector} />
        </div>
      </div>
    </main>
  )
}

export default function Files() {
  return (
    <FVProvider createStore={createFVStore()}>
      <FilesChild />
    </FVProvider>
  )
}
