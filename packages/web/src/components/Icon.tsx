import type { faFile } from "@fortawesome/free-solid-svg-icons"

export function Icon({ icon, className = "" }: { icon: typeof faFile; className?: string }) {
  const [width, height, , , paths] = icon.icon
  return (
    <svg className={`icon ${className}`} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {(Array.isArray(paths) ? paths : [paths]).map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  )
}
