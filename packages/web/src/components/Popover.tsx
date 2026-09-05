import { createPortal } from "preact/compat"
import { useEffect, useState } from "preact/hooks"
import type { ComponentChildren } from "preact"
import Button from "./Button"

export function PopoverButtonRow({ actions }: { actions: [string, () => void, boolean?][] }) {
  return (
    <div className="flex justify-end gap-2 border-t border-gray-400/50 p-2">
      {actions.map(([title, action, disabled], index) => (
        <Button
          key={title}
          type="button"
          onClick={action}
          disabled={disabled}
          className={index === 0 ? "" : "bg-slate-400"}
        >
          {title}
        </Button>
      ))}
    </div>
  )
}
export function Popover({ children }: { children: ComponentChildren }) {
  const [shownState, setShownState] = useState(false)
  useEffect(() => setShownState(true), [])
  return createPortal(
    <div
      className={`fixed inset-0 z-60 flex items-center justify-center transition-all duration-300 ${shownState ? "backdrop-blur-md backdrop-brightness-75" : "backdrop-blur-none backdrop-brightness-100"}`}
    >
      <div
        className={`popover max-w-[calc(100vw-2rem)] rounded-md bg-orange-100 text-black shadow-md transition-all duration-300 dark:bg-stone-900 dark:text-cyan-50 ${shownState ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
