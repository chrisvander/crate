import { useState } from "preact/hooks"

export function usePreference<T extends string>(key: string, options: readonly T[], fallback: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      return options.find((value) => value === localStorage.getItem(key)) ?? fallback
    } catch {
      return fallback
    }
  })
  const update = (next: T) => {
    setValue(next)
    try {
      localStorage.setItem(key, next)
    } catch {
      /* Preferences remain usable without storage. */
    }
  }
  return [value, update] as const
}
