import logo from "../assets/crate-logo.svg?url"

export function Navigation({ authenticated = false }: { authenticated?: boolean }) {
  return (
    <header className="site-header mx-auto px-4 pt-6 pb-8 sm:px-6 lg:px-8 2xl:px-24">
      <nav className="relative z-10 flex items-center justify-between sm:h-10" aria-label="Global">
        <a className="brand flex items-center justify-between" href="/">
          <img
            className="mr-6 w-10 [filter:drop-shadow(0_4px_3px_#0001)_drop-shadow(0_2px_2px_#0001)] lg:w-16"
            src={logo}
            alt="Crate"
          />
          <span className="hidden font-heading text-4xl/10 font-bold text-heading lg:inline-block">
            CRATE
          </span>
        </a>
        <div className="navigation-actions ml-10 pr-4 whitespace-nowrap">
          {authenticated ? (
            <>
              <a
                className="navigation-primary rounded-md bg-accent px-6 py-3 font-medium text-[#fafafa] hover:bg-[#ea580c] active:bg-[#c2410c]"
                href="/files"
              >
                Files
              </a>
              <a
                className="navigation-secondary ml-4 rounded-md bg-[#a3a3a3] px-6 py-3 font-medium text-[#fafafa] hover:text-[#d4d4d4] dark:bg-[#525252]"
                href="/settings"
              >
                Settings
              </a>
            </>
          ) : (
            <a
              className="navigation-primary rounded-md bg-accent px-6 py-3 font-medium text-[#fafafa] hover:bg-[#ea580c] active:bg-[#c2410c]"
              href="/login"
            >
              Log in
            </a>
          )}
        </div>
      </nav>
    </header>
  )
}
