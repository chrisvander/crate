/**
 * A local file store which exports a Context provider, which can be
 * consumed by any file view.
 */

import { createContext, createElement, type ComponentChildren } from "preact"
import { useContext } from "preact/hooks"
import { useStore as useZustandStore } from "zustand"
import { createStore as createZustandStore, type StoreApi } from "zustand/vanilla"
import type { StateCreator } from "zustand"
import { immer } from "zustand/middleware/immer"

export type SelectionInfo = { name: string; cid: string }
type FileViewState = {
  // indication of loading
  loading: boolean
  setLoading: (v: boolean) => void
  // list of files names in visible directory
  selectedFiles: SelectionInfo[]
  // functions to modify selection
  select: (name: SelectionInfo | SelectionInfo[], replace: boolean) => void
  deselect: (name: SelectionInfo | SelectionInfo[]) => void
  // local inspector state
  inspectorVisible: boolean
  showInspector: () => void
  hideInspector: () => void
  // currently visible path
  path: string
  setPath: (newPath: string) => void
}

const FileViewContext = createContext<StoreApi<FileViewState> | null>(null)

const fileViewStore =
  (): StateCreator<FileViewState, [["zustand/immer", never]]> => (set, get) => ({
    selectedFiles: [],
    loading: true,
    setLoading: (v: boolean) => set({ loading: v }),
    path: "/",
    select: (info: SelectionInfo | SelectionInfo[], replace = false) =>
      set((state) => {
        const infoArr = Array.isArray(info) ? info : [info]
        if (replace) state.selectedFiles = infoArr
        const newNames = infoArr.map((e) => e.name)
        const newSelectedFiles = state.selectedFiles.filter((e) => !newNames.includes(e.name))
        state.selectedFiles = newSelectedFiles.concat(infoArr)
      }),
    deselect: (info: SelectionInfo | SelectionInfo[]) => {
      const infoArr = Array.isArray(info) ? info : [info]
      const newSelectedFiles = get().selectedFiles.filter((el) => {
        return infoArr.every((e) => e.name !== el.name)
      })
      set((state) => {
        state.selectedFiles = newSelectedFiles
      })
    },
    inspectorVisible: false,
    showInspector: () => set((state) => ({ ...state, inspectorVisible: true })),
    hideInspector: () => set((state) => ({ ...state, inspectorVisible: false })),
    setPath: (path: string) =>
      set((state) => {
        state.selectedFiles = []
        state.path = path
      }),
  })

const createStore = () => createZustandStore<FileViewState>()(immer(fileViewStore()))

function useStore(): FileViewState
function useStore<T>(selector: (state: FileViewState) => T): T
function useStore<T>(selector: (state: FileViewState) => T = (state) => state as T) {
  const store = useContext(FileViewContext)
  if (!store) throw new Error("File view store is missing its provider.")
  return useZustandStore(store, selector)
}

function Provider({
  children,
  createStore,
}: {
  children: ComponentChildren
  createStore: StoreApi<FileViewState>
}) {
  return createElement(FileViewContext.Provider, { value: createStore }, children)
}

export { createStore, useStore, Provider }
