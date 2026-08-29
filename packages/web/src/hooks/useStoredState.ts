import { StateUpdater, useEffect, useState } from "preact/hooks"

export default function useStoredState<T extends string>(defaultValue: T, id: string) {
  const [val, setVal] = useState<T>((localStorage.getItem(id) as T) || defaultValue)

  useEffect(() => {
    localStorage.setItem(id, val)
  }, [id, val])

  return [val, setVal] as [T, StateUpdater<T>]
}
