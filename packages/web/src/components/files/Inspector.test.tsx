// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/preact"
import { afterEach, expect, it } from "vitest"
import { file } from "../../test/fixtures"
import { FileInspector } from "./FileInspector"
afterEach(cleanup)
it("shows original metadata and falls back to the current directory", () => {
  const { rerender } = render(
    <FileInspector selection={[file({ name: "report.pdf" })]} path="Documents" close={() => {}} />,
  )
  expect(screen.getByText("Documents/report.pdf")).toBeTruthy()
  expect(screen.getByText("pdf")).toBeTruthy()
  expect(screen.queryByText("Version history")).toBeNull()
  rerender(
    <FileInspector
      selection={[]}
      directory={file({ name: "Documents", kind: "directory" })}
      path="Documents"
      close={() => {}}
    />,
  )
  expect(screen.queryByText("No files are selected.")).toBeNull()
  expect(screen.getAllByText("Documents")).toHaveLength(2)
})
it("pages through selected files", () => {
  const { container } = render(
    <FileInspector
      selection={[file({ name: "one.txt" }), file({ name: "two.txt" })]}
      close={() => {}}
    />,
  )
  fireEvent.click(container.querySelectorAll("button")[2]!)
  expect(screen.getAllByText("two.txt")).toHaveLength(2)
  expect(screen.getByText("2 / 2")).toBeTruthy()
})
