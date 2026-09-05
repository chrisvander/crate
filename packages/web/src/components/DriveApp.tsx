import { QueryClientProvider, useQuery, useQueryClient } from "@tanstack/preact-query"
import { useEffect, useState } from "preact/hooks"
import { api, getSession, sessionKey } from "../lib/api"
import { createQueryClient } from "../lib/query"
import { LoginForm } from "./LoginForm"
import { Explorer } from "./files/Explorer"
import { Navigation } from "./Navigation"
import { AccountSettings } from "./AccountSettings"

type Mode = "files" | "login" | "settings"

function Account({ mode }: { mode: Mode }) {
  const client = useQueryClient()
  const session = useQuery({
    queryKey: sessionKey,
    queryFn: ({ signal }) => getSession(signal),
    retry: false,
  })
  const [error, setError] = useState("")
  const [loggingOut, setLoggingOut] = useState(false)
  const account = session.data

  useEffect(() => {
    if (account && mode === "login") window.location.replace("/files")
  }, [account, mode])

  const logOut = async () => {
    setLoggingOut(true)
    setError("")
    try {
      await client.cancelQueries({ queryKey: ["files"] })
      const response = await api.POST("/api/v1/logout")
      if (!response.response.ok && response.response.status !== 401)
        throw new Error("Logout failed. Please try again.")
      client.clear()
      window.location.replace("/login")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Logout failed.")
      setLoggingOut(false)
    }
  }

  if (session.isPending)
    return (
      <>
        <Navigation />
        <main>
          <p role="status">Restoring your ATProto session…</p>
        </main>
      </>
    )
  if (session.isError)
    return (
      <>
        <Navigation />
        <main className="stack">
          <h1>Cannot restore your session</h1>
          <p className="error" role="alert">
            {session.error.message}
          </p>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button disabled={loggingOut} onClick={() => void session.refetch()}>
            Try again
          </button>
          <button disabled={loggingOut} onClick={() => void logOut()}>
            Use another account
          </button>
        </main>
      </>
    )
  if (!account)
    return (
      <>
        <Navigation />
        <LoginForm />
      </>
    )
  if (mode === "login") return <p role="status">Opening your files…</p>

  return (
    <>
      <Navigation authenticated />
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {mode === "settings" ? (
        <AccountSettings session={account} pending={loggingOut} onLogout={() => void logOut()} />
      ) : loggingOut ? (
        <main>
          <p role="status">Logging out…</p>
        </main>
      ) : (
        <Explorer key={account.user.did + account.space.uri} session={account} />
      )}
    </>
  )
}

export default function DriveApp({ mode }: { mode: Mode }) {
  const [client] = useState(createQueryClient)
  return (
    <QueryClientProvider client={client}>
      <Account mode={mode} />
    </QueryClientProvider>
  )
}
