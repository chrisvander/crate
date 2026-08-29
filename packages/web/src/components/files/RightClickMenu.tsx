import { JSXInternal } from "preact/src/jsx"
import { makeOpt, PopoverMenu, PopoverMenuProps, SelectionOptions } from "./PopoverMenu"
import { useFileStore } from "../../store/FileStore"
import Anchor from "../../models/Anchor"
import shallow from "zustand/shallow"
import { useStore as useFVStore } from "../../store/FileViewStore"
import { duplicateFile, joinPath, splitPath } from "@crate/utils"

type RightClickMenuProps = {
  close?: (e: MouseEvent) => void
  anchor?: Anchor
  onRenameRequest?: () => void
} & PopoverMenuProps

export default function RightClickMenu({
  close,
  anchor,
  onRenameRequest,
  ...props
}: RightClickMenuProps & JSXInternal.HTMLAttributes<HTMLDivElement>) {
  const [addFile, deleteFile, getCID] = useFileStore(
    (state) => [state.add, state.delete, state.getCID],
    shallow,
  )

  const [selection, path] = useFVStore((state) => [state.selectedFiles, state.path], shallow)

  const deleteFiles = async () => {
    let nextPath = path
    for (const { name } of selection) {
      nextPath = await deleteFile(joinPath("ipfs", ...splitPath(nextPath), name))
      console.log(nextPath)
    }
  }

  const openFile = () =>
    selection.forEach(({ cid, name }) =>
      window.open(`https://crate.network/ipfs/${cid}?filename=${name}`, "_blank"),
    )

  const downloadFile = () =>
    selection.forEach(({ cid, name }) =>
      window.open(`https://crate.network/ipfs/${cid}?filename=${name}&download=true`, "_blank"),
    )

  const copyCID = () => navigator.clipboard.writeText(selection.map(({ cid }) => cid).join(","))

  const duplicateFiles = () =>
    selection.forEach(async ({ cid }) => {
      addFile(path, duplicateFile(await getCID(cid)))
    })

  const opts = [
    makeOpt("Open", close, openFile),
    makeOpt("Download", close, downloadFile),
    "divider",
    makeOpt("Delete", close, deleteFiles),
    "divider",
    makeOpt("Rename", close, onRenameRequest, !onRenameRequest),
    makeOpt("Duplicate", close, duplicateFiles),
    "divider",
    makeOpt("Inspect", close, useFVStore().showInspector),
    makeOpt("Copy CID", close, copyCID),
    makeOpt("Share", close),
  ].filter((v) => v !== "none") as (SelectionOptions | "divider")[]

  return <PopoverMenu close={close} anchor={anchor} opts={opts} {...props} />
}
