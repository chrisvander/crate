import { randomBytes } from "node:crypto"
import type { Request } from "express"
import type { AtprotoUser } from "@crate/types"
import { JsonStore } from "../storage/json-store"
import { dataPath } from "../storage/paths"

const cookieName = "crate_session"
const sessions = new JsonStore<AtprotoUser>(dataPath("browser-sessions.json"))

export async function createBrowserSession(user: AtprotoUser) {
  const id = randomBytes(32).toString("base64url")
  await sessions.set(id, user)
  return { cookie: serializeCookie(id), id }
}

export async function getBrowserSession(request: Request) {
  const id = getCookie(request)
  if (!id) return undefined
  const user = await sessions.get(id)
  return user ? { id, user } : undefined
}

export async function deleteBrowserSession(request: Request) {
  const id = getCookie(request)
  if (id) await sessions.del(id)
}

export const clearSessionCookie = () => serializeCookie("", 0)

function getCookie(request: Request) {
  const entry = request.headers.cookie
    ?.split(";")
    .map((value) => value.trim().split("="))
    .find(([name]) => name === cookieName)

  return entry?.[1]
}

function serializeCookie(value: string, maxAge = 60 * 60 * 24 * 30) {
  const secure = process.env["NODE_ENV"] === "production" ? "; Secure" : ""
  return `${cookieName}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`
}
