import { useEffect } from "preact/hooks"
import "highlight.js/styles/atom-one-dark.css"

export default function Markdown({ html }) {
  useEffect(() => {
    const fetchAndHighlight = async () => {
      const { default: hljs } = await import("@highlightjs/cdn-assets/highlight.min.js")
      hljs.highlightAll()
    }
    fetchAndHighlight()
  }, [html])

  return (
    <main className="text-contents max-w-screen-2xl" dangerouslySetInnerHTML={{ __html: html }} />
  )
}
