import { useEffect } from "preact/hooks"
import type { RefObject } from "preact"

export default function useClickOutside({
  ref,
  handler,
  events = ["click"],
  exclude = [],
}: {
  ref: RefObject<HTMLElement>
  handler: (event: MouseEvent) => void
  events?: ("click" | "contextmenu")[]
  exclude?: (Node | null)[]
}) {
  useEffect(() => {
    const detectClick = (event: MouseEvent) => {
      if (!(event.target instanceof Node) || !ref.current) return
      if (
        ref.current.contains(event.target) ||
        exclude.some((node) => node?.contains(event.target as Node))
      )
        return
      handler(event)
    }
    events.forEach((event) => document.addEventListener(event, detectClick))
    return () => events.forEach((event) => document.removeEventListener(event, detectClick))
  }, [ref, handler, events, exclude])
}
