import { useEffect, useState } from "preact/hooks"
import Button from "./Button"

export function PopoverButtonRow({ actions }: { actions: [string, () => void, boolean?][] }) {
  return (
    <div className="border-t border-gray-400 border-opacity-50 flex justify-end p-2 space-x-2">
      {actions.map(([title, func, disabled], idx) => (
        <Button
          key={title}
          onClick={func}
          disabled={disabled}
          className={idx === 0 ? "" : "bg-slate-400"}
        >
          {title}
        </Button>
      ))}
    </div>
  )
}

export function Popover({ children }) {
  const [shownState, setShownState] = useState(false)
  useEffect(() => setShownState(true), [])

  return (
    <div
      className={`h-full w-full absolute top-0 left-0 transition-all z-30 flex justify-center items-center duration-300 ${
        shownState
          ? "backdrop-blur-md backdrop-brightness-75"
          : "backdrop-blur-none backdrop-brightness-100"
      }`}
    >
      <div
        className={`bg-orange-100 dark:bg-stone-900 text-black dark:text-cyan-50 shadow-md rounded-md transition-all duration-300 ${
          shownState ? "opacity-100 scale-100" : "opacity-0 scale-50"
        }`}
      >
        {children}
      </div>
    </div>
  )
}
