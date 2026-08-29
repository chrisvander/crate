import {
  NodeOAuthClient,
  requestLocalLock,
  type NodeSavedSession,
  type NodeSavedState,
} from "@atproto/oauth-client-node"
import { JsonStore } from "../storage/json-store"
import { dataPath } from "../storage/paths"
import { getClientMetadata } from "./config"

const stateStore = new JsonStore<NodeSavedState>(dataPath("oauth-state.json"))
const sessionStore = new JsonStore<NodeSavedSession>(dataPath("oauth-sessions.json"))

export const oauthClient = new NodeOAuthClient({
  clientMetadata: getClientMetadata(),
  requestLock: requestLocalLock,
  stateStore,
  sessionStore,
})
