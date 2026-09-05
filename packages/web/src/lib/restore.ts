import type { FileEntry } from "./api"

export async function restoreOrder(
  selection: FileEntry[],
  loadParent: (id: string) => Promise<FileEntry | undefined>,
): Promise<FileEntry[]> {
  const selected = new Set(selection.map((file) => file.id))
  const known = new Map(selection.map((file) => [file.id, file]))
  const visiting = new Set<string>()
  const checked = new Set<string>()
  const ordered: FileEntry[] = []

  const visit = async (file: FileEntry): Promise<void> => {
    if (visiting.has(file.id))
      throw new Error(`Cannot restore "${file.name}": its folders form a cycle.`)
    if (checked.has(file.id)) return
    visiting.add(file.id)
    if (file.parentId) {
      const parent = known.get(file.parentId) ?? (await loadParent(file.parentId))
      if (!parent || parent.kind !== "directory")
        throw new Error(`Cannot restore "${file.name}": an ancestor folder is missing or invalid.`)
      known.set(parent.id, parent)
      if (parent.trashedAt && !selected.has(parent.id))
        throw new Error(
          `Select and restore the trashed folder "${parent.name}" before "${file.name}".`,
        )
      await visit(parent)
    }
    visiting.delete(file.id)
    checked.add(file.id)
    if (selected.has(file.id)) ordered.push(file)
  }

  for (const file of selection) await visit(file)
  return ordered
}
