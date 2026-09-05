import logo from "../assets/crate-logo.svg?url"

export function Navigation({ authenticated = false }: { authenticated?: boolean }) {
  return (
    <header className="site-header">
      <nav aria-label="Global">
        <a className="brand" href="/">
          <img src={logo} alt="Crate" />
          <span>CRATE</span>
        </a>
        <div className="navigation-actions">
          {authenticated ? (
            <>
              <a className="navigation-primary" href="/files">
                Files
              </a>
              <a className="navigation-secondary" href="/settings">
                Settings
              </a>
            </>
          ) : (
            <a className="navigation-primary" href="/login">
              Log in
            </a>
          )}
        </div>
      </nav>
    </header>
  )
}
