import type { Page } from "@playwright/test"
import type { components } from "../../packages/client/src"

const did = "did:plc:abcdefghijklmnopqrstuvwx"
const spaceUri = `at://${did}/space/network.crate.drive/self`
export const account: components["schemas"]["Session"] = {
  user: { did, handle: "alex.example.com" },
  space: { uri: spaceUri, authorityDid: did, type: "network.crate.drive", key: "self" },
}

const date = "2026-09-05T12:00:00.000Z"
const examples: Pick<components["schemas"]["FileEntry"], "id" | "name" | "kind" | "size">[] = [
  { id: "3mab4e5f6g7h2", name: "Documents", kind: "directory", size: 0 },
  { id: "3mab4e5f6g7h3", name: "Readme.txt", kind: "file", size: 1024 },
  { id: "3mab4e5f6g7h4", name: "Vacation.jpg", kind: "file", size: 32768 },
]
export const files: components["schemas"]["FileEntry"][] = examples.map((file) => ({
  ...file,
  uri: `${spaceUri}/${did}/network.crate.file/${file.id}`,
  revision: `fixture-revision-${file.id}`,
  createdAt: date,
  updatedAt: date,
}))

export async function mockAccount(page: Page, authenticated = true) {
  let signedIn = authenticated
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url())
    if (url.hostname !== "127.0.0.1") return route.abort()
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) })
    if (url.pathname === "/api/v1/session")
      return signedIn ? json(account) : json({ code: "LoginRequired" }, 401)
    if (url.pathname === "/api/v1/files" && route.request().method() === "GET")
      return json({ files: url.searchParams.has("parentId") ? [] : files })
    if (url.pathname.endsWith("/versions")) return json({ versions: [] })
    if (url.pathname === "/api/v1/logout" && route.request().method() === "POST") {
      signedIn = false
      return route.fulfill({ status: 204 })
    }
    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/oauth"))
      return json({ code: "NotFound", message: "Unmocked request in isolated layout test." }, 404)
    return route.continue()
  })
}

export function fileItem(page: import("@playwright/test").Page, name: string) {
  return page
    .locator(".file-table tbody tr")
    .filter({ has: page.getByText(name, { exact: true }) })
    .or(
      page
        .locator(".file-grid > div")
        .filter({ has: page.getByText(name.split(".")[0], { exact: true }) }),
    )
}
