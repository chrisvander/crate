import { FileModel } from "@crate/types"
import { FileError, FileErrorType } from "@crate/utils"
import { useErrorStore } from "../store/ErrorStore"

const apiPath = "/api/v1"

async function crFetch(url, params = {}): Promise<Response | null> {
  const res = await fetch(url, {
    method: "GET",
    ...params,
  })
  if (res.status !== 200) {
    const fErr = new FileError(FileErrorType.CONNECTION_FAILURE)
    fErr.message = await res.text()
    useErrorStore.getState().showError(fErr)
    return null
  }
  return res
}

async function upload(files: FileList, path: string) {
  if (!files || files.length === 0) {
    return
  }

  const formData = new FormData()
  for (let i = 0; i < files.length; i++) {
    const file = files.item(i)
    formData.append("files", file, file.name)
  }

  return await crFetch(`${apiPath}/file?path=${encodeURIComponent(path)}`, {
    method: "POST",
    body: formData,
  })
}

async function makeDir(path: string, name: string) {
  const url =
    `${apiPath}/dir?path=${encodeURIComponent(path)}` +
    `&name=${encodeURIComponent(name)}&type=directory`
  const res = await crFetch(url, { method: "POST" })
  return res?.text()
}

async function makeFile(path: string, name: string) {
  const url =
    `${apiPath}/dir?path=${encodeURIComponent(path)}` +
    `&name=${encodeURIComponent(name)}&type=file`
  const res = await crFetch(url, { method: "POST" })
  return res?.text()
}

async function deleteFile(path: string) {
  const url = `${apiPath}/file?path=${encodeURIComponent(path)}`
  const res = await crFetch(url, { method: "DELETE" })
  return res?.text()
}

async function fetchFileByPath(path: string): Promise<FileModel | null> {
  const url = `${apiPath}/file?path=${encodeURIComponent(path)}`
  const res = await crFetch(url)
  return res?.json()
}

async function fetchFileByCID(cid: string): Promise<FileModel | null> {
  const url = `${apiPath}/file?cid=${encodeURIComponent(cid)}`
  const res = await crFetch(url)
  return res?.json()
}

const contentUrl = (cid: string) => `${apiPath}/file?content=${encodeURIComponent(cid)}`

export default {
  apiPath,
  upload,
  deleteFile,
  fetchFileByPath,
  fetchFileByCID,
  contentUrl,
  makeDir,
  makeFile,
}
