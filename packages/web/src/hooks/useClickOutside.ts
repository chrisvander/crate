import { MutableRef, useEffect } from "preact/hooks"

export default function useClickOutside(opts: {
  ref: MutableRef<HTMLElement>
  handler: (e) => void
  events?: (keyof DocumentEventMap)[]
  exclude?: Node[]
}) {
  useEffect(() => {
    const detectClick = (e) => {
      const { exclude } = opts
      if (!opts.ref || opts.ref.current.contains(e.target)) return
      if (exclude && exclude.some((n) => n && e.target && n.contains(e.target))) return
      opts.handler(e)
    }

    const { events } = { events: ["click"], ...opts }

    events.forEach((evt) => document.addEventListener(evt, detectClick))
    return () => {
      events.forEach((evt) => document.removeEventListener(evt, detectClick))
    }
  }, [opts])
}
