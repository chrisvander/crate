import { fileItem } from "./fixtures"
import { expect, test } from "@playwright/test"
import { mockAccount } from "./fixtures"

test("Tailwind retains dark form colors and disabled primary controls", async ({ page }) => {
  await mockAccount(page, false)
  await page.emulateMedia({ colorScheme: "dark" })
  await page.goto("/login")
  const handle = page.getByLabel("ATProto handle")
  const submit = page.getByRole("button", { name: "Continue with ATProto" })
  await expect(handle).toBeVisible()
  await expect(page.locator("html")).toHaveCSS("background-color", "rgb(28, 25, 23)")
  await expect(handle).toHaveCSS("background-color", "rgb(87, 83, 78)")
  await expect(handle).toHaveCSS("color", "rgb(250, 250, 250)")
  await expect(submit).toBeDisabled()
  await expect(submit).toHaveCSS("background-color", "rgb(38, 38, 38)")
  await expect(submit).toHaveCSS("color", "rgb(82, 82, 82)")
  await handle.fill("alice.example.com")
  await expect(submit).toBeEnabled()
  await expect(submit).toHaveCSS("background-color", "rgb(249, 115, 22)")
  await expect(handle).toHaveCSS("border-top-color", "rgb(37, 99, 235)")
})

test("The original portal popover preserves centering and Cancel dismissal", async ({ page }) => {
  await mockAccount(page)
  await page.goto("/files")
  await expect(fileItem(page, "Readme.txt")).toBeVisible()
  for (const [width, dialogWidth] of [
    [1440, 384],
    [390, 358],
  ]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.getByLabel("Add files", { exact: true }).click()
    await page.locator(".popover-menu").getByText("New Folder", { exact: true }).click()
    const dialog = page.locator(".popover")
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveCSS("opacity", "1")
    await expect(dialog).toHaveCSS("scale", "1")
    const bounds = await dialog.boundingBox()
    expect(bounds?.width).toBeCloseTo(dialogWidth, 0)
    expect(bounds!.x + bounds!.width / 2).toBeCloseTo(width / 2, 0)
    expect(bounds!.y + bounds!.height / 2).toBeCloseTo(500, 0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
    await expect(dialog.getByPlaceholder("folder name")).toBeVisible()
    if (width === 1440) await page.keyboard.press("Escape")
    else await dialog.getByRole("button", { name: "Cancel", exact: true }).click()
    await expect(dialog).toHaveCount(0)
  }
})
