import { act, fireEvent, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { replace, setUrl } from "../../test/next-navigation"
import { renderWithMantine } from "../../test/render"
import SearchFilter from "./SearchFilter"

describe("SearchFilter", () => {
    beforeEach(() => { vi.useFakeTimers() })
    afterEach(() => { vi.useRealTimers() })

    it("writes the query to the URL after a 200ms debounce", () => {
        renderWithMantine(<SearchFilter />)
        fireEvent.change(screen.getByPlaceholderText("Search posts by title"), { target: { value: "chunk" } })

        act(() => { vi.advanceTimersByTime(199) })
        expect(replace).not.toHaveBeenCalled()

        act(() => { vi.advanceTimersByTime(1) })
        expect(replace).toHaveBeenCalledWith("/?q=chunk", { scroll: false })
    })

    it("resets the input when the query is cleared elsewhere", () => {
        setUrl("/?q=chunk")
        renderWithMantine(<SearchFilter />)
        const input = screen.getByPlaceholderText("Search posts by title")
        expect(input).toHaveValue("chunk")

        act(() => setUrl("/"))
        expect(input).toHaveValue("")
    })
})
