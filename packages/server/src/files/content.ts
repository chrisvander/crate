import { Agent } from "@atproto/api"
import type { OAuthSession } from "@atproto/oauth-client-node"
import { listFiles } from "./read"

export async function getContent(session: OAuthSession, cid: string) {
  const file = (await listFiles(session)).find((entry) => entry.cid === cid)
  if (!file?.record.blob) throw new Error(`File content not found: ${cid}`)

  const agent = new Agent(session)
  const response = await agent.com.atproto.sync.getBlob({
    cid: file.record.blob.ref.$link,
    did: session.did,
  })
  return { bytes: response.data, mimeType: file.record.blob.mimeType }
}
