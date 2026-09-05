import { fileItem } from "./fixtures"
import { expect, test } from "@playwright/test"
import { account, mockAccount } from "./fixtures"

test.use({ viewport: { width: 1440, height: 1000 }, colorScheme: "light" })

test("login preserves the original card, header, and footer geometry", async ({ page }) => {
  await mockAccount(page, false)
  await page.goto("/login")
  await expect(page.getByLabel("ATProto handle")).toBeVisible()
  await expect(
    page.getByText("Copyright © 2022 Crate Network, LLC. All rights reserved."),
  ).toBeVisible()
  await expect(page.getByRole("link", { name: "Terms of Use" })).toHaveAttribute(
    "href",
    "/terms-of-use",
  )
  await expect(page.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute(
    "href",
    "/privacy-policy",
  )
  await page.evaluate(() => document.fonts.ready)
  const card = await page.locator(".login-box").boundingBox()
  expect(card?.width).toBeCloseTo(384, 0)
  expect(card?.x).toBeCloseTo(528, 0)
  expect(card?.y).toBeCloseTo(240, 0)
  await expect(page.locator(".brand img")).toHaveCSS("width", "64px")
  await expect(page.locator(".page-shell > div").last()).toHaveCSS("height", "192px")
  await expect(page.locator("html")).toHaveCSS("background-color", "rgb(255, 237, 213)")

  await page.setViewportSize({ width: 390, height: 844 })
  const narrow = await page.locator(".login-box").boundingBox()
  expect(narrow?.width).toBeCloseTo(294, 0)
  expect(narrow?.x).toBeCloseTo(48, 0)
  await expect(page.locator(".brand img")).toHaveCSS("width", "40px")
  await expect(page.locator(".brand span")).toBeHidden()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
})

test("the restored list and grid keep names, selection, and the 320px inspector", async ({
  page,
}) => {
  await mockAccount(page)
  await page.goto("/files")
  await expect(page.getByRole("columnheader", { name: "File Name", exact: true })).toBeVisible()
  await expect(page.getByRole("columnheader", { name: "Date", exact: true })).toBeVisible()
  await expect(page.getByRole("columnheader", { name: "Size", exact: true })).toBeVisible()
  await expect(page.locator(".file-table tbody tr").first()).toHaveCSS("border-bottom-width", "1px")
  await fileItem(page, "Readme.txt").click()
  await fileItem(page, "Readme.txt").click({ button: "right" })
  await page.locator(".popover-menu").getByText("Inspect", { exact: true }).click()
  await expect(page.getByRole("complementary")).toBeVisible()
  await expect(page.getByRole("complementary")).toHaveCSS("width", "320px")
  await expect(page.getByRole("complementary")).toContainText("Readme.txt")
  await page.getByRole("button", { name: "Grid view", exact: true }).click()
  await expect(fileItem(page, "Readme.txt").locator(".file-label")).toHaveClass(/bg-orange-500/)
  await expect(page.getByText("Readme.txt", { exact: true }).first()).toBeVisible()
  await expect(fileItem(page, "Vacation.jpg")).toBeVisible()
  await page.getByLabel("Search files", { exact: true }).fill("Vacation.jpg")
  await expect(fileItem(page, "Readme.txt")).toHaveCount(0)
  await expect(fileItem(page, "Vacation.jpg")).toBeVisible()
})

test("the original landing frame retains an account-aware navigation header", async ({ page }) => {
  await mockAccount(page)
  await page.goto("/")
  const navigation = page.getByRole("navigation", { name: "Global", exact: true })
  await expect(navigation.getByRole("link", { name: "Files", exact: true })).toBeVisible()
  await expect(navigation.getByRole("link", { name: "Settings", exact: true })).toBeVisible()
  await expect(page.locator(".hero-frame")).toHaveCSS("border-radius", "50px")
  const frame = await page.locator(".hero-frame").boundingBox()
  expect(frame?.x).toBeCloseTo(64, 0)
  expect(frame?.y).toBeCloseTo(160, 0)
  expect(frame?.width).toBeCloseTo(1312, 0)
})

test("file layouts remain usable without restoring the old mobile overflow", async ({ page }) => {
  await mockAccount(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/files")
  await expect(fileItem(page, "Readme.txt")).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
  await page.getByRole("button", { name: "Grid view", exact: true }).click()
  await expect(fileItem(page, "Vacation.jpg")).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
})

test("the restored account shell shows PDS identity and supports logout", async ({ page }) => {
  await mockAccount(page)
  await page.goto("/settings")
  await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible()
  await expect(page.getByLabel("Handle", { exact: true })).toHaveValue(account.user.handle)
  await expect(page.getByLabel("Account DID", { exact: true })).toHaveValue(account.user.did)
  await expect(page.getByLabel("Private Space", { exact: true })).toHaveValue(account.space.uri)
  await expect(page.locator(".settings-sidebar")).toBeVisible()
  await page.getByRole("button", { name: "Log out", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Log in", exact: true })).toBeVisible()
  await expect(page.getByLabel("ATProto handle")).toBeVisible()
})
