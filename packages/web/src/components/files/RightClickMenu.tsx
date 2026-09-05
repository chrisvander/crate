import { makeOpt, PopoverMenu, type PopoverMenuProps } from "./PopoverMenu"
import type { FileEntry } from "../../lib/api"

export type FileMenuActions = {
  onOpen: () => void
  onDownload: () => void
  onDelete: () => void
  onRenameRequest?: () => void
  onDuplicate: () => void
  onInspect: () => void
  onCopyCID: () => void
}
export default function RightClickMenu({
  close,
  anchor,
  selection,
  pending,
  ...actions
}: PopoverMenuProps &
  FileMenuActions & {
    selection: FileEntry[]
    pending: boolean
  }) {
  const noFiles = !selection.length
  const downloadable = selection.some((file) => file.kind === "file")
  return (
    <PopoverMenu
      close={close}
      anchor={anchor}
      opts={[
        makeOpt("Open", close, actions.onOpen, false, noFiles),
        makeOpt("Download", close, actions.onDownload, false, !downloadable),
        "divider",
        makeOpt("Delete", close, actions.onDelete, false, pending || noFiles),
        "divider",
        makeOpt(
          "Rename",
          close,
          () => actions.onRenameRequest?.(),
          !actions.onRenameRequest,
          pending,
        ),
        makeOpt("Duplicate", close, actions.onDuplicate, false, pending || !downloadable),
        "divider",
        makeOpt("Inspect", close, actions.onInspect, false, noFiles),
        makeOpt("Copy CID", close, actions.onCopyCID, false, noFiles),
      ]}
    />
  )
}
