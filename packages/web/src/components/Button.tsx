import type { JSX } from "preact"

export default function Button(props: JSX.IntrinsicElements["button"]) {
  const { className, children, ...rest } = props
  return (
    <button
      className={`
        bg-orange-500 
        bg-clip-padding
        px-3
        py-1.5
        text-white
        font-normal
        rounded
        transition
        focus:text-stone-700 
        focus:bg-white 
        focus:border-blue-600 
        focus:outline-none 
        disabled:bg-stone-300
        dark:disabled:bg-stone-800
        disabled:text-neutral-400
        dark:disabled:text-neutral-600
        hover:shadow-md
        disabled:hover:shadow-none
        ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
