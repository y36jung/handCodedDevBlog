import { expect, test } from "@playwright/test"
import { countMatching, posts } from "./posts"

const post = posts.find((p) => p.title === "Unit testing chunkers")!

test("open a post, follow a tag back to the list, and return home", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("link", { name: new RegExp(post.title) }).click()
    await expect(page).toHaveURL(`/posts/${post.id}`)
    await expect(page.getByRole("heading", { level: 1, name: post.title })).toBeVisible()

    await page.getByRole("link", { name: "testing", exact: true }).click()
    await expect(page).toHaveURL("/?tags=testing")
    await expect(page.getByText(`${countMatching((p) => p.tags.includes("testing"))} posts match`)).toBeVisible()

    await page.goto(`/posts/${post.id}`)
    await page.getByRole("link", { name: "← devlog" }).click()
    await expect(page).toHaveURL("/")
    await expect(page.getByText(`${posts.length} posts`)).toBeVisible()
})

test("an unknown post id returns a 404 page", async ({ page }) => {
    const response = await page.goto("/posts/does-not-exist")
    expect(response?.status()).toBe(404)
    await expect(page.getByText("This page could not be found.")).toBeVisible()
})
