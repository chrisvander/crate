/**
 * A global file store to maintain the state of loaded files and operations
 * upon them throughout the app. This store operates separately of any
 * particular file views, such as dealing with file selection or directory
 * visibility.
 */

import { FileError, FileErrorType } from "@crate/utils"
import create, { StateCreator } from "zustand"
import { FileModel, NamedFileModel } from "@crate/types"
import { subscribeWithSelector } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import FileAPI from "../api/FileAPI"

type CIDRefFileModel = Exclude<FileModel, { name: string }>

interface FileState {
  // the file list mapping CID or path to FileModel
  files: Record<string, CIDRefFileModel>
  // retrieval
  get: (path: string) => Promise<FileModel>
  getCID: (cid: string) => Promise<FileModel>
  getChildren: (path: string) => Promise<Record<string, NamedFileModel>>
  // common operations on files
  // pass in a path and get back a path to updated file
  add: (path: string, file: FileModel) => Promise<string>
  update: (path: string, updated: Partial<FileModel>) => Promise<string>
  delete: (path: string) => Promise<string>
  rename: (path: string, newName: string) => Promise<string>
  makeDir: (path: string, name: string) => Promise<string>
  makeFile: (path: string, name: string) => Promise<string>
}

const fileStore: StateCreator<
  FileState,
  [["zustand/immer", never], ["zustand/subscribeWithSelector", never]]
> = (set, get): FileState => {
  const persistToStore = (model: FileModel, path?: string) => {
    const { files: currentFiles } = get()
    if (model.cid in currentFiles) return currentFiles[model.cid]
    if (path && path in currentFiles) return currentFiles[path]
    set(({ files }) => {
      files[model.cid] = model
      if (path) files[path] = model
    })
    return { ...model }
  }

  const getPath = async (path: string): Promise<FileModel | null> => {
    if (typeof path !== "string") return null
    const { files } = get()
    if (path in files) return files[path]
    const model = await FileAPI.fetchFileByPath(path)
    if (model) return persistToStore(model, path)
    return null
  }

  const getCID = async (cid: string): Promise<FileModel | null> => {
    if (typeof cid !== "string") return null
    const { files } = get()
    if (cid in files) return files[cid]
    const model = await FileAPI.fetchFileByCID(cid)
    if (model) return persistToStore(model)
    return null
  }

  const getChildren = async (path: string) => {
    const model = await getPath(path)
    if (model.type !== "directory") throw new FileError(FileErrorType.FILE_INVALID)

    const children: Record<string, NamedFileModel> = {}

    await Promise.all(
      model.links.map(async (l) => {
        children[l.name] = { ...(await getCID(l.cid)), name: l.name }
      }),
    )

    return children
  }

  const add = async () => {
    return ""
  }

  const update = async () => {
    return ""
  }

  const rename = async () => {
    return ""
  }

  return {
    files: {},
    get: getPath,
    getCID,
    getChildren,
    add,
    update,
    delete: (path: string) => FileAPI.deleteFile(path),
    rename,
    makeDir: (path: string, name: string) => FileAPI.makeDir(path, name),
    makeFile: (path: string, name: string) => FileAPI.makeFile(path, name),
  }
}

export const useFileStore = create(immer(subscribeWithSelector(fileStore)))

useFileStore.subscribe(({ files }) => {
  console.log(files)
})
