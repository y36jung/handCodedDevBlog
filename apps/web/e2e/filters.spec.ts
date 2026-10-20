import { expect, test } from "@playwright/test"
import { countMatching, posts } from "./posts"

test("search narrows the list, highlights matches and survives a reload", async ({ page }) => {
    const expected = countMatching((p) => p.title.toLowerCase().includes("chunk"))
    await page.goto("/")
    await expect(page.getByText(`${posts.length} posts`)).toBeVisible()

    await page.getByPlaceholder("Search posts by title").fill("chunk")
    await expect(page).toHaveURL(/\?q=chunk$/)
    await expect(page.getByText(`${expected} posts match`)).toBeVisible()
    await expect(page.locator("mark").first()).toHaveText(/chunk/i)

    await page.reload()
    await expect(page.getByPlaceholder("Search posts by title")).toHaveValue("chunk")
    await expect(page.getByText(`${expected} posts match`)).toBeVisible()
})

test("tag and date filters show chips that 'Clear all' removes", async ({ page }) => {
    await page.goto("/")

    await page.getByRole("button", { name: /^Tags/ }).click()
    // The checkbox is controlled by the URL, which updates asynchronously, so click and then assert
    await page.getByRole("checkbox", { name: "testing" }).click()
    await expect(page).toHaveURL(/tags=testing/)
    await expect(page.getByRole("checkbox", { name: "testing" })).toBeChecked()
    await expect(page.getByText(`${countMatching((p) => p.tags.includes("testing"))} posts match`)).toBeVisible()
    await page.keyboard.press("Escape")

    await page.getByRole("button", { name: /^Date/ }).click()
    await page.getByRole("button", { name: "Last year" }).click()
    await expect(page).toHaveURL(/from=\d{4}-\d{2}-\d{2}&to=\d{4}-\d{2}-\d{2}/)
    await expect(page.getByRole("button", { name: /Date · set/ })).toBeVisible()
    await page.keyboard.press("Escape")

    await page.getByRole("button", { name: "Clear all" }).first().click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText(`${posts.length} posts`)).toBeVisible()
})

test("a deep link renders the filtered state on first load", async ({ page }) => {
    const expected = countMatching((p) => p.title.toLowerCase().includes("test") && p.tags.includes("testing"))
    await page.goto("/?q=test&tags=testing")
    await expect(page.getByPlaceholder("Search posts by title")).toHaveValue("test")
    await expect(page.getByText(`${expected} ${expected === 1 ? "post" : "posts"} match`)).toBeVisible()
    await expect(page.getByRole("button", { name: /Tags · 1/ })).toBeVisible()
})
