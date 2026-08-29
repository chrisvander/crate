import { IPFSHTTPClient } from "ipfs-http-client"
import { CID } from "@crate/utils"
import { Pin, Status } from "@crate/types"

export async function pin(client: IPFSHTTPClient, cid: CID, name?: string): Promise<Pin> {
  await client.pin.add(cid)
  return {
    cid: cid.toString(),
    name,
    status: Status.Pinned,
  }

  // return await client.pin.remote.add(cid, {
  //   name: name,
  //   service: "crate",
  // })
}
