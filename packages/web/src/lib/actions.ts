import { api, unwrap, type FileEntry, type FileVersion } from "./api"

export const actions = {
  create:
    (name: string, kind: FileEntry["kind"], parentId?: string) => async (signal: AbortSignal) =>
      unwrap(await api.POST("/api/v1/files", { body: { name, kind, parentId }, signal })),
  rename: (file: FileEntry, name: string) => async (signal: AbortSignal) =>
    unwrap(
      await api.PUT("/api/v1/files/{id}", {
        params: { path: { id: file.id } },
        body: { revision: file.revision, name },
        signal,
      }),
    ),
  duplicate: (file: FileEntry, name: string) => async (signal: AbortSignal) =>
    unwrap(
      await api.POST("/api/v1/files/{id}/duplicate", {
        params: { path: { id: file.id } },
        body: { revision: file.revision, name, parentId: file.parentId },
        signal,
      }),
    ),
  trash: (file: FileEntry) => async (signal: AbortSignal) =>
    unwrap(
      await api.POST("/api/v1/files/{id}/trash", {
        params: { path: { id: file.id } },
        body: { revision: file.revision },
        signal,
      }),
    ),
  restore: (file: FileEntry) => async (signal: AbortSignal) =>
    unwrap(
      await api.POST("/api/v1/files/{id}/restore", {
        params: { path: { id: file.id } },
        body: { revision: file.revision },
        signal,
      }),
    ),
  upload: (files: File[], parentId?: string) => async (signal: AbortSignal) => {
    for (const file of files)
      unwrap(
        await api.POST("/api/v1/files/upload", {
          params: {
            query: { name: file.name, parentId, mimeType: file.type || "application/octet-stream" },
          },
          body: file,
          bodySerializer: (body) => body,
          headers: { "Content-Type": "application/octet-stream" },
          signal,
        }),
      )
  },
  replace: (entry: FileEntry, file: File) => async (signal: AbortSignal) =>
    unwrap(
      await api.PUT("/api/v1/files/{id}/content", {
        params: {
          path: { id: entry.id },
          query: { revision: entry.revision, mimeType: file.type || "application/octet-stream" },
        },
        body: file,
        bodySerializer: (body) => body,
        headers: { "Content-Type": "application/octet-stream" },
        signal,
      }),
    ),
  restoreVersion: (file: FileEntry, version: FileVersion) => async (signal: AbortSignal) =>
    unwrap(
      await api.POST("/api/v1/files/{id}/versions/{versionId}/restore", {
        params: { path: { id: file.id, versionId: version.id } },
        body: { revision: file.revision },
        signal,
      }),
    ),
}
export type Command = (signal: AbortSignal) => Promise<unknown>
