import type { AtprotoUser } from "@crate/types"
import type { OAuthSession } from "@atproto/oauth-client-node"

declare global {
  namespace Express {
    interface Request {
      oauthSession: OAuthSession
      user: AtprotoUser
    }
  }
}

export {}
