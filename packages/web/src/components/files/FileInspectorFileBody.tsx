import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCopy } from "@fortawesome/free-solid-svg-icons"
import { FileModel } from "@crate/types"
import { useStore as useFVStore } from "../../store/FileViewStore"
import { joinPath, splitPath } from "@crate/utils"
import formatFileSize from "../../utils/formatFileSize"

export function FileInspectorFileBody({ file }: { file: FileModel }) {
  const path = useFVStore((state) => state.path)
  const { name, cid } = file
  const rows: [string, string, string?, boolean?][] = []
  if (name) rows.push(["Name", name])
  rows.push(["Path", joinPath(...splitPath(path), name ? name : "")])
  if (file.size) rows.push(["Size", formatFileSize(file.size)])
  if (file.cumulativeSize) rows.push(["Size", formatFileSize(file.cumulativeSize)])
  if (name && name.includes(".")) rows.push(["Extension", name.split(".", 2)[1]])
  rows.push(["CID", cid, "text-xs font-mono break-all", true])

  return (
    <div className="p-2 text-sm">
      <table className="w-full table-fixed">
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
      </table>
    </div>
  )
}
