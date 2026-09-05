import { useCallback, useEffect, useRef, useState } from "preact/hooks"
import { useFiles } from "../../hooks/useFiles"
import { usePreference } from "../../hooks/usePreference"
import { selectedEntries, sortOptions, visibleFiles, type View } from "../../lib/files"
import { actions } from "../../lib/actions"
import { contentUrl, type FileEntry, type Session } from "../../lib/api"
import { FileList } from "./FileList"
import { Toolbar } from "./Toolbar"
import { NameDialog } from "./NameDialog"
import { FileInspector } from "./FileInspector"
import { PopoverMenu, makeOpt } from "./PopoverMenu"
import type Anchor from "../../models/Anchor"
import useClickOutside from "../../hooks/useClickOutside"

type NameAction = { kind: "file" | "directory" } | { kind: "rename"; file: FileEntry }

export function Explorer({ session }: { session: Session }) {
  const [trail, setTrail] = useState<FileEntry[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const [descending, setDescending] = useState(false)
  const [sort, setSort] = usePreference("crate.sort", sortOptions, "Name")
  const [view, setView] = usePreference<View>("crate.view", ["list", "grid"], "list")
  const [dialog, setDialog] = useState<NameAction | null>(null)
  const [inspecting, setInspecting] = useState(false)
  const [context, setContext] = useState<Anchor | null>(null)
  const filesRef = useRef<HTMLDivElement>(null)
  const parentId = trail.at(-1)?.id
  const { query, pending, error, dismissError, execute, refresh } = useFiles(
    session,
    parentId,
    false,
  )
  const busy = pending
  const files = query.data?.files ?? []
  const visible = visibleFiles(files, search, sort, descending)
  const selection = selectedEntries(visible, selected)

  useEffect(() => {
    setSelected([])
    setSearch("")
    setContext(null)
  }, [parentId])

  const onOpen = (file: FileEntry) => {
    if (file.kind === "directory") setTrail([...trail, file])
    else window.open(contentUrl(file.id), "_blank", "noopener")
  }
  const closeContext = useCallback(() => setContext(null), [])
  const deleteSelection = async (files: FileEntry[]) => {
    if (!window.confirm(`Delete ${files.length} selected item(s)?`)) return
    const done = await execute(async (signal) => {
      for (const file of files) await actions.trash(file)(signal)
    })
    if (done) setSelected([])
  }
  const menuActions = (entries: FileEntry[]) => ({
    onOpen: () => entries.forEach(onOpen),
    onDownload: () =>
      entries
        .filter((file) => file.kind === "file")
        .forEach((file) => {
          const link = document.createElement("a")
          link.href = contentUrl(file.id)
          link.download = file.name
          link.click()
        }),
    onDelete: () => void deleteSelection(entries),
    onRenameRequest:
      entries.length === 1 ? () => setDialog({ kind: "rename", file: entries[0]! }) : undefined,
    onDuplicate: () =>
      void execute(async (signal) => {
        for (const file of entries.filter((file) => file.kind === "file"))
          await actions.duplicate(file, `Copy of ${file.name}`)(signal)
      }),
    onInspect: () => setInspecting(true),
    onCopyCID: () =>
      void execute(async () =>
        navigator.clipboard.writeText(entries.map((file) => file.revision).join(",")),
      ),
  })
  useClickOutside({
    ref: filesRef,
    handler: (event) => {
      if (event.ctrlKey || event.metaKey) return
      if (
        event.target instanceof Element &&
        event.target.closest("#file-toolbar, #file-inspector, .popover-menu, .popover")
      )
        return
      setSelected([])
    },
  })

  return (
    <main className="files-main flex flex-col items-start lg:flex-row">
      <div
        ref={filesRef}
        className="files-content w-full min-w-0 flex-1 lg:w-auto"
        onContextMenu={(event) => {
          if (event.target instanceof Element && event.target.closest("input, #file-toolbar"))
            return
          event.preventDefault()
          setContext({ top: event.clientY, left: event.clientX })
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setSelected([])
        }}
      >
        <div className="files-heading relative">
          <h1 className="breadcrumbs flex items-center pr-12 lg:items-end">
            <button
              className="rounded-none p-0 text-left [font:inherit] hover:underline"
              disabled={busy}
              onClick={() => {
                setTrail([])
              }}
            >
              Files
            </button>
            <span className="folder-trail text-sm/[inherit] text-[#404040] wrap-anywhere lg:text-lg/[inherit] dark:text-[#e5e5e5]">
              {trail.map((folder, index) => (
                <span key={folder.id}>
                  <span
                    aria-hidden="true"
                    className="folder-separator mx-3 inline-block font-light text-[#737373]"
                  >
                    &gt;
                  </span>
                  <button
                    className="rounded-none p-0 text-left [font:inherit] hover:underline"
                    disabled={busy}
                    onClick={() => setTrail(trail.slice(0, index + 1))}
                  >
                    {folder.name}
                  </button>
                </span>
              ))}
            </span>
          </h1>
        </div>
        <Toolbar
          search={search}
          onSearch={setSearch}
          sort={sort}
          onSort={setSort}
          view={view}
          onView={setView}
          pending={busy}
          onCreate={(kind) => setDialog({ kind })}
          onUpload={(files) => void execute(actions.upload(files, parentId))}
        />
        {pending && (
          <p className="mt-4" role="status">
            Saving to your PDS…
          </p>
        )}
        {error && (
          <div className="error mt-4 flex flex-wrap items-center gap-3" role="alert">
            <span>{error.message}</span>
            <button onClick={dismissError}>Dismiss</button>
          </div>
        )}
        {query.isError && (
          <div className="error mt-4" role="alert">
            <p>{query.error.message}</p>
            <button onClick={() => void refresh()}>Retry</button>
          </div>
        )}
        {(query.isPending || query.data) && (
          <FileList
            files={visible}
            loading={query.isPending}
            emptyMessage={search ? "No matching files." : undefined}
            selected={selection.map((file) => file.id)}
            view={view}
            pending={busy}
            onSelect={(id, checked, additive) =>
              setSelected(
                additive
                  ? checked
                    ? [...selected.filter((value) => value !== id), id]
                    : selected.filter((value) => value !== id)
                  : [id],
              )
            }
            menuActions={menuActions}
            onDeselect={(ids) =>
              setSelected((current) => current.filter((id) => !ids.includes(id)))
            }
            onRename={(file, name) => execute(actions.rename(file, name))}
            onOpen={onOpen}
          />
        )}
      </div>
      <aside
        id="file-inspector"
        aria-label="Inspector"
        aria-hidden={!inspecting}
        inert={!inspecting}
        className={`inspector-slot shrink-0 overflow-hidden rounded-md bg-white shadow-md transition-all duration-300 dark:bg-neutral-800 lg:sticky lg:top-8 lg:mt-20 lg:ml-8 lg:h-fit ${inspecting ? "mt-6 w-full opacity-100 lg:w-80" : "h-0 w-0 opacity-0"}`}
      >
        <div className="w-80 max-w-full">
          <FileInspector
            selection={selection}
            directory={trail.at(-1) ?? { name: "Root", size: 0 }}
            path={trail.map((folder) => folder.name).join("/")}
            close={() => setInspecting(false)}
          />
        </div>
      </aside>
      {context && (
        <PopoverMenu
          anchor={context}
          close={closeContext}
          opts={[
            makeOpt("New File", closeContext, () => setDialog({ kind: "file" }), false, busy),
            makeOpt(
              "New Folder",
              closeContext,
              () => setDialog({ kind: "directory" }),
              false,
              busy,
            ),
            "divider",
            makeOpt("Refresh", closeContext, () => void refresh(), false, busy),
            makeOpt("Select all", closeContext, () => setSelected(visible.map((file) => file.id))),
            makeOpt("Clear selection", closeContext, () => setSelected([])),
            makeOpt(descending ? "Sort ascending" : "Sort descending", closeContext, () =>
              setDescending(!descending),
            ),
          ]}
        />
      )}
      {dialog && (
        <NameDialog
          pending={busy}
          error={error?.message}
          title={
            dialog.kind === "rename"
              ? "Rename"
              : dialog.kind === "directory"
                ? "New Folder"
                : "New File"
          }
          initial={"file" in dialog ? dialog.file.name : ""}
          onClose={() => setDialog(null)}
          onSave={(name) =>
            execute(
              dialog.kind === "rename"
                ? actions.rename(dialog.file, name)
                : actions.create(name, dialog.kind, parentId),
            )
          }
        />
      )}
    </main>
  )
}
