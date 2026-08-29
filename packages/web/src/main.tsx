import { Fragment, render } from "preact"
import { useEffect, useErrorBoundary } from "preact/hooks"
import Router, { route } from "preact-router"
import lazy from "preact-lazy"
import "./index.css"

import Splash from "./pages/Splash"
import Login from "./pages/Login"
import Navigation from "./components/Navigation"
import Footer from "./components/Footer"
import NotFound from "./pages/NotFound"
import { useErrorStore } from "./store/ErrorStore"
import { useUserStore } from "./store/UserStore"
import Markdown from "./pages/Markdown"
import PrivacyPolicyMarkdown from "./content/privacy-policy.md?raw"
import TermsOfUseMarkdown from "./content/terms-of-use.md?raw"
import { marked } from "marked"
import { JSXInternal } from "preact/src/jsx"
import Community from "./pages/Community"

type PageProps = {
  title: string
  path?: string
  children: JSXInternal.Element
  header?: JSXInternal.Element
  default?: boolean
  protect?: boolean
  breadcrumbs?: { name: string; link: string }[]
}

const Page = (props: PageProps) => {
  const { title, children, header, protect, breadcrumbs } = props
  const loggedIn = useUserStore((state) => state.signedIn)
  const errorStore = useErrorStore()

  useErrorBoundary((error: Error) => {
    console.error(error)
    errorStore.showError(error)
  })

  if (!loggedIn && protect) {
    route("/", true)
  }

  useEffect(() => {
    document.title = title || ""
  }, [title])

  return (
    <div className="relative min-h-screen pb-48">
      {header ? header : <Navigation />}
      <div
        className={`fixed flex justify-between items-center align-middle transition-all duration-300 mx-auto left-0 right-0 w-4/12 p-4 bg-red-500 bg-opacity-90 shadow-md backdrop-blur-lg z-10 rounded-lg text-white ${
          errorStore.displayed ? "top-4 opacity-100" : "-top-full opacity-0"
        }`}
      >
        <span class="text-lg p-1">
          <b>{errorStore.name || "Error"}: </b>
          {errorStore.message}
        </span>
        <button
          className="px-6 py-3 font-medium text-neutral-50 rounded-md bg-neutral-400"
          onClick={errorStore.hide}
        >
          Dismiss
        </button>
      </div>
      <div>{children}</div>
      <Footer
        breadcrumbs={
          breadcrumbs
            ? breadcrumbs
            : [
                {
                  name: title.includes("Crate - ") ? title.split(" - ")[1] : title,
                  link: props.path,
                },
              ]
        }
      />
    </div>
  )
}

const Files = lazy(() => import("./pages/Files"))
const Settings = lazy(() => import("./pages/Settings"))

export function App() {
  return (
    <Router>
      <Page path="/" header={<Fragment />} title={"Crate"}>
        <Splash />
      </Page>
      <Page path="/files" title={"Crate - Files"} protect>
        <Files />
      </Page>
      <Page path="/settings" title={"Crate - Settings"} protect>
        <Settings />
      </Page>
      <Page path="/community" title={"Crate - Community"}>
        <Community />
      </Page>
      <Page path="/privacy-policy" title={"Crate - Privacy Policy"}>
        <Markdown html={marked.parse(PrivacyPolicyMarkdown)} />
      </Page>
      <Page path="/terms-of-use" title={"Crate - Terms of Use"}>
        <Markdown html={marked.parse(TermsOfUseMarkdown)} />
      </Page>
      <Page path="/login" title={"Crate - Login"}>
        <Login />
      </Page>
      <Page default title="Crate - 404 Not Found">
        <NotFound />
      </Page>
    </Router>
  )
}

render(<App />, document.getElementById("app"))
