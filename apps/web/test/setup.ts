import "@testing-library/jest-dom/vitest"
import { afterEach, beforeEach, vi } from "vitest"
import { cleanup } from "@testing-library/react"
import { replace, setUrl } from "./next-navigation"

vi.mock("next/navigation", () => import("./next-navigation"))

// jsdom gaps that Mantine relies on
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
    }),
})
window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
}
Element.prototype.scrollIntoView = () => {}

beforeEach(() => {
    setUrl("/")
    replace.mockClear()
})

afterEach(() => {
    cleanup()
})
