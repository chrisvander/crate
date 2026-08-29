import { CID, FileError, FileErrorType, joinPath, splitPath } from "@crate/utils"
import { getRootCID, setRootCID } from "../user/user-model"
import { IPFSHTTPClient } from "ipfs-http-client"
import { removeFromDir } from "../lib/directories"
import { pin } from "../lib/pinning"
import { walk } from "../lib/resolution"
import updatePath from "../lib/update-path"

export type FileDeleteOptions = {
  path: string
  uid?: string
}

export default (client: IPFSHTTPClient) => async (opts: FileDeleteOptions) => {
  const pathArr = splitPath(opts.path)
  if (pathArr.length < 2) throw new FileError(FileErrorType.CANNOT_RM_ROOT)
  const filename = pathArr[pathArr.length - 1]

  const pathCIDs = await walk(client, opts.path)
  const dirCID = pathCIDs[pathCIDs.length - 2]

  const newDirCID = await removeFromDir(client, dirCID, filename)
  const newPath = await updatePath(client, joinPath("ipfs", ...pathArr.slice(0, -1)), newDirCID)
  const newRootCID = CID.parse(splitPath(newPath)[0])

  await pin(client, newRootCID)

  // update the user's root CID if the file matches
  if (opts.uid && (await getRootCID(opts.uid)) === pathArr[0]) {
    setRootCID(opts.uid, newRootCID)
  }

  return newPath
}
