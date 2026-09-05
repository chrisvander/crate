import type { FileEntry, Session } from "../lib/api"

export const session: Session = {
  user: { did: "did:plc:alice", handle: "alice.test" },
  space: {
    uri: "at://did:plc:alice/network.crate.drive/self",
    authorityDid: "did:plc:alice",
    type: "network.crate.drive",
    key: "self",
  },
}

export function file(overrides: Partial<FileEntry> = {}): FileEntry {
  return {
    id: "file-one",
    uri: "at://did:plc:alice/network.crate.file/file-one",
    revision: "revision-one",
    name: "Notes.txt",
    kind: "file",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-02T00:00:00.000Z",
    size: 10,
    ...overrides,
  }
}
