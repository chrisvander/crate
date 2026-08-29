import { CID, FileError, FileErrorType, Node, splitPath, validPath } from "@crate/utils"
import { FileModel } from "@crate/types"
import { IPFSHTTPClient } from "ipfs-http-client"

/**
 * Fetches the {@link FileModel} metadata object corresponding to a CID.
 * @param client the {@link IPFSHTTPClient}.
 * @param cid the {@link CID} of the file.
 * @returns The {@link FileModel} metadata object.
 */
export const fetchFModel = async (client: IPFSHTTPClient, cid: CID): Promise<FileModel> => {
  const block = await client.block.get(cid)
  return await Node.toFile(Node.fromRawBlock(block))
}

/**
 * walkDir recursively walks down a path, resolving CIDs of each directory
 * until it reaches the leaf node.
 *
 * @param client the {@link IPFSHTTPClient}
 * @param dirCID the root directory CID
 * @param path the path array, where each element is a directory until the
 *             leaf node, which can be a directory or file.
 * @throws {FileErrorType.FILE_INVALID} when a CID for a file is passed while
 *         there are still elements in the path array.
 * @throws {FileErrorType.NO_DATA} if there is no file/directory corresponding
 *         to the provided path.
 * @returns the resolved CID array
 */
export const walkDir = async (
  client: IPFSHTTPClient,
  dirCID: string,
  path: string[],
): Promise<CID[]> => {
  const currPath = [CID.parse(dirCID)]
  // if there is no remaining path, this may be a file or directory, and we
  // should return the current path.
  if (path.length === 0) return currPath
  // fetch the file model for the CID
  const fModel = await fetchFModel(client, CID.parse(dirCID))
  // the fetched model must correspond to a directory to recurse
  if (!fModel.links || fModel.type !== "directory") throw new FileError(FileErrorType.FILE_INVALID)
  // get the next CID in the path according to the links in the directory.
  const nextCID = fModel.links.find((el) => el.name === path[0])?.cid
  // if the path is invalid, this will throw.
  if (!nextCID) throw new FileError(FileErrorType.NO_DATA)
  // recurse and return the next CID as part of the array.
  return currPath.concat(await walkDir(client, nextCID, path.slice(1)))
}

/**
 * walk recursively walks down a path, resolving CIDs of each directory
 * until it reaches the leaf node.
 * @param client the {@link IPFSHTTPClient}
 * @param path the path string, starting from a root IPFS CID and going down
 *             each directory until the leaf node, which can be a directory
 *             or file.
 * @throws {FileErrorType.PATH_INVALID} when the path is incorrect.
 * @returns an array of CIDs corresponding to each section of the path.
 */
export const walk = async (client: IPFSHTTPClient, path: string): Promise<CID[]> => {
  // throw if the file path is not valid.
  if (!validPath(path)) {
    throw new FileError(FileErrorType.PATH_INVALID)
  }
  // resolve the path into segments
  const segments = splitPath(path)
  // walk it using the recursive function
  return await walkDir(client, segments[0], segments.slice(1))
}
