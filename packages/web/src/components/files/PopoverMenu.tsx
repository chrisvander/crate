import useClickOutside from "../../hooks/useClickOutside"
import Anchor from "../../models/Anchor"
import { useEffect, useRef, useState } from "preact/hooks"
import { JSXInternal } from "preact/src/jsx"

export type SelectionOptions = {
  name: string
  func: (e: MouseEvent) => void
}

export type PopoverMenuProps = {
  close: (e: MouseEvent) => void
  anchor: Anchor
} & JSXInternal.HTMLAttributes<HTMLDivElement>

export type PopoverMenuItem = SelectionOptions | "divider" | "none"
export type PopoverMenuItemsObj = { opts: PopoverMenuItem[] }

export function makeOpt(
  name: string,
  closeFunc: (e: MouseEvent) => void,
  f?: () => void,
  hide = false,
): PopoverMenuItem {
  return hide
    ? "none"
    : {
        name,
        func: (e: MouseEvent) => {
          if (f) f()
          closeFunc(e)
        },
      }
}

export function PopoverMenu({
  close,
  anchor,
  opts,
  ...props
}: PopoverMenuItemsObj & PopoverMenuProps) {
  const divRef = useRef<HTMLDivElement>()
  const [adjAnchor, setAnchor] = useState<Anchor>(anchor)
  const { left, top } = adjAnchor

  useEffect(() => {
    if (!divRef.current) return
    const { offsetHeight, offsetWidth } = divRef.current
    const { scrollTop, scrollLeft, clientHeight, clientWidth } = document.documentElement
    const docBottom = scrollTop + clientHeight
    const menuBottom = top + offsetHeight
    const docRight = scrollLeft + clientWidth
    const menuRight = left + offsetWidth
    setAnchor({
      top: top - (menuBottom > docBottom ? menuBottom - docBottom : 0),
      left: left - (menuRight > docRight ? menuRight - docRight : 0),
    })
  }, [anchor, left, top])

  useClickOutside({
    handler: close,
    events: ["click", "contextmenu"],
    ref: divRef,
  })

  const [initialMenuScale, setInitialMenuScale] = useState<boolean>(false)
  useEffect(() => {
    setInitialMenuScale(true)
  }, [])

  return (
    <div
      ref={divRef}
      className={`popover-menu flex flex-col p-1 z-20 transition-all duration-150 shadow-md text-sm dark:border-neutral-800 rounded-md absolute w-48 backdrop-blur-lg bg-white dark:bg-neutral-900 bg-opacity-40 dark:bg-opacity-50 select-none ${
        initialMenuScale ? "opacity-1" : "opacity-0 -translate-x-1/4 -translate-y-1/4 scale-50"
      }`}
      style={{ left, top }}
      onContextMenu={close}
      {...props}
    >
      {opts.map((e) => {
        if (e === "divider") {
          return (
            <span className="mx-1 bg-neutral-500 dark:bg-neutral-300 h-px my-1 bg-opacity-20 rounded-sm" />
          )
        } else if (e !== "none") {
          const { name, func } = e
          return (
            <span
              className="px-3 py-1 hover:bg-orange-400 hover:text-white rounded-md cursor-pointer"
              onClick={func}
            >
              {name}
            </span>
          )
        }
        return null
      })}
    </div>
  )
}
