import { describe, expect, it, vi } from "vitest"
import { filterPosts, formatDate, getPost, Post, tagCounts } from "./posts"

const fixture = vi.hoisted<Post[]>(() => [
    { id: "a", title: "Debugging Async Bugs", date: "2026-10-10", tags: ["async", "bugs"], createdAt: "2026-10-10T09:00:00Z" },
    { id: "b", title: "Testing chunkers", date: "2026-10-14", tags: ["testing", "bugs"], createdAt: "2026-10-14T09:00:00Z" },
    { id: "c", title: "Design notes", date: "2026-09-01", tags: ["design"], createdAt: "2026-09-01T09:00:00Z" },
    { id: "d", title: "Async generators", date: "2026-10-12", tags: ["async"], createdAt: "2026-10-12T09:00:00Z" },
])

vi.mock("../data/mock-posts.json", () => ({ default: fixture }))

const none = { q: "", tags: [], from: "", to: "" }
const ids = (list: Post[]) => list.map((p) => p.id)

describe("filterPosts", () => {
    it("returns every post newest first when no filters are set", () => {
        expect(ids(filterPosts(fixture, none))).toEqual(["b", "d", "a", "c"])
    })

    it("matches the title case-insensitively", () => {
        expect(ids(filterPosts(fixture, { ...none, q: "ASYNC" }))).toEqual(["d", "a"])
    })

    it("does not match the query against tags", () => {
        expect(filterPosts(fixture, { ...none, q: "bugs" }).map((p) => p.id)).toEqual(["a"])
    })

    it("requires every selected tag", () => {
        expect(ids(filterPosts(fixture, { ...none, tags: ["async"] }))).toEqual(["d", "a"])
        expect(ids(filterPosts(fixture, { ...none, tags: ["async", "bugs"] }))).toEqual(["a"])
    })

    it("treats from and to as inclusive bounds", () => {
        expect(ids(filterPosts(fixture, { ...none, from: "2026-10-12" }))).toEqual(["b", "d"])
        expect(ids(filterPosts(fixture, { ...none, to: "2026-10-10" }))).toEqual(["a", "c"])
        expect(ids(filterPosts(fixture, { ...none, from: "2026-10-10", to: "2026-10-12" }))).toEqual(["d", "a"])
    })

    it("returns nothing when from is after to", () => {
        expect(filterPosts(fixture, { ...none, from: "2026-10-14", to: "2026-10-01" })).toEqual([])
    })

    it("combines all filters", () => {
        const result = filterPosts(fixture, { q: "bug", tags: ["async"], from: "2026-10-01", to: "2026-10-31" })
        expect(ids(result)).toEqual(["a"])
    })

    it("does not mutate the input list", () => {
        const list = [...fixture]
        filterPosts(list, none)
        expect(ids(list)).toEqual(["a", "b", "c", "d"])
    })
})

describe("tagCounts", () => {
    it("counts tags, sorted by count then alphabetically", () => {
        expect(tagCounts()).toEqual([
            { tag: "async", count: 2 },
            { tag: "bugs", count: 2 },
            { tag: "design", count: 1 },
            { tag: "testing", count: 1 },
        ])
    })
})

describe("getPost", () => {
    it("finds a post by id", () => {
        expect(getPost("c")?.title).toBe("Design notes")
    })

    it("returns undefined for an unknown id", () => {
        expect(getPost("missing")).toBeUndefined()
    })
})

describe("formatDate", () => {
    it("formats short and long dates", () => {
        expect(formatDate("2026-10-17")).toBe("Oct 17")
        expect(formatDate("2026-10-17", true)).toBe("October 17, 2026")
    })
})
