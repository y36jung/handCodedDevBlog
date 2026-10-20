import { fireEvent, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { currentSearch, setUrl } from "../../test/next-navigation"
import { renderWithMantine } from "../../test/render"
import DateFilter from "./DateFilter"

describe("DateFilter", () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ["Date"] })
        vi.setSystemTime(new Date(2026, 9, 17, 12))
    })
    afterEach(() => { vi.useRealTimers() })

    it.each([
        ["Last 30 days", "2026-09-17"],
        ["Last 3 months", "2026-07-19"],
        ["Last year", "2025-10-17"],
    ])("'%s' sets the range from %s to today", (label, from) => {
        renderWithMantine(<DateFilter />)
        fireEvent.click(screen.getByRole("button", { name: /Date/ }))
        fireEvent.click(screen.getByRole("button", { name: label }))
        expect(currentSearch()).toBe(`?from=${from}&to=2026-10-17`)
    })

    it("marks the button when a date is set", () => {
        setUrl("/?from=2026-01-01")
        renderWithMantine(<DateFilter />)
        expect(screen.getByRole("button", { name: /Date · set/ })).toBeInTheDocument()
    })
})
