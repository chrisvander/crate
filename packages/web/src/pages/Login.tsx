import { useState } from "preact/hooks"
import { route } from "preact-router"
import Button from "../components/Button"
import FormBox from "../components/FormBox"
import FormInput from "../components/FormInput"
import { useErrorStore } from "../store/ErrorStore"
import { useUserStore } from "../store/UserStore"

export default function Login() {
  const loggedIn = useUserStore((state) => state.signedIn)
  const login = useUserStore((state) => state.login)
  const [disabled, setDisabled] = useState(false)
  const [handle, setHandle] = useState("")

  if (loggedIn) route("/files", true)

  const authenticate = async () => {
    setDisabled(true)
    try {
      await login(handle)
    } catch (error) {
      useErrorStore.getState().showError(error as Error)
      setDisabled(false)
    }
  }

  return (
    <FormBox className="mt-6 space-y-4 md:mt-24 xl:mt-36">
      <h2 className="pb-2">Log in</h2>
      <p className="text-sm text-gray-700 dark:text-gray-300">
        Continue with your ATProto account. Your PDS will confirm the permissions Crate needs.
      </p>
      <FormInput
        id="handle"
        placeholder="alice.example.com"
        type="text"
        value={handle}
        disabled={disabled}
        onInput={(event) => setHandle(event.currentTarget.value)}
      />
      <Button
        className="w-full text-white"
        onClick={authenticate}
        disabled={!handle.trim() || disabled}
      >
        Continue with ATProto
      </Button>
    </FormBox>
  )
}
