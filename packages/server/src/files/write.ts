import { readFile } from "node:fs/promises"
import { Agent } from "@atproto/api"
import type { OAuthSession } from "@atproto/oauth-client-node"
import type { FileType } from "@crate/types"
import type { UploadedFile } from "express-fileupload"
import { joinPath } from "@crate/utils"
import { fileCollection, fullPath } from "./record"
import { listFiles } from "./read"

export async function createFile(
  session: OAuthSession,
  path: string,
  name: string,
  type: FileType,
): Promise<WriteResult> {
  return putRecord(session, { createdAt: new Date().toISOString(), name, path, size: 0, type })
}

export async function uploadFile(
  session: OAuthSession,
  path: string,
  file: UploadedFile,
): Promise<WriteResult> {
  const agent = new Agent(session)
  const bytes = file.tempFilePath ? await readFile(file.tempFilePath) : file.data
  const { data } = await agent.uploadBlob(bytes, { encoding: file.mimetype })
  return putRecord(session, {
    blob: data.blob.toJSON(),
    createdAt: new Date().toISOString(),
    name: file.name,
    path,
    size: file.size,
    type: "file",
  })
}

export async function deleteFile(session: OAuthSession, path: string) {
  const agent = new Agent(session)
  const files = await listFiles(session)
  const targets = files.filter(
    (file) => fullPath(file) === path || fullPath(file).startsWith(`${path}/`),
  )

  await Promise.all(
    targets.map(({ uri }) =>
      agent.com.atproto.repo.deleteRecord({
        collection: fileCollection,
        repo: session.did,
        rkey: uri.split("/").at(-1) ?? "",
      }),
    ),
  )
  return parentPath(path)
}

async function putRecord(
  session: OAuthSession,
  record: Record<string, unknown>,
): Promise<WriteResult> {
  const agent = new Agent(session)
  const response = await agent.com.atproto.repo.createRecord({
    collection: fileCollection,
    record: { $type: fileCollection, ...record },
    repo: session.did,
    validate: false,
  })
  return response.data
}

type WriteResult = { cid: string; uri: string }

const parentPath = (path: string) => {
  const parts = path.split("/").filter(Boolean)
  parts.pop()
  return joinPath(...parts)
}
