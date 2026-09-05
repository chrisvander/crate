import useClickOutside from "../../hooks/useClickOutside"
import type Anchor from "../../models/Anchor"
import { useEffect, useRef, useState } from "preact/hooks"
import type { JSX } from "preact"
import { createPortal } from "preact/compat"

export type SelectionOptions = {
  name: string
  func: (e: MouseEvent) => void
  disabled?: boolean
}

export type PopoverMenuProps = {
  close: (e: MouseEvent) => void
  anchor: Anchor
  trigger?: HTMLElement | null
} & JSX.IntrinsicElements["div"]

export type PopoverMenuItem = SelectionOptions | "divider" | "none"
export type PopoverMenuItemsObj = { opts: PopoverMenuItem[] }

export function makeOpt(
  name: string,
  closeFunc: (e: MouseEvent) => void,
  f?: () => void,
  hide = false,
  disabled = false,
): PopoverMenuItem {
  return hide
    ? "none"
    : {
        name,
        disabled,
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
  trigger,
  ...props
}: PopoverMenuItemsObj & PopoverMenuProps) {
  const divRef = useRef<HTMLDivElement>(null)
  const [adjAnchor, setAnchor] = useState<Anchor>(anchor)
  const { left, top } = adjAnchor

  useEffect(() => {
    if (!divRef.current) return
    const { offsetHeight, offsetWidth } = divRef.current
    const { clientHeight, clientWidth } = document.documentElement
    const docBottom = clientHeight
    const menuBottom = top + offsetHeight
    const docRight = clientWidth
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
    exclude: [trigger ?? null],
  })

  const [initialMenuScale, setInitialMenuScale] = useState<boolean>(false)
  useEffect(() => {
    setInitialMenuScale(true)
  }, [])

  return createPortal(
    <div
      ref={divRef}
      className={`popover-menu flex flex-col p-1 z-50 transition-all duration-150 shadow-md text-sm dark:border-neutral-800 rounded-md fixed w-48 backdrop-blur-lg bg-white/40 dark:bg-neutral-900/50 select-none ${
        initialMenuScale ? "opacity-100" : "opacity-0 -translate-x-1/4 -translate-y-1/4 scale-50"
      }`}
      style={{ left, top }}
      onContextMenu={(event) => {
        event.preventDefault()
        close(event)
      }}
      onClick={(event) => event.stopPropagation()}
      {...props}
    >
      {opts.map((e, index) => {
        if (e === "divider") {
          return (
            <span
              key={index}
              className="mx-1 bg-neutral-500/20 dark:bg-neutral-300/20 h-px my-1 rounded-sm"
            />
          )
        } else if (e !== "none") {
          const { name, func } = e
          return (
            <span
              key={name}
              className="px-3 py-1 hover:bg-orange-400 hover:text-white rounded-md cursor-pointer"
              onClick={e.disabled ? undefined : func}
            >
              {name}
            </span>
          )
        }
        return null
      })}
    </div>,
    document.body,
  )
}
