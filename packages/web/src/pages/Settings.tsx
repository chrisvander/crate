import { IconProp } from "@fortawesome/fontawesome-svg-core"
import {
  faArrowRightFromBracket,
  faBell,
  faBox,
  faCircleNodes,
  faFileInvoiceDollar,
  faLock,
  faUser,
} from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { route } from "preact-router"
import { useState } from "preact/hooks"
import { useUserStore } from "../store/UserStore"
import Account from "../components/settings/Account"
import Security from "../components/settings/Security"

function SidebarButton({
  selected,
  icon,
  text,
  onClick,
}: {
  selected?: boolean
  icon: IconProp
  text: string
  onClick: () => void
}) {
  return (
    <li onClick={onClick}>
      <a
        href="#"
        className={`flex items-center space-x-3 justify-between text-gray-700 dark:text-stone-200 p-2 rounded-md font-medium ${
          selected
            ? "bg-gray-200 dark:bg-stone-700"
            : "hover:bg-gray-100 dark:hover:bg-stone-600 focus:bg-gray-200 focus:dark:bg-stone-700"
        }  focus:shadow-outline`}
      >
        <span className="space-x-3">
          <span className="text-gray-600 dark:text-stone-300">
            <FontAwesomeIcon className="w-5 scale-110" icon={icon} />
          </span>
          <span>{text}</span>
        </span>
        {selected && <span className="bg-orange-400 w-0.5 h-5 block" />}
      </a>
    </li>
  )
}

enum Pane {
  NETWORK,
  NOTIFICATIONS,
  BILLING,
  ACCOUNT,
  SECURITY,
  STORAGE,
}

export default function Settings() {
  console.log("SETTINGS")
  const { user, userDoc, logout } = useUserStore()

  const [selectedPane, setSelectedPane] = useState(Pane.ACCOUNT)

  function getProps(pane: Pane) {
    const o = {
      selected: pane === selectedPane,
      onClick: () => {
        setSelectedPane(pane)
      },
    }
    switch (pane) {
      case Pane.NETWORK:
        return { ...o, icon: faCircleNodes, text: "Network" }
      case Pane.NOTIFICATIONS:
        return { ...o, icon: faBell, text: "Notifications" }
      case Pane.BILLING:
        return { ...o, icon: faFileInvoiceDollar, text: "Plan & Billing" }
      case Pane.ACCOUNT:
        return { ...o, icon: faUser, text: "Profile" }
      case Pane.SECURITY:
        return { ...o, icon: faLock, text: "Security" }
      case Pane.STORAGE:
        return { ...o, icon: faBox, text: "Storage" }
    }
  }

  function getPane(pane: Pane) {
    switch (pane) {
      case Pane.ACCOUNT:
        return <Account />
      case Pane.SECURITY:
        return <Security />
      default:
        return <span>Content Here</span>
    }
  }

  if (!user) return <div className="w-full mt-6 italic text-center">Loading...</div>

  return (
    <main className="max-w-screen-2xl">
      <h1 className="mb-3 text-4xl font-bold font-iaQuattro lg:text-5xl lg:mb-8">Settings</h1>
      <div className="flex overflow-hidden bg-white border rounded-lg border-neutral-200 dark:border-neutral-700 dark:bg-stone-800 shadow-sm">
        <div className="w-56 p-3 border-r lg:w-fit lg:max-w-sm dark:border-neutral-700">
          {user.email !== "" && (
            <div className="flex items-center p-2 mb-5 lg:space-x-4">
              <div className="items-center justify-center flex-shrink-0 hidden w-12 h-12 rounded-full bg-neutral-200 dark:bg-stone-700 lg:flex">
                <FontAwesomeIcon icon={faUser} />
              </div>
              <div className="overflow-hidden overflow-ellipsis whitespace-nowrap">
                <h4 className="w-full overflow-hidden font-semibold tracking-wide text-gray-700 overflow-ellipsis whitespace-nowrap text-md dark:text-gray-100 font-poppins">
                  {userDoc && userDoc.firstName !== ""
                    ? `${userDoc.firstName} ${userDoc.lastName}`
                    : user.email}
                </h4>
                {userDoc && userDoc.organization !== "" && (
                  <span className="flex items-center overflow-hidden text-sm tracking-wide overflow-ellipsis whitespace-nowrap space-x-1">
                    <span className="text-gray-600 dark:text-gray-200 text-md">
                      {userDoc.organization}
                    </span>
                  </span>
                )}
              </div>
            </div>
          )}
          <ul className="text-sm list-none space-y-2">
            <SidebarButton {...getProps(Pane.ACCOUNT)} />
            <SidebarButton {...getProps(Pane.SECURITY)} />
            <SidebarButton {...getProps(Pane.BILLING)} />
            <SidebarButton {...getProps(Pane.STORAGE)} />
            <SidebarButton {...getProps(Pane.NETWORK)} />
            <SidebarButton {...getProps(Pane.NOTIFICATIONS)} />
            <SidebarButton
              icon={faArrowRightFromBracket}
              text="Logout"
              onClick={() => {
                logout()
                route("/", true)
              }}
            />
          </ul>
        </div>

        <div className="flex justify-center flex-1 rounded-md">
          <div className="w-full p-6 ml-4">{getPane(selectedPane)}</div>
        </div>
      </div>
    </main>
  )
}
