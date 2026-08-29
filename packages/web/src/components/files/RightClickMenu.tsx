import { JSXInternal } from "preact/src/jsx"
import { makeOpt, PopoverMenu, PopoverMenuProps, SelectionOptions } from "./PopoverMenu"
import { useFileStore } from "../../store/FileStore"
import Anchor from "../../models/Anchor"
import { useStore as useFVStore } from "../../store/FileViewStore"
import { duplicateFile, joinPath, splitPath } from "@crate/utils"
import FileAPI from "../../api/FileAPI"

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
  const addFile = useFileStore((state) => state.add)
  const deleteFile = useFileStore((state) => state.delete)
  const getCID = useFileStore((state) => state.getCID)

  const selection = useFVStore((state) => state.selectedFiles)
  const path = useFVStore((state) => state.path)

  const deleteFiles = async () => {
    let nextPath = path
    for (const { name } of selection) {
      nextPath = await deleteFile(joinPath(...splitPath(nextPath), name))
      console.log(nextPath)
    }
  }

  const openFile = () =>
    selection.forEach(({ cid }) => window.open(FileAPI.contentUrl(cid), "_blank"))

  const downloadFile = () =>
    selection.forEach(({ cid, name }) =>
      window.open(`${FileAPI.contentUrl(cid)}&download=${encodeURIComponent(name)}`, "_blank"),
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
