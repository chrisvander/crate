import { Agent } from "@atproto/api"
import type { OAuthSession } from "@atproto/oauth-client-node"
import type { FileModel } from "@crate/types"
import { fileCollection, fullPath, isFileRecord, toFileModel, type StoredFile } from "./record"

export async function listFiles(session: OAuthSession): Promise<StoredFile[]> {
  const agent = new Agent(session)
  const files: StoredFile[] = []
  let cursor: string | undefined

  do {
    const response = await agent.com.atproto.repo.listRecords({
      collection: fileCollection,
      cursor,
      limit: 100,
      repo: session.did,
    })
    cursor = response.data.cursor
    for (const { cid, uri, value } of response.data.records) {
      if (isFileRecord(value)) files.push({ cid, record: value, uri })
    }
  } while (cursor)

  return files
}

export async function getFile(session: OAuthSession, target: string): Promise<FileModel> {
  const files = await listFiles(session)
  if (target === "/") return rootDirectory(session.did, files)

  const file = files.find((entry) => entry.cid === target || fullPath(entry) === target)
  if (!file) throw new Error(`File not found: ${target}`)
  return toFileModel(file, files)
}

function rootDirectory(did: string, files: StoredFile[]): FileModel {
  const children = files.filter(({ record }) => record.path === "/")
  return {
    cid: did,
    name: "",
    type: "directory",
    size: 0,
    cumulativeSize: children.reduce((size, child) => size + child.record.size, 0),
    date: new Date(0).toISOString(),
    links: children.map((child) => ({
      cid: child.cid,
      name: child.record.name,
      size: child.record.size,
    })),
  }
}
