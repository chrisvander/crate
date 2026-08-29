import type { AtprotoUser, UserModel } from "@crate/types"

type Session = { user: AtprotoUser; userDoc: UserModel }

async function login(handle: string) {
  const response = await fetch("/oauth/login", {
    body: JSON.stringify({ handle }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  })
  if (!response.ok) throw new Error(await response.text())

  const { redirectUrl } = (await response.json()) as { redirectUrl: string }
  window.location.assign(redirectUrl)
}

async function getSession(): Promise<Session | null> {
  const response = await fetch("/api/v1/session")
  if (response.status === 401) return null
  if (!response.ok) throw new Error(await response.text())
  return response.json()
}

async function updateUser(update: Partial<UserModel>): Promise<UserModel> {
  const response = await fetch("/api/v1/user", {
    body: JSON.stringify(update),
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  })
  if (!response.ok) throw new Error(await response.text())
  return response.json()
}

async function logout() {
  const response = await fetch("/api/v1/logout", { method: "POST" })
  if (!response.ok && response.status !== 401) throw new Error(await response.text())
}

export default { getSession, login, logout, updateUser }
