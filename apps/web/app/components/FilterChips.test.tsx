import { fireEvent, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { currentSearch, setUrl } from "../../test/next-navigation"
import { renderWithMantine } from "../../test/render"
import FilterChips from "./FilterChips"

function removeButton(label: string) {
    const pill = screen.getByText(label).closest(".mantine-Pill-root")!
    return pill.querySelector(".mantine-Pill-remove")!
}

describe("FilterChips", () => {
    it("renders nothing without tag or date filters", () => {
        setUrl("/?q=only-search")
        renderWithMantine(<FilterChips />)
        expect(screen.queryByText("Clear all")).not.toBeInTheDocument()
    })

    it("removes a single tag", () => {
        setUrl("/?tags=bugs,rag")
        renderWithMantine(<FilterChips />)
        fireEvent.click(removeButton("bugs"))
        expect(currentSearch()).toBe("?tags=rag")
        expect(screen.queryByText("bugs")).not.toBeInTheDocument()
    })

    it("shows an open-ended date range and clears it", () => {
        setUrl("/?tags=bugs&to=2026-10-17")
        renderWithMantine(<FilterChips />)
        const label = "Any → October 17, 2026"
        expect(screen.getByText(label)).toBeInTheDocument()
        fireEvent.click(removeButton(label))
        expect(currentSearch()).toBe("?tags=bugs")
    })

    it("clears everything", () => {
        setUrl("/?q=x&tags=bugs&from=2026-01-01")
        renderWithMantine(<FilterChips />)
        fireEvent.click(screen.getByRole("button", { name: "Clear all" }))
        expect(currentSearch()).toBe("")
    })
})
