import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { currentSearch, replace, setUrl } from "../../test/next-navigation"
import useBlogFilters from "./useBlogFilters"

function renderFilters(href = "/") {
    setUrl(href)
    return renderHook(() => useBlogFilters())
}

describe("useBlogFilters", () => {
    it("defaults to empty filters", () => {
        const { result } = renderFilters()
        expect(result.current).toMatchObject({ q: "", tags: [], from: "", to: "", isActive: false })
    })

    it("parses filters from the URL and drops empty tags", () => {
        const { result } = renderFilters("/?q=rag&tags=a,,b&from=2026-01-01&to=2026-02-01")
        expect(result.current).toMatchObject({
            q: "rag",
            tags: ["a", "b"],
            from: "2026-01-01",
            to: "2026-02-01",
            isActive: true,
        })
    })

    it.each(["/?q=x", "/?tags=x", "/?from=2026-01-01", "/?to=2026-01-01"])("is active for %s", (href) => {
        expect(renderFilters(href).result.current.isActive).toBe(true)
    })

    it("replaces the URL without scrolling and omits empty params", () => {
        const { result } = renderFilters()
        act(() => result.current.setQ("hello world"))
        expect(replace).toHaveBeenCalledWith("/?q=hello+world", { scroll: false })
    })

    it("falls back to the bare pathname when everything is cleared", () => {
        const { result } = renderFilters("/?q=x&tags=a&from=2026-01-01")
        act(() => result.current.clearAll())
        expect(replace).toHaveBeenLastCalledWith("/", { scroll: false })
    })

    it("toggles tags on and off", () => {
        const { result } = renderFilters("/?tags=a")
        act(() => result.current.toggleTag("b"))
        expect(result.current.tags).toEqual(["a", "b"])
        act(() => result.current.toggleTag("a"))
        expect(result.current.tags).toEqual(["b"])
    })

    it("addTag ignores a tag that is already selected", () => {
        const { result } = renderFilters("/?tags=a")
        act(() => result.current.addTag("a"))
        expect(replace).not.toHaveBeenCalled()
        act(() => result.current.addTag("b"))
        expect(result.current.tags).toEqual(["a", "b"])
    })

    it("setRange and clearDate keep the other filters", () => {
        const { result } = renderFilters("/?q=x&tags=a")
        act(() => result.current.setRange("2026-01-01", "2026-02-01"))
        expect(currentSearch()).toBe("?q=x&tags=a&from=2026-01-01&to=2026-02-01")
        act(() => result.current.clearDate())
        expect(currentSearch()).toBe("?q=x&tags=a")
    })
})
