import { fireEvent, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { currentSearch, replace, setUrl } from "../../test/next-navigation"
import { renderWithMantine } from "../../test/render"
import { posts } from "../lib/posts"
import BlogList from "./BlogList"

describe("BlogList", () => {
    it("lists every post when no filters are set", () => {
        renderWithMantine(<BlogList />)
        expect(screen.getByText(`${posts.length} posts`)).toBeInTheDocument()
        expect(screen.getAllByRole("link")).toHaveLength(posts.length)
    })

    it("uses the singular and 'match' when a filter narrows to one post", () => {
        setUrl("/?q=Unit testing chunkers")
        renderWithMantine(<BlogList />)
        expect(screen.getByText("1 post match")).toBeInTheDocument()
        expect(screen.getByRole("link")).toHaveAttribute("href", `/posts/${posts.find((p) => p.title === "Unit testing chunkers")!.id}`)
    })

    it("shows an empty state that clears all filters", () => {
        setUrl("/?q=zzzz&tags=bugs")
        renderWithMantine(<BlogList />)
        expect(screen.getByText("0 posts match")).toBeInTheDocument()
        fireEvent.click(screen.getByRole("button", { name: "Clear all" }))
        expect(replace).toHaveBeenLastCalledWith("/", { scroll: false })
        expect(screen.getByText(`${posts.length} posts`)).toBeInTheDocument()
    })

    it("adds a clicked tag to the filters without following the post link", () => {
        setUrl("/?q=Unit testing chunkers")
        renderWithMantine(<BlogList />)
        const row = screen.getByRole("link")
        const followed = fireEvent.click(within(row).getByRole("button", { name: "async" }))
        expect(followed).toBe(false)
        expect(currentSearch()).toBe("?q=Unit+testing+chunkers&tags=async")
    })
})
