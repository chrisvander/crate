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
  await nameAction(page, "New folder", folder)
  await page.getByTitle(`Open folder ${folder}`, { exact: true }).click()

  await nameAction(page, "New file", "empty.txt")
  await page.getByLabel("Select empty.txt", { exact: true }).check()
  expect(await download(page)).toEqual(Buffer.alloc(0))
  await page.getByLabel("Select empty.txt", { exact: true }).uncheck()

  const original = Buffer.from("Crate private PDS browser verification: original\n")
  await page.getByLabel("Upload files", { exact: true }).setInputFiles({
    name: "sample.txt",
    mimeType: "text/plain",
    buffer: original,
  })
  await page.getByLabel("Select sample.txt", { exact: true }).check()
  expect(await download(page)).toEqual(original)
  const inspector = page.getByRole("complementary")
  const identity = await inspector.locator("dd.record-uri").first().innerText()

  await nameAction(page, "Rename", "renamed.txt")
  await expect(inspector.getByRole("heading", { name: "renamed.txt", exact: true })).toBeVisible()
  await expect(inspector.locator("dd.record-uri").first()).toHaveText(identity)

  const revision = inspector.locator("dd.record-uri").last()
  const originalRevision = await revision.innerText()
  const replacement = Buffer.from("Crate private PDS browser verification: replacement\n")
  await page.getByLabel("Replace contents of renamed.txt", { exact: true }).setInputFiles({
    name: "replacement.txt",
    mimeType: "text/plain",
    buffer: replacement,
  })
  await expect(revision).not.toHaveText(originalRevision)
  await expect(page.getByText("Saving to your PDS…", { exact: true })).toBeHidden()
  expect(await download(page)).toEqual(replacement)
  await page.getByRole("button", { name: "Version history", exact: true }).click()
  const restore = page.getByRole("button", { name: "Restore version", exact: true }).first()
  await expect(restore).toBeVisible()
  const replacementRevision = await revision.innerText()
  page.once("dialog", (dialog) => dialog.accept())
  await restore.click()
  await expect(revision).not.toHaveText(replacementRevision)
  await expect(page.getByText("Saving to your PDS…", { exact: true })).toBeHidden()
  expect(await download(page)).toEqual(original)
  await expect(inspector.locator("dd.record-uri").first()).toHaveText(identity)

  await nameAction(page, "Duplicate", copy)
  await page.getByLabel("Select renamed.txt", { exact: true }).uncheck()
  await page.getByLabel(`Select ${copy}`, { exact: true }).check()
  expect(await download(page)).toEqual(original)
  page.once("dialog", (dialog) => dialog.accept())
  await page.getByRole("button", { name: "Move to trash", exact: true }).click()
  await expect(page.getByLabel(`Select ${copy}`, { exact: true })).toHaveCount(0)

  await page.getByRole("button", { name: "View trash", exact: true }).click()
  await page.getByLabel(`Select ${copy}`, { exact: true }).check()
  await page.getByRole("button", { name: "Restore", exact: true }).click()
  await expect(page.getByLabel(`Select ${copy}`, { exact: true })).toHaveCount(0)
  await page.getByRole("button", { name: "Back to files", exact: true }).click()
  await expect(page.getByLabel(`Select ${copy}`, { exact: true })).toBeVisible()

  await page.getByRole("button", { name: "Grid view", exact: true }).click()
  await expect(page.getByRole("list", { name: "Files", exact: true })).toHaveClass(/grid/)
  await page.getByLabel("Search files", { exact: true }).fill("renamed.txt")
  await expect(page.getByLabel("Select renamed.txt", { exact: true })).toBeVisible()
  await expect(page.getByLabel(`Select ${copy}`, { exact: true })).toHaveCount(0)

  await page.reload()
  await page.getByTitle(`Open folder ${folder}`, { exact: true }).click()
  await expect(page.getByLabel("Select empty.txt", { exact: true })).toBeVisible()
  await expect(page.getByLabel("Select renamed.txt", { exact: true })).toBeVisible()
  await expect(page.getByLabel(`Select ${copy}`, { exact: true })).toBeVisible()
  await expect(page.getByRole("alert")).toHaveCount(0)
  console.log(`Verified private PDS lifecycle; retained only new test data in ${folder}`)
})

async function nameAction(page: Page, button: string, name: string) {
  await page.getByRole("button", { name: button, exact: true }).click()
  const dialog = page.getByRole("dialog")
  await dialog.getByLabel("Name", { exact: true }).fill(name)
  await dialog.getByRole("button", { name: "Save", exact: true }).click()
  await expect(dialog).toHaveCount(0)
}

async function download(page: Page) {
  const pending = page.waitForEvent("download")
  await page.getByRole("link", { name: "Download", exact: true }).click()
  const result = await pending
  expect(await result.failure()).toBeNull()
  const stream = await result.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks)
}
