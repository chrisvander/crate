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
    fireEvent.click(screen.getByRole("checkbox", { name: "Select Documents" }))
    expect(onSelect).toHaveBeenCalledWith("folder", true)
    fireEvent.click(screen.getByRole("button", { name: /Documents/ }))
    expect(onOpen).toHaveBeenCalledWith(folder)
  })
  it("shows the complete filename and honors externally changed selection", () => {
    const entry = file({ name: "report.final.pdf" })
    const props = { files: [entry], view, pending: false, onSelect: vi.fn(), onOpen: vi.fn() }
    const { rerender } = render(<FileList {...props} selected={[]} />)
    expect(screen.getByText("report.final.pdf")).toBeTruthy()
    rerender(<FileList {...props} selected={[entry.id]} />)
    expect(screen.getByRole("checkbox", { checked: true })).toBeTruthy()
  })
})
