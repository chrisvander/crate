import { Icon as FontAwesomeIcon } from "../Icon"
import { faCopy } from "@fortawesome/free-solid-svg-icons"
import type { FileEntry } from "../../lib/api"
import formatFileSize from "../../utils/formatFileSize"

export type InspectorFile = Pick<FileEntry, "name" | "size"> & { revision?: string }
export type FileInspectorBodyProps = { file: InspectorFile; path?: string }
export function FileInspectorFileBody({ file, path = "" }: FileInspectorBodyProps) {
  const { name, revision: cid } = file
  const rows: [string, string, string?, boolean?][] = []
  if (name) rows.push(["Name", name])
  rows.push(["Path", [path, name].filter(Boolean).join("/")])
  if (file.size) rows.push(["Size", formatFileSize(file.size)])
  if (name && name.includes(".")) rows.push(["Extension", name.split(".", 2)[1]])
  if (cid) rows.push(["CID", cid, "text-xs font-mono break-all", true])

  return (
    <div className="p-2 text-sm">
      <table className="w-full table-fixed">
        <tbody>
          {rows.map(([title, value, classes, copy]) => (
            <tr key={title}>
              <td className="font-semibold text-gray-600 dark:text-gray-300 text-right pr-4 align-top w-20">
                {title}
              </td>
              <td className={`break-all w-full ${typeof classes === "string" ? classes : ""}`}>
                {value}{" "}
                {copy && (
                  <span
                    className="rounded-sm p-0.5 hover:bg-neutral-300 active:bg-neutral-400 dark:hover:bg-neutral-600 dark:active:bg-neutral-700 transition-all dark:text-white cursor-pointer"
                    onClick={() => {
                      navigator.clipboard.writeText(value)
                    }}
                  >
                    <FontAwesomeIcon icon={faCopy} />
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
