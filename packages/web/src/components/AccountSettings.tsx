import { faArrowRightFromBracket, faUser } from "@fortawesome/free-solid-svg-icons"
import type { Session } from "../lib/api"
import { Icon } from "./Icon"
import "../styles/settings.css"

export function AccountSettings({
  session,
  pending,
  onLogout,
}: {
  session: Session
  pending: boolean
  onLogout: () => void
}) {
  return (
    <main className="settings-main">
      <h1>Settings</h1>
      <div className="settings-panel">
        <aside className="settings-sidebar" aria-label="Settings">
          <div className="settings-identity">
            <span className="account-avatar">
              <Icon icon={faUser} />
            </span>
            <strong title={session.user.handle}>{session.user.handle}</strong>
          </div>
          <nav className="settings-links" aria-label="Account settings">
            <a href="#profile" aria-current="page">
              <span>
                <Icon icon={faUser} /> Profile
              </span>
              <i />
            </a>
            <button disabled={pending} onClick={onLogout}>
              <span>
                <Icon icon={faArrowRightFromBracket} /> {pending ? "Logging out…" : "Log out"}
              </span>
            </button>
          </nav>
        </aside>
        <section className="settings-content" id="profile">
          <h2>Profile</h2>
          <div className="profile-fields">
            <label>
              <span>Handle</span>
              <input readOnly value={session.user.handle} />
            </label>
            <label>
              <span>Account DID</span>
              <input readOnly value={session.user.did} />
            </label>
            <label>
              <span>Private Space</span>
              <input readOnly value={session.space.uri} />
            </label>
          </div>
          <p className="muted">
            Your ATProto account and storage permissions are managed by your PDS.
          </p>
        </section>
      </div>
    </main>
  )
}
