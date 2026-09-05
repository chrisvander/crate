import { useEffect, useState } from "preact/hooks"
import { validName } from "../../lib/files"
import FormInput from "../FormInput"
import { Popover, PopoverButtonRow } from "../Popover"

type Props = {
  title: string
  initial?: string
  pending: boolean
  error?: string
  onSave: (name: string) => Promise<boolean>
  onClose: () => void
}
export function NameDialog({ title, initial = "", pending, error, onSave, onClose }: Props) {
  const [name, setName] = useState(initial)
  const save = async () => {
    if (!pending && validName(name) && (await onSave(name))) onClose()
  }
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onClose()
    }
    window.addEventListener("keydown", listener)
    return () => window.removeEventListener("keydown", listener)
  }, [pending, onClose])
  return (
    <Popover>
      <div className="p-2 w-96 max-w-full">
        <h1 className="mb-2 text-xl font-bold">{title}</h1>
        <FormInput
          placeholder={title === "New Folder" ? "folder name" : "file name"}
          value={name}
          disabled={pending}
          onInput={(event) => setName(event.currentTarget.value)}
        />
        {error && <p className="error">{error}</p>}
      </div>
      <PopoverButtonRow
        actions={[
          ["Done", () => void save(), pending || !validName(name)],
          ["Cancel", onClose, pending],
        ]}
      />
    </Popover>
  )
}
