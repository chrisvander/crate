import { useState } from "preact/hooks"
import { login } from "../lib/api"
import "../styles/login.css"

export function LoginForm() {
  const [handle, setHandle] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  return (
    <main className="login-main">
      <section className="login-box">
        <h2>Log in</h2>
        <p>
          Continue with your ATProto account. Your PDS will confirm the permissions Crate needs.
        </p>
        <form
          className="login-form"
          onSubmit={async (event) => {
            event.preventDefault()
            if (!handle.trim()) return
            setPending(true)
            setError("")
            try {
              const { redirectUrl } = await login(handle.trim())
              window.location.assign(redirectUrl)
            } catch (error) {
              setError(error instanceof Error ? error.message : "Login failed.")
              setPending(false)
            }
          }}
        >
          <label for="handle">
            <span className="sr-only">ATProto handle</span>
            <input
              id="handle"
              name="handle"
              value={handle}
              placeholder="alice.example.com"
              autoComplete="username"
              autoCapitalize="none"
              spellcheck={false}
              required
              disabled={pending}
              onInput={(event) => setHandle(event.currentTarget.value)}
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="primary" disabled={pending || !handle.trim()}>
            {pending ? "Connecting…" : "Continue with ATProto"}
          </button>
        </form>
      </section>
    </main>
  )
}
