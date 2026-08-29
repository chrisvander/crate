import { IPFSHTTPClient } from "ipfs-http-client"
import { CID, splitPath, UnixFS } from "@crate/utils"
import { fetchFModel } from "../lib/resolution"
import { FileModel } from "@crate/types"
import dirAdd from "./dir-add"
import { setRootCID } from "../user/user-model"
import { pin } from "../lib/pinning"

export type FileAddOptions = {
  path: string
  uid?: string
  filename?: string
} & (
  | {
      file: AsyncIterable<Uint8Array>
    }
  | {
      fileCID: CID
    }
)

type AddResult = {
  cid: CID
  size: number
}

/**
 * Resolve existing CIDs on IPFS to determine size of the files.
 * @param client the {@link IPFSHTTPClient}
 * @param cids an array of {@link CID} to add
 * @returns an array of {@link AddResult} objects, which specify CID and size
 */
async function resolveCID(client: IPFSHTTPClient, cid: CID): Promise<AddResult> {
  const model = await fetchFModel(client, cid)
  return {
    cid,
    size: model.size,
  }
}

/**
 * Add a series of files to the IPFS client by way of NodeJS file buffers.
 * @param client the {@link IPFSHTTPClient}
 * @param files an array of byte streams to read
 * @returns an array of {@link AddResult} objects, which specify CID and size
 */
async function addFileBuffer(
  client: IPFSHTTPClient,
  buffer: AsyncIterable<Uint8Array>,
): Promise<AddResult> {
  const res = await client.add(buffer)
  const block = await client.block.get(res.cid)
  const size = await UnixFS.unmarshal(block).fileSize()
  return {
    ...res,
    size,
  }
}

export default (client: IPFSHTTPClient) =>
  async (opts: FileAddOptions): Promise<[FileModel, string]> => {
    // parse files, forward to IPFS to get the CID
    const result =
      "file" in opts
        ? await addFileBuffer(client, opts.file)
        : await resolveCID(client, opts.fileCID)

    // resolve filenames, if they exist
    const filename = opts.filename ? opts.filename : result.cid.toString()

    // finish up file model convention
    const model: FileModel = {
      cid: result.cid.toString(),
      name: filename,
      type: "file",
      size: result.size,
      date: new Date().toISOString(),
    }

    const filePath = await dirAdd(client)({
      path: opts.path,
      name: filename,
      cid: result.cid,
      uid: opts.uid,
    })

    // pin the file using our remote pinning service
    await pin(client, result.cid, model.name)
    if (opts.uid) await setRootCID(opts.uid, CID.parse(splitPath(filePath)[0]))

    return [model, filePath]
  }
