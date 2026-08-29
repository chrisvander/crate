import { faBox, faCaretDown, faMailForward, faStar } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import Button from "../components/Button"
import { categories, CommunityPage, SidebarProps } from "../models/Community"
import { useState } from "preact/hooks"

function SidebarButton({
  icon,
  text,
  selected = false,
  onClick = () => null,
  children,
}: SidebarProps) {
  const [expanded, setExpanded] = useState(false)
  const toggleExpanded = () => setExpanded(!expanded)
  return (
    <>
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
          <div className="flex flex-row space-x-2">
            {children && (
              <div
                className="w-5 h-5 flex justify-center rounded-md items-center bg-gray-200 hover:bg-gray-300 dark:bg-stone-600 dark:hover:bg-stone-500"
                onClick={toggleExpanded}
              >
                <span className={`transition-all ${expanded ? "rotate-0" : "rotate-90"}`}>
                  <FontAwesomeIcon icon={faCaretDown} />
                </span>
              </div>
            )}
            {!children && selected && <span className="bg-orange-400 w-0.5 h-5 block" />}
          </div>
        </a>
      </li>
      {expanded && <div className="ml-4">{children}</div>}
    </>
  )
}

export default function Community() {
  const [pane, setPane] = useState<string | CommunityPage>(CommunityPage.FEATURED)
  return (
    <div>
      <main>
        <div className="flex justify-between items-center">
          <h1>Community</h1>
          <Button className="font-medium h-10 text-neutral-50 rounded-md bg-orange-500 hover:bg-orange-600 active:bg-orange-700 transition-all py-3 px-6">
            <FontAwesomeIcon icon={faMailForward} />
            &nbsp;&nbsp;Submit
          </Button>
        </div>
        <div className="flex border border-neutral-200 dark:border-neutral-700 shadow-sm rounded-lg overflow-hidden">
          <div className="w-64 xl:w-72 2xl:w-80 bg-white dark:bg-stone-800 p-3 border-r">
            <ul className="space-y-2 text-sm list-none">
              <SidebarButton
                icon={faStar}
                text="Featured"
                selected={pane === CommunityPage.FEATURED}
                onClick={() => setPane(CommunityPage.FEATURED)}
              />
              <SidebarButton
                icon={faBox}
                text="All Categories"
                selected={pane === CommunityPage.ALL_CATEGORIES}
                onClick={() => setPane(CommunityPage.ALL_CATEGORIES)}
              />
              <div className="h-px bg-stone-200 mt-4 mb-4" />
              <div className="text-md font-semibold">Categories</div>
              {categories.map((category) => {
                const { name, icon, key, children } = category
                if (!children)
                  return (
                    <SidebarButton
                      key={name}
                      icon={icon}
                      text={name}
                      selected={key === pane}
                      onClick={() => setPane(key)}
                    />
                  )
                return (
                  <SidebarButton
                    key={name}
                    icon={icon}
                    text={name}
                    selected={key === pane}
                    onClick={() => setPane(key)}
                  >
                    {children.map(({ name, icon, key: childKey }) => (
                      <SidebarButton
                        key={name}
                        icon={icon}
                        text={name}
                        selected={childKey === pane}
                        onClick={() => setPane(childKey)}
                      />
                    ))}
                  </SidebarButton>
                )
              })}
            </ul>
          </div>

          <div className="flex-1">
            <div className="p-6 bg-white dark:bg-stone-800 dark:text-white text-neutral-900 min-h-full">
              <span>Placeholder</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
