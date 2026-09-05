import { faGrip, faBars, faAdd } from "@fortawesome/free-solid-svg-icons"
import { useRef } from "preact/hooks"
import { Icon } from "../Icon"
import FormInput from "../FormInput"
import Dropdown from "./Dropdown"
import { sortOptions, type Sort, type View } from "../../lib/files"

type Props = {
  search: string
  sort: Sort
  view: View
  pending: boolean
  onSearch: (value: string) => void
  onSort: (sort: Sort) => void
  onView: (view: View) => void
  onCreate: (kind: "file" | "directory") => void
  onUpload: (files: File[]) => void
}
export function AddBox({
  pending,
  onCreate,
  onUpload,
}: Pick<Props, "pending" | "onCreate" | "onUpload">) {
  const input = useRef<HTMLInputElement>(null)
  return (
    <div className="flex flex-col justify-between">
      <span className="text-sm font-medium text-stone-700 dark:text-stone-400">Add Files</span>
      <Dropdown
        label="Add files"
        disabled={pending}
        display={<Icon icon={faAdd} />}
        options={[
          { name: "New File", onClick: () => onCreate("file") },
          { name: "New Folder", onClick: () => onCreate("directory") },
          "divider",
          { name: "Upload", onClick: () => input.current?.click() },
        ]}
      />
      <input
        ref={input}
        className="hidden"
        type="file"
        multiple
        disabled={pending}
        aria-label="Upload files"
        onChange={(event) => {
          const files = Array.from(event.currentTarget.files ?? [])
          event.currentTarget.value = ""
          if (files.length) onUpload(files)
        }}
      />
    </div>
  )
}
export function SearchBar({ search, onSearch }: Pick<Props, "search" | "onSearch">) {
  return (
    <div className="flex-col justify-between flex-1">
      <label
        htmlFor="search"
        className="hidden text-sm font-medium text-stone-700 dark:text-stone-400 md:block"
      >
        Search
      </label>
      <div className="relative mt-1 rounded-md shadow-sm">
        <FormInput
          type="text"
          name="search"
          id="search"
          placeholder="textfile.txt"
          aria-label="Search files"
          value={search}
          onInput={(event) => onSearch(event.currentTarget.value)}
        />
        <div className="absolute inset-y-0 right-0 flex items-center">
          <button
            className="flex items-center h-full px-6 text-xs font-medium leading-tight text-white uppercase bg-orange-500 rounded-sm shadow-md btn hover:bg-orange-600 hover:shadow-lg focus:bg-orange-600 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-orange-700 active:shadow-lg transition duration-150 ease-in-out"
            type="button"
            id="search-button"
          >
            <svg
              aria-hidden="true"
              focusable="false"
              data-prefix="fas"
              data-icon="search"
              className="w-4"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
            >
              <path
                fill="currentColor"
                d="M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export function ViewBar({ view, onView }: Pick<Props, "view" | "onView">) {
  return (
    <div className="flex flex-col justify-between">
      <span className="text-sm font-medium text-stone-700 dark:text-stone-400">View Mode</span>
      <div className="inline-flex overflow-hidden rounded-sm shadow-sm">
        {(["grid", "list"] as const).map((item) => (
          <button
            key={item}
            aria-label={item === "grid" ? "Grid view" : "List view"}
            aria-pressed={item === view}
            onClick={() => onView(item)}
            className={`${item === view ? "bg-neutral-300 dark:bg-neutral-600" : "bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"} rounded-none px-4 py-2 text-neutral-800 dark:text-neutral-200`}
          >
            <Icon icon={item === "grid" ? faGrip : faBars} />
          </button>
        ))}
      </div>
    </div>
  )
}
export function SortBar({ sort, onSort }: Pick<Props, "sort" | "onSort">) {
  return (
    <div className="flex flex-col justify-between">
      <span className="text-sm font-medium text-stone-700 dark:text-stone-400">Sorting</span>
      <div className="inline-flex overflow-hidden rounded-sm shadow-sm">
        <Dropdown label="Sort files" options={sortOptions} current={sort} setValue={onSort} />
      </div>
    </div>
  )
}
export function Toolbar(props: Props) {
  return (
    <div
      id="file-toolbar"
      className="file-toolbar flex flex-col justify-between md:flex-row md:gap-8 lg:gap-24 2xl:gap-48"
    >
      <SearchBar {...props} />
      <div className="mt-4 flex flex-wrap justify-end gap-4 sm:gap-8 md:mt-0">
        <AddBox {...props} />
        <SortBar {...props} />
        <ViewBar {...props} />
      </div>
    </div>
  )
}
