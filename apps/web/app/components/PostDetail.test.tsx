import { screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { renderWithMantine } from "../../test/render"
import { Post } from "../lib/posts"
import PostDetail from "./PostDetail"

const post: Post = {
    id: "p1",
    title: "Caching & embeddings",
    date: "2026-10-17",
    tags: ["rag", "c++"],
    createdAt: "2026-10-17T09:00:00Z",
}

describe("PostDetail", () => {
    it("renders the title, long date and a back link", () => {
        renderWithMantine(<PostDetail post={post} />)
        expect(screen.getByRole("heading", { level: 1, name: post.title })).toBeInTheDocument()
        expect(screen.getByText("October 17, 2026")).toBeInTheDocument()
        expect(screen.getByRole("link", { name: "← devlog" })).toHaveAttribute("href", "/")
    })

    it("links each tag to the filtered list with the tag encoded", () => {
        renderWithMantine(<PostDetail post={post} />)
        expect(screen.getByRole("link", { name: "rag" })).toHaveAttribute("href", "/?tags=rag")
        expect(screen.getByRole("link", { name: "c++" })).toHaveAttribute("href", "/?tags=c%2B%2B")
    })
})
