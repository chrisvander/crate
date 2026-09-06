import { faArrowRightFromBracket, faUser } from "@fortawesome/free-solid-svg-icons"
import type { Session } from "../lib/api"
import { Icon } from "./Icon"

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
    <main className="settings-main max-w-[1536px]">
      <h1>Settings</h1>
      <div className="settings-panel flex min-h-[410px] overflow-hidden rounded-lg border border-line bg-panel shadow-[0_1px_2px_#0001] dark:bg-[#292524]">
        <aside
          className="settings-sidebar w-56 max-w-96 shrink-0 border-r border-line p-3 max-sm:w-29 max-sm:p-2 lg:w-[211px]"
          aria-label="Settings"
        >
          <div className="settings-identity mb-5 flex items-center p-2 max-sm:p-1 lg:gap-4">
            <span className="account-avatar hidden size-12 shrink-0 items-center justify-center rounded-full bg-[#e5e5e5] lg:flex dark:bg-[#44403c]">
              <Icon icon={faUser} />
            </span>
            <strong
              className="truncate text-sm/normal font-semibold tracking-wide text-[#374151] dark:text-[#f3f4f6]"
              title={session.user.handle}
            >
              {session.user.handle}
            </strong>
          </div>
          <nav
            className="settings-links flex flex-col gap-2 text-sm/normal"
            aria-label="Account settings"
          >
            <a
              className="flex items-center justify-between rounded-md bg-[#e5e7eb] p-2 text-left font-medium text-[#374151] dark:bg-[#44403c] dark:text-[#e7e5e4]"
              href="#profile"
              aria-current="page"
            >
              <span>
                <Icon
                  className="mr-3 w-5 text-[#4b5563] max-sm:mr-1.5 dark:text-[#d6d3d1]"
                  icon={faUser}
                />{" "}
                Profile
              </span>
              <i className="h-5 w-0.5 bg-[#fb923c]" />
            </a>
            <button
              className="flex items-center justify-between rounded-md p-2 text-left font-medium text-[#374151] hover:bg-[#f3f4f6] dark:text-[#e7e5e4] dark:hover:bg-[#57534e]"
              disabled={pending}
              onClick={onLogout}
            >
              <span>
                <Icon
                  className="mr-3 w-5 text-[#4b5563] max-sm:mr-1.5 dark:text-[#d6d3d1]"
                  icon={faArrowRightFromBracket}
                />{" "}
                {pending ? "Logging out…" : "Log out"}
              </span>
            </button>
          </nav>
        </aside>
        <section
          className="settings-content ml-4 min-w-0 flex-1 p-6 max-sm:ml-0 max-sm:p-3"
          id="profile"
        >
          <h2 className="mb-4">Profile</h2>
          <div className="profile-fields flex flex-col gap-4">
            <label className="flex items-center max-sm:block">
              <span className="w-36 shrink-0 max-sm:mb-1 max-sm:block">Handle</span>
              <input className="min-w-0" readOnly value={session.user.handle} />
            </label>
            <label className="flex items-center max-sm:block">
              <span className="w-36 shrink-0 max-sm:mb-1 max-sm:block">Account DID</span>
              <input className="min-w-0" readOnly value={session.user.did} />
            </label>
            <label className="flex items-center max-sm:block">
              <span className="w-36 shrink-0 max-sm:mb-1 max-sm:block">Private Space</span>
              <input className="min-w-0" readOnly value={session.space.uri} />
            </label>
          </div>
          <p className="mt-4 text-sm/normal text-muted">
            Your ATProto account and storage permissions are managed by your PDS.
          </p>
        </section>
      </div>
    </main>
  )
}
