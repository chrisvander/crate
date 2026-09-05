import { useEffect, useState } from "preact/hooks"
import { getSession } from "../lib/api"
import { Navigation } from "./Navigation"

export function PublicNavigation() {
  const [authenticated, setAuthenticated] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    void getSession(controller.signal).then(
      (session) => {
        if (!controller.signal.aborted) setAuthenticated(!!session)
      },
      () => {
        if (!controller.signal.aborted) setAuthenticated(false)
      },
    )
    return () => controller.abort()
  }, [])
  return <Navigation authenticated={authenticated} />
}
