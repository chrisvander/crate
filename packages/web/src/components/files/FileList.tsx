import type { View } from "../../lib/files"
import { GridView } from "./GridView"
import { ListView, type FileViewProps } from "./ListView"

export function FileList({ view, ...props }: FileViewProps & { view: View }) {
  return view === "grid" ? <GridView {...props} /> : <ListView {...props} />
}
