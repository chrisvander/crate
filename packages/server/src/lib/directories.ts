import { CID, FileError, FileErrorType, Node, UnixFS } from "@crate/utils"
import { IPFSHTTPClient } from "ipfs-http-client"
import { PBNode, PBLink } from "@ipld/dag-pb"

/**
 * Fetches a properly-formatted link for use in a PB-DAG directory from a file.
 * Optionally, a name can be provided, which otherwise defaults to the CID.
 * @param client the {@link IPFSHTTPClient}
 * @param cid the {@link CID} of the file to link to
 * @param name the name of the file as desired to be displayed from the dir.
 * @returns a link
 */
export async function getLinkTo(client: IPFSHTTPClient, cid: CID, name?: string): Promise<PBLink> {
  const rawBlock = await client.block.get(cid)
  const node = Node.fromRawBlock(rawBlock)
  if (!node.Data) throw new FileError(FileErrorType.NO_DATA)
  const ufs = UnixFS.unmarshal(rawBlock)

  return {
    Hash: cid,
    Name: name,
    Tsize: ufs.fileSize(),
  }
}

/**
 * Removes a link in the {@link PBNode} of a directory, if the file exists,
 * specified by name. Operates in-place, by reference.
 * @param node the directory node
 * @param name the name of the file link to remove
 */
export function removeLink(node: PBNode, name: string) {
  const idx = node.Links.findIndex((link) => link.Name === name)
  if (idx !== -1) node.Links.splice(idx, 1)
}

type FileDesc = { name: string; cid: CID }

/**
 * Add a file specified by it's {@link FileDesc} to the directory specified by
 * {@link CID} and return the updated {@link CID}.
 *
 * @param client the {@link IPFSHTTPClient}
 * @param parent the {@link CID} of the directory being updated.
 * @param newFile the name and {@link CID} of the new file. If a file already
 *                exists with that name, it will be replaced by this new link.
 * @returns the updated {@link CID} of the directory with the new file added.
 */
export async function addToDir(
  client: IPFSHTTPClient,
  parent: CID,
  newFile: FileDesc,
): Promise<CID> {
  const parentNode = Node.fromRawBlock(await client.block.get(parent))
  if (!parentNode.Data) throw new FileError(FileErrorType.NO_DATA)

  removeLink(parentNode, newFile.name)
  parentNode.Links.push(await getLinkTo(client, newFile.cid, newFile.name))

  const newParentCID = (
    await client.dag.put(Node.toRawBlock(parentNode), {
      inputCodec: "dag-pb",
      storeCodec: "dag-pb",
    })
  ).toV0()

  return newParentCID
}

/**
 * Add a file specified by it's {@link FileDesc} to the directory specified by
 * {@link CID} and return the updated {@link CID}.
 *
 * @param client the {@link IPFSHTTPClient}
 * @param parent the {@link CID} of the directory being updated.
 * @param nameToRemove the name of the link to remove.
 * @returns the updated {@link CID} of the directory with the new file added.
 */
export async function removeFromDir(client: IPFSHTTPClient, parent: CID, nameToRemove: string) {
  const parentNode = Node.fromRawBlock(await client.block.get(parent))
  if (!parentNode.Data) throw new FileError(FileErrorType.NO_DATA)

  removeLink(parentNode, nameToRemove)

  const newParentCID = (
    await client.dag.put(Node.toRawBlock(parentNode), {
      inputCodec: "dag-pb",
      storeCodec: "dag-pb",
    })
  ).toV0()

  return newParentCID
}
