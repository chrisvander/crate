import { Router, type RequestHandler } from "express"
import { createBrowserSession, clearSessionCookie, deleteBrowserSession } from "./browser-session"
import { oauthScope, webUrl } from "./config"
import { requireAuth } from "./middleware"
import { oauthClient } from "./oauth-client"
import { getUserDoc, setUserDoc } from "../user/user-model"

const router: Router = Router()

router.get("/oauth-client-metadata.json", (_request, response) => {
  response.json(oauthClient.clientMetadata)
})

router.post(
  "/oauth/login",
  asyncRoute(async (request, response) => {
    const handle = normalizeHandle(request.body?.handle)
    if (!handle) {
      response.status(400).json({ error: "Handle is required." })
      return
    }

    const redirectUrl = await oauthClient.authorize(handle, { scope: oauthScope, state: handle })
    response.json({ redirectUrl: redirectUrl.toString() })
  }),
)

router.get(
  "/oauth/callback",
  asyncRoute(async (request, response) => {
    const query = request.originalUrl.split("?")[1] ?? ""
    const { session, state } = await oauthClient.callback(new URLSearchParams(query))
    const user = { did: session.did, handle: state ?? session.did }
    const { cookie } = await createBrowserSession(user)

    await getUserDoc(user.did)
    response.setHeader("Set-Cookie", cookie)
    response.redirect(`${webUrl}/files`)
  }),
)

router.get(
  "/api/v1/session",
  requireAuth,
  asyncRoute(async (request, response) => {
    response.json({ user: request.user, userDoc: await getUserDoc(request.user.did) })
  }),
)

router.patch(
  "/api/v1/user",
  requireAuth,
  asyncRoute(async (request, response) => {
    response.json(await setUserDoc(request.user.did, request.body))
  }),
)

router.post(
  "/api/v1/logout",
  requireAuth,
  asyncRoute(async (request, response) => {
    await request.oauthSession.signOut()
    await deleteBrowserSession(request)
    response.setHeader("Set-Cookie", clearSessionCookie())
    response.sendStatus(204)
  }),
)

function normalizeHandle(value: unknown) {
  if (typeof value !== "string") return undefined
  const handle = value.trim().replace(/^@/, "")
  return handle || undefined
}

function asyncRoute(handler: RequestHandler): RequestHandler {
  return (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next)
}

export default router
