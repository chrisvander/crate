import { faCaretDown } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import Anchor from "../../models/Anchor"
import { StateUpdater, useRef, useState } from "preact/hooks"
import { JSXInternal } from "preact/src/jsx"
import { makeOpt, PopoverMenu } from "./PopoverMenu"

export type FuncInput = { name: string; onClick: () => void } | "divider" | "none"
export default function Dropdown<T extends string>(
  props:
    | {
        options: T[]
        current: T
        setValue: StateUpdater<T>
      }
    | {
        options: FuncInput[]
        display: JSXInternal.Element
      },
) {
  const { options, current, setValue, display } = {
    display: undefined,
    current: undefined,
    setValue: undefined,
    ...props,
  }
  const btnRef = useRef<HTMLButtonElement>(null)
  const [anchorPos, setAnchorPos] = useState<null | Anchor>(null)
  const expanded = Boolean(anchorPos)
  const toggleExpanded = (e: MouseEvent) => {
    e.preventDefault()
    if (expanded || !btnRef.current) setAnchorPos(null)
    else {
      const { offsetTop, offsetHeight, offsetLeft } = btnRef.current
      setAnchorPos({
        top: offsetTop + offsetHeight,
        left: offsetLeft,
      })
    }
  }

  return (
    <>
      <button
        ref={btnRef}
        className={`
        flex  
        h-10
        justify-between 
        items-center
        space-x-4
        px-3
        py-1.5
        text-base
        font-normal
        text-stone-700
        bg-white 
        dark:bg-stone-600 
        dark:text-neutral-50
        bg-clip-padding
        border border-solid border-stone-300
        dark:border-neutral-700
        rounded
        transition
        ease-in-out
        m-0
        shadow-sm
        ${
          expanded
            ? "dark:text-neutral-50 dark:bg-stone-700 text-gray-700 bg-white border-blue-600 outline-none"
            : ""
        } ${display ? "" : "w-48"}`}
        onClick={toggleExpanded}
      >
        {!display ? <span>{current || ""}</span> : display}
        <FontAwesomeIcon icon={faCaretDown} />
      </button>
      {expanded && (
        <PopoverMenu
          anchor={anchorPos}
          close={toggleExpanded}
          opts={
            display
              ? (options as FuncInput[]).map((v) =>
                  typeof v !== "string" ? makeOpt(v.name, toggleExpanded, v.onClick) : v,
                )
              : (options as T[]).map((v) => makeOpt(v, toggleExpanded, () => setValue(v)))
          }
        />
      )}
    </>
  )
}
