import { describe, expect, it } from "vitest"
import { notFound } from "../../../test/next-navigation"
import { posts } from "../../lib/posts"
import PostPage from "./page"

describe("PostPage", () => {
    it("calls notFound for an unknown id", async () => {
        await expect(PostPage({ params: Promise.resolve({ id: "does-not-exist" }) })).rejects.toThrow("NEXT_NOT_FOUND")
        expect(notFound).toHaveBeenCalled()
    })

    it("renders PostDetail for a known id", async () => {
        const post = posts[0]
        const element = await PostPage({ params: Promise.resolve({ id: post.id }) })
        expect(element.props.post).toBe(post)
    })
})
