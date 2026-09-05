import { fileItem } from "./fixtures"
import { expect as baseExpect, test, type Page } from "@playwright/test"
import { waitForManualSignIn } from "./manual-login"

const expect = baseExpect.configure({ timeout: 30_000 })

test.use({ trace: "off", screenshot: "off", video: "off" })

test("user-authorized private PDS file lifecycle", async ({ page, baseURL }) => {
  test.skip(process.env.CRATE_LIVE_PDS !== "1", "Requires the user's interactive PDS sign-in")
  test.setTimeout(15 * 60_000)
  await page.goto("/login")
  console.log("Please sign in in the browser window; credentials are not recorded.")
  const outcome = await waitForManualSignIn(page, new URL(baseURL!).origin, 10 * 60_000)
  test.skip(
    outcome.status === "timeout",
    "Manual sign-in was not completed; no file operations ran",
  )
  if (outcome.status === "rejected") throw new Error(outcome.message)
  await expect(page.getByRole("heading", { name: "Files", exact: true })).toBeVisible()
  await expect(page.getByText("Loading files…", { exact: true })).toBeHidden()
  await expect(page.getByRole("alert")).toHaveCount(0)

  const folder = `Crate verification ${new Date().toISOString().replaceAll(":", "-")}`
  const copy = `verification-copy-${crypto.randomUUID()}.txt`
  console.log(`Creating isolated verification folder: ${folder}`)
  await nameAction(page, "New Folder", folder)
  await fileItem(page, folder).dblclick()

  await nameAction(page, "New File", "empty.txt")
  await fileItem(page, "empty.txt").click()
  expect(await download(page)).toEqual(Buffer.alloc(0))
  await fileItem(page, "empty.txt").click({ modifiers: ["Meta"] })

  const original = Buffer.from("Crate private PDS browser verification: original\n")
  await page.getByLabel("Add files", { exact: true }).click()
  await page.getByLabel("Upload files", { exact: true }).setInputFiles({
    name: "sample.txt",
    mimeType: "text/plain",
    buffer: original,
  })
  await fileItem(page, "sample.txt").click()
  expect(await download(page)).toEqual(original)
  await nameAction(page, "Rename", "renamed.txt")
  await expect(fileItem(page, "renamed.txt")).toBeVisible()
  expect(await download(page)).toEqual(original)

  await fileAction(page, "Duplicate")
  await fileItem(page, "Copy of renamed.txt").click()
  await nameAction(page, "Rename", copy)
  await fileItem(page, copy).click()
  expect(await download(page)).toEqual(original)
  page.once("dialog", (dialog) => dialog.accept())
  await fileAction(page, "Delete")
  await expect(fileItem(page, copy)).toHaveCount(0)

  await page.getByRole("button", { name: "Grid view", exact: true }).click()
  await expect(page.locator(".file-grid")).toBeVisible()
  await page.getByLabel("Search files", { exact: true }).fill("renamed.txt")
  await expect(fileItem(page, "renamed.txt")).toBeVisible()
  await expect(fileItem(page, copy)).toHaveCount(0)

  await page.reload()
  await fileItem(page, folder).dblclick()
  await expect(fileItem(page, "empty.txt")).toBeVisible()
  await expect(fileItem(page, "renamed.txt")).toBeVisible()
  await expect(fileItem(page, copy)).toHaveCount(0)
  await expect(page.getByRole("alert")).toHaveCount(0)
  console.log(`Verified private PDS lifecycle; retained only new test data in ${folder}`)
})

async function nameAction(page: Page, button: string, name: string) {
  if (button === "New Folder" || button === "New File") {
    await page.getByLabel("Add files", { exact: true }).click()
    await page.locator(".popover-menu").getByText(button, { exact: true }).click()
  } else await fileAction(page, button)
  const dialog = page.locator(".popover")
  await dialog.locator("input").fill(name)
  await dialog.getByRole("button", { name: "Done", exact: true }).click()
  await expect(dialog).toHaveCount(0)
}

async function fileAction(page: Page, name: string) {
  await page
    .locator(".file-table tbody tr.bg-orange-500, .file-grid .file-label.bg-orange-500")
    .first()
    .click({ button: "right" })
  await page.locator(".popover-menu").getByText(name, { exact: true }).click()
}

async function download(page: Page) {
  const pending = page.waitForEvent("download")
  await fileAction(page, "Download")
  const result = await pending
  expect(await result.failure()).toBeNull()
  const stream = await result.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks)
}
