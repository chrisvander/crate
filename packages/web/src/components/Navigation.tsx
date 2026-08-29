import crateLogo from "../assets/crate-logo.svg"
import { Link } from "preact-router"
import { useUserStore } from "../store/UserStore"

export default function Navigation(props) {
  const loggedIn = useUserStore((state) => state.signedIn)
  return (
    <div {...props}>
      <div className="px-4 mx-auto sm:px-6 lg:px-8 2xl:px-24">
        <div className="relative z-10 pb-8">
          <div className="relative pt-6">
            <nav className="relative flex items-center justify-between sm:h-10" aria-label="Global">
              <div className="flex items-center flex-grow flex-shrink-0 lg:flex-grow-0">
                <div className="flex items-center justify-between w-full md:w-auto">
                  <Link href="/" className="flex items-center justify-between">
                    <div className="w-10 mr-6 lg:w-16 drop-shadow-md">
                      <img src={crateLogo} />
                    </div>
                    <h1 className="hidden mb-0 text-4xl lg:inline-block">CRATE</h1>
                  </Link>
                </div>
              </div>
              <div className="pr-4 ml-10 space-x-8">
                {!loggedIn ? (
                  <>
                    <span className="space-x-8">
                      <Link
                        href="/features"
                        className="font-medium text-gray-500 dark:text-gray-300 hover:text-neutral-400"
                      >
                        Features
                      </Link>

                      <Link
                        href="/plans"
                        className="font-medium text-gray-500 dark:text-gray-300 hover:text-neutral-400"
                      >
                        Plans & Pricing
                      </Link>
                    </span>
                    <span className="space-x-4">
                      <Link
                        href="/login"
                        className="px-6 py-3 font-medium bg-orange-500 text-neutral-50 rounded-md hover:text-neutral-300"
                      >
                        Log in
                      </Link>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="space-x-4">
                      <Link
                        href="/files"
                        className="px-6 py-3 font-medium bg-orange-500 text-neutral-50 rounded-md hover:bg-orange-600 active:bg-orange-700 transition-all"
                      >
                        Files
                      </Link>
                      <Link
                        href="/settings"
                        className="px-6 py-3 font-medium text-neutral-50 rounded-md hover:text-neutral-300 bg-neutral-400 dark:bg-neutral-600"
                      >
                        Settings
                      </Link>
                    </span>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
}
