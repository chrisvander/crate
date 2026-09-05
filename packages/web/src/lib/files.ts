import type { FileEntry } from "./api"

export const sortOptions = ["Name", "Kind", "Created", "Modified", "Size"] as const
export type Sort = (typeof sortOptions)[number]
export type View = "list" | "grid"

export function visibleFiles(files: FileEntry[], search: string, sort: Sort, descending: boolean) {
  const term = search.trim().toLocaleLowerCase()
  return files
    .filter((file) => file.name.toLocaleLowerCase().includes(term))
    .sort((a, b) => {
      const byName = a.name.localeCompare(b.name, undefined, { numeric: true })
      const compared =
        sort === "Size"
          ? a.size - b.size
          : sort === "Created"
            ? a.createdAt.localeCompare(b.createdAt)
            : sort === "Modified"
              ? a.updatedAt.localeCompare(b.updatedAt)
              : sort === "Kind"
                ? a.kind.localeCompare(b.kind)
                : byName
      return (compared || byName || a.id.localeCompare(b.id)) * (descending ? -1 : 1)
    })
}

export function validName(name: string) {
  return (
    name.trim().length > 0 &&
    name !== "." &&
    name !== ".." &&
    !Array.from(name).some(
      (character) => character.charCodeAt(0) < 32 || character === "/" || character === "\\",
    )
  )
}

export function selectedEntries(files: FileEntry[], selected: string[]) {
  return files.filter((file) => selected.includes(file.id))
}
