import type { FileModel, FileType } from "@crate/types"
import { joinPath } from "@crate/utils"

export const fileCollection = "network.crate.file"

export type FileRecord = {
  $type: typeof fileCollection
  blob?: { ref: { $link: string }; mimeType: string; size: number }
  createdAt: string
  name: string
  path: string
  size: number
  type: FileType
}

export type StoredFile = {
  cid: string
  record: FileRecord
  uri: string
}

export function isFileRecord(value: Record<string, unknown>): value is FileRecord {
  return (
    value["$type"] === fileCollection &&
    typeof value["name"] === "string" &&
    typeof value["path"] === "string" &&
    typeof value["size"] === "number" &&
    (value["type"] === "file" || value["type"] === "directory") &&
    typeof value["createdAt"] === "string"
  )
}

export const fullPath = ({ record }: StoredFile) => joinPath(record.path, record.name)

export function toFileModel(file: StoredFile, files: StoredFile[]): FileModel {
  const children = files.filter(({ record }) => record.path === fullPath(file))
  return {
    cid: file.cid,
    name: file.record.name,
    type: file.record.type,
    size: file.record.size,
    date: file.record.createdAt,
    ...(file.record.type === "directory"
      ? {
          cumulativeSize: children.reduce((size, child) => size + child.record.size, 0),
          links: children.map((child) => ({
            cid: child.cid,
            name: child.record.name,
            size: child.record.size,
          })),
        }
      : {}),
  }
}
