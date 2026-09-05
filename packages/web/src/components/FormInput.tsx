import type { JSX } from "preact"

export default function FormInput(props: JSX.IntrinsicElements["input"]) {
  return (
    <input
      className="
        form-control
        block
        w-full
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
        dark:focus:text-neutral-50 
        dark:focus:bg-stone-700
        focus:text-stone-700 focus:bg-white 
        focus:border-blue-600 focus:outline-none placeholder:text-stone-400
      "
      {...props}
    />
  )
}
