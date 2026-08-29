import { FileModel } from "@crate/types"

export function renameFile(file: FileModel, newName: string): FileModel {
  return {
    ...file,
    name: newName,
  }
}

export function duplicateFile(file: FileModel): FileModel {
  const [name, ...rest] = file.name ? file.name.split(".") : [file.cid]
  return {
    ...file,
    name: name + " copy." + rest.join("."),
    date: new Date().toISOString(),
  }
}

export function stripSlashes(part: string): string {
  if (part.startsWith("/") && part[part.length - 1] === "/") return part.slice(1, part.length - 1)
  else if (part[part.length - 1] === "/") return part.slice(0, part.length - 1)
  else if (part.startsWith("/")) return part.slice(1)
  else return part
}

export function joinPath(...elements: string[]): string {
  return elements.reduce((prev, curr) => {
    const pStripped = stripSlashes(prev)
    const cStripped = stripSlashes(curr)
    if (pStripped.length === 0) return `/${cStripped}`
    else if (cStripped.length === 0) return `/${pStripped}`
    return `/${pStripped}/${cStripped}`
  }, "")
}

// splits a path into segments
export function splitPath(path: string) {
  return path.split("/").filter(Boolean)
}

// verify path format
export function validPath(path: string) {
  return path.startsWith("/") && !splitPath(path).includes("..")
}
