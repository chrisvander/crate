import Button from "../components/Button"
import FormBox from "../components/FormBox"
import FormInput from "../components/FormInput"
import appleLogo from "../assets/signin-apple-logo.svg"
import { Link, route } from "preact-router"
import { useState } from "preact/hooks"
import { useUserStore } from "../store/UserStore"
import { useErrorStore } from "../store/ErrorStore"

export enum AuthenticateType {
  REGISTER = "Register",
  LOGIN = "Login",
}

type SignInBtnProps = {
  providerText: string
  disabled: boolean
  handleProvider: (cb: () => Promise<void>) => void
}

// function SignInWithGoogle({
//   handleProvider,
//   disabled,
//   providerText,
// }: SignInBtnProps) {
//   const useGoogle = handleProvider(async () => {
//     await signInWithRedirect(auth, providers.google)
//   })

//   return (
//     <Button
//       id="google-signin"
//       disabled={disabled}
//       className="flex flex-row items-center justify-between w-full h-8 p-2 mt-4 overflow-hidden text-black align-middle bg-gray-100 hover:shadow-md transition-shadow"
//       onClick={useGoogle}
//     >
//       <img
//         className="h-8 p-2"
//         alt="Google sign-in"
//         src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/512px-Google_%22G%22_Logo.svg.png"
//       />
//       {providerText} with Google
//       <span />
//     </Button>
//   )
// }

// function SignInWithGithub({
//   handleProvider,
//   disabled,
//   providerText,
// }: SignInBtnProps) {
//   const useGitHub = handleProvider(async () => {
//     await signInWithRedirect(auth, providers.github)
//   })

//   return (
//     <Button
//       id="github-signin"
//       disabled={disabled}
//       className="flex flex-row items-center justify-between w-full h-8 p-2 mt-4 overflow-hidden text-black align-middle bg-gray-100 hover:shadow-md transition-shadow"
//       onClick={useGitHub}
//     >
//       <img
//         className="h-8 p-2"
//         alt="GitHub sign-in"
//         src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Font_Awesome_5_brands_github.svg/2560px-Font_Awesome_5_brands_github.svg.png"
//       />
//       {providerText} with GitHub
//       <span />
//     </Button>
//   )
// }

function SignInWithApple({ handleProvider, disabled, providerText }: SignInBtnProps) {
  const useApple = handleProvider(async () => {
    const { signInWithRedirect } = await import("firebase/auth")
    const { auth, providers } = await import("../vendor/firebase")

    await signInWithRedirect(auth, providers.apple)
  })
  return (
    <Button
      id="apple-signin"
      disabled={disabled}
      className="flex flex-row items-center justify-between w-full p-2 mt-4 overflow-hidden text-white align-middle bg-black h-9 hover:shadow-md transition-shadow"
      onClick={useApple}
    >
      <img src={appleLogo} className="h-8 mt-0.5" alt="Apple sign-in" />
      {providerText} with Apple
      <span />
    </Button>
  )
}

export default function Authenticate({ type }: { type: AuthenticateType }) {
  const loggedIn = useUserStore((state) => state.signedIn)

  if (loggedIn) route("/files", true)

  const [disableInputs, setDisableInputs] = useState(false)
  const providerText = type === AuthenticateType.LOGIN ? "Sign in" : "Sign up"

  const handleProvider = (providerCb: () => Promise<void>) => async () => {
    setDisableInputs(true)
    try {
      await providerCb()
    } catch (error) {
      const errorCode = error.code
      const errorMessage = error.message
      useErrorStore.getState().showError({ name: errorCode, message: errorMessage })
    } finally {
      setDisableInputs(false)
    }
  }

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [verifyPassword, setVerifyPassword] = useState("")
  const useEmail = handleProvider(async () => {
    const { signInWithEmailAndPassword, createUserWithEmailAndPassword } =
      await import("firebase/auth")
    const { auth } = await import("../vendor/firebase")

    if (type === AuthenticateType.REGISTER)
      await createUserWithEmailAndPassword(auth, email, password)
    else await signInWithEmailAndPassword(auth, email, password)
  })

  const emailValidated =
    email &&
    password &&
    email !== "" &&
    password.length > 8 &&
    (type === AuthenticateType.LOGIN || (verifyPassword && verifyPassword === password))

  return (
    <FormBox className="mt-6 space-y-4 md:mt-24 xl:mt-36">
      <h2 className="pb-2">{type}</h2>
      <FormInput
        id="email"
        placeholder="Enter your email"
        type="email"
        value={email}
        disabled={disableInputs}
        onInput={(e) => {
          if (e) setEmail(e.target.value)
        }}
      />
      <FormInput
        id="password"
        placeholder="Password"
        type="password"
        value={password}
        disabled={disableInputs}
        onInput={(e) => {
          if (e) setPassword(e.target.value)
        }}
      />
      {type === AuthenticateType.REGISTER && (
        <FormInput
          id="password"
          placeholder="Confirm Password"
          type="password"
          value={verifyPassword}
          disabled={disableInputs}
          onInput={(e) => {
            if (e) setVerifyPassword(e.target.value)
          }}
        />
      )}
      <Button className="w-full text-white" onClick={useEmail} disabled={!emailValidated}>
        {providerText} with Email
      </Button>
      <SignInWithApple
        disabled={disableInputs}
        providerText={providerText}
        handleProvider={handleProvider}
      />
      {/* <SignInWithGoogle
        disabled={disableInputs}
        providerText={providerText}
        handleProvider={handleProvider}
      />
      <SignInWithGitHub
        disabled={disableInputs}
        providerText={providerText}
        handleProvider={handleProvider}
      /> */}
      <div className="w-full h-px mt-4 mb-1 bg-stone-300 dark:bg-stone-600" />
      <span className="text-sm text-gray-700 dark:text-gray-300">
        {type === AuthenticateType.LOGIN ? (
          <>
            New here?{" "}
            <Link className="underline" href="/register">
              Register an account.
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link className="underline" href="/login">
              Sign in.
            </Link>
          </>
        )}
      </span>
    </FormBox>
  )
}
