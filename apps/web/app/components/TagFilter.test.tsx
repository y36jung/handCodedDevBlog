import { fireEvent, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { currentSearch } from "../../test/next-navigation"
import { renderWithMantine } from "../../test/render"
import { tagCounts } from "../lib/posts"
import TagFilter from "./TagFilter"

const allTags = tagCounts()

function open() {
    renderWithMantine(<TagFilter />)
    fireEvent.click(screen.getByRole("button", { name: /Tags/ }))
    return screen.getByPlaceholderText(`Search ${allTags.length} tags`)
}

describe("TagFilter", () => {
    it("lists every tag under 'Most used' and 'All tags' headers", () => {
        open()
        expect(screen.getByText("Most used")).toBeInTheDocument()
        expect(screen.getByText("All tags")).toBeInTheDocument()
        expect(screen.getAllByRole("checkbox")).toHaveLength(allTags.length)
    })

    it("narrows the list as you search", () => {
        const search = open()
        fireEvent.change(search, { target: { value: "chunk" } })
        expect(screen.getAllByRole("checkbox")).toHaveLength(1)
        expect(screen.getByRole("checkbox", { name: "chunking" })).toBeInTheDocument()
        expect(screen.queryByText("Most used")).not.toBeInTheDocument()

        fireEvent.change(search, { target: { value: "zzz" } })
        expect(screen.getByText("No matching tags")).toBeInTheDocument()
    })

    it("toggles a tag in the URL and shows the count on the button", () => {
        open()
        fireEvent.click(screen.getByRole("checkbox", { name: "bugs" }))
        expect(currentSearch()).toBe("?tags=bugs")
        expect(screen.getByRole("checkbox", { name: "bugs" })).toBeChecked()
        expect(screen.getByRole("button", { name: /Tags · 1/ })).toBeInTheDocument()
    })

    it("clears the search when the popover closes", () => {
        const search = open()
        fireEvent.change(search, { target: { value: "chunk" } })
        fireEvent.keyDown(search, { key: "Escape" })
        expect(screen.queryByPlaceholderText(/Search \d+ tags/)).not.toBeInTheDocument()

        fireEvent.click(screen.getByRole("button", { name: /Tags/ }))
        expect(screen.getByPlaceholderText(`Search ${allTags.length} tags`)).toHaveValue("")
    })
})
