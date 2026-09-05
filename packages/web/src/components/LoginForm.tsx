import { useState } from "preact/hooks"
import { login } from "../lib/api"

export function LoginForm() {
  const [handle, setHandle] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  return (
    <section className="panel login-panel">
      <h1>Log in</h1>
      <p>Continue with your ATProto account. Your PDS confirms the permissions Crate needs.</p>
      <p className="muted">
        Crate requires a PDS with private Spaces support. Files are not published to your public
        repository.
      </p>
      <form
        className="stack"
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
        <label className="stack" for="handle">
          ATProto handle
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
  )
}
