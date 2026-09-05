// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/preact"
import { afterEach, describe, expect, it, vi } from "vitest"
import { file } from "../../test/fixtures"
import { FileList } from "./FileList"

afterEach(cleanup)
describe.each(["list", "grid"] as const)("%s file view", (view) => {
  it("selects the clicked record and opens the same folder in either presentation", () => {
    const folder = file({ id: "folder", name: "Documents", kind: "directory" })
    const onSelect = vi.fn()
    const onOpen = vi.fn()
    render(
      <FileList
        files={[folder]}
        selected={[]}
        view={view}
        pending={false}
        onSelect={onSelect}
        onOpen={onOpen}
      />,
    )
    fireEvent.click(screen.getByText("Documents"))
    expect(onSelect).toHaveBeenCalledWith("folder", true, false)
    fireEvent.dblClick(screen.getByText("Documents"))
    expect(onOpen).toHaveBeenCalledWith(folder)
  })
  it("preserves the original filename presentation and selection styling", () => {
    const entry = file({ name: "report.final.pdf" })
    const props = { files: [entry], view, pending: false, onSelect: vi.fn(), onOpen: vi.fn() }
    const { rerender } = render(<FileList {...props} selected={[]} />)
    expect(screen.getByText(view === "grid" ? "report" : "report.final.pdf")).toBeTruthy()
    rerender(<FileList {...props} selected={[entry.id]} />)
    expect(
      screen
        .getByText(view === "grid" ? "report" : "report.final.pdf")
        .closest(view === "grid" ? "span" : "tr")?.className,
    ).toContain("bg-orange-500")
  })
  it("opens the record on double-click without changing the selected record", () => {
    const entry = file()
    const onSelect = vi.fn()
    const onOpen = vi.fn()
    render(
      <FileList
        files={[entry]}
        selected={[]}
        view={view}
        pending={false}
        onSelect={onSelect}
        onOpen={onOpen}
      />,
    )
    fireEvent.dblClick(screen.getByText(view === "grid" ? entry.name.split(".")[0] : entry.name))
    expect(onOpen).toHaveBeenCalledWith(entry)
    expect(onSelect).not.toHaveBeenCalled()
  })
})
