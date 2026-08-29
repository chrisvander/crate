import { FileModel } from "@crate/types"
import { FileError, FileErrorType, Node } from "@crate/utils"
import { useErrorStore } from "../store/ErrorStore"
import { useUserStore } from "../store/UserStore"

const apiPath = "/api/v1"

async function authHeader() {
  const idToken = !useUserStore.getState().user.getIdToken
    ? await new Promise((resolve) => {
        useUserStore.subscribe(
          (state) => state.user,
          (user) => {
            if (user.getIdToken) resolve(user.getIdToken())
          },
        )
      })
    : await useUserStore.getState().user.getIdToken()

  return {
    Authorization: `Bearer ${idToken}`,
  }
}

async function crFetch(url, params = {}): Promise<Response | null> {
  const res = await fetch(url, {
    method: "GET",
    headers: await authHeader(),
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

async function update(fileModel: FileModel) {
  return await crFetch(`${apiPath}/block`, {
    method: "POST",
    body: Node.toRawBlock(Node.fromFile(fileModel)),
  })
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
  const url = `${apiPath}/file?path=${encodeURIComponent(`/ipfs/${cid}`)}`
  const res = await crFetch(url)
  return res?.json()
}

export default {
  apiPath,
  update,
  upload,
  deleteFile,
  fetchFileByPath,
  fetchFileByCID,
  makeDir,
  makeFile,
}
