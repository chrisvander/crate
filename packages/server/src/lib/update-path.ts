import { CID, splitPath } from "@crate/utils"
import { IPFSHTTPClient } from "ipfs-http-client"
import { addToDir } from "./directories"
import { walk } from "./resolution"

/**
 * Update a path to end at a different CID. Returns a path which is the same
 * but starts at a different root CID.
 *
 * @param client the {@link IPFSHTTPClient}
 * @param oldPath the file or directory which is being updated
 * @param replacementCID the CID of the new file or directory to slot in
 * @returns the updated path from a different root
 */
export default async function updatePath(
  client: IPFSHTTPClient,
  oldPath: string,
  replacementCID: CID,
) {
  const pathArr = splitPath(oldPath)
  const pathCIDs = await walk(client, oldPath)
  const pathInfo = pathArr.map((v, i) => ({ name: v, cid: pathCIDs[i] }))

  // start with providing the information for the new directory at the end of
  // the path.
  let info = {
    name: pathArr[pathArr.length - 1],
    cid: replacementCID,
  }

  // walk from the end up the beginning, updating the directories as we go.
  for (const dirInfo of pathInfo.reverse().slice(1)) {
    info = {
      name: dirInfo.name,
      cid: await addToDir(client, dirInfo.cid, info),
    }
  }

  return `/ipfs/${info.cid}/${pathArr.slice(1).join("/")}`
}
