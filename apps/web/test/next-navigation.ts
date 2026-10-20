import { useMemo, useSyncExternalStore } from "react"
import { vi } from "vitest"

// In-memory stand-in for next/navigation so URL-driven components re-render like they do in the app
let url = new URL("http://localhost/")
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
}

export function setUrl(href: string) {
    url = new URL(href, "http://localhost")
    listeners.forEach((l) => l())
}

export function currentSearch() {
    return url.search
}

export const replace = vi.fn((href: string) => setUrl(href))
const router = { replace, push: replace, back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }

export function useRouter() {
    return router
}

export function usePathname() {
    return useSyncExternalStore(subscribe, () => url.pathname)
}

export function useSearchParams() {
    const search = useSyncExternalStore(subscribe, () => url.search)
    return useMemo(() => new URLSearchParams(search), [search])
}

export const notFound = vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND")
})
