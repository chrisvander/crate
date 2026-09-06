import { useState } from "preact/hooks"
import { login } from "../lib/api"

export function LoginForm() {
  const [handle, setHandle] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  return (
    <main className="login-main m-0 flex w-full items-center justify-center p-0">
      <section className="login-box mx-12 mt-6 mb-12 flex-[0_1_384px] self-center rounded-2xl border-2 border-[#1717171a] bg-form p-12 text-heading shadow-[0_10px_15px_-3px_#0001,0_4px_6px_-4px_#0001] md:mt-24 xl:mt-36">
        <h2 className="pb-2">Log in</h2>
        <p className="mt-4 mb-0 text-sm/5 text-[#374151] dark:text-[#d1d5db]">
          Continue with your ATProto account. Your PDS will confirm the permissions Crate needs.
        </p>
        <form
          className="login-form mt-4 mb-0"
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
          <label className="block" for="handle">
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
            <p className="error mt-4 text-sm/5 text-[#374151] dark:text-[#d1d5db]" role="alert">
              {error}
            </p>
          )}
          <button className="primary mt-4 w-full" disabled={pending || !handle.trim()}>
            {pending ? "Connecting…" : "Continue with ATProto"}
          </button>
        </form>
      </section>
    </main>
  )
}
