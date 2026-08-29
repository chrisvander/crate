import type { RequestHandler } from "express"
import { clearSessionCookie, getBrowserSession } from "./browser-session"
import { oauthClient } from "./oauth-client"

export const requireAuth: RequestHandler = async (request, response, next) => {
  const browserSession = await getBrowserSession(request)
  if (!browserSession) {
    response.sendStatus(401)
    return
  }

  try {
    request.user = browserSession.user
    request.oauthSession = await oauthClient.restore(browserSession.user.did)
    next()
  } catch {
    response.setHeader("Set-Cookie", clearSessionCookie())
    response.sendStatus(401)
  }
}
