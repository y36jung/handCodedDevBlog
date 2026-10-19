'use client'

import { useEffect } from "react"
import "./DebugBorders.css"

// Outlines every element on the page, coloured by nesting depth.
// Flip `enabled` in layout.tsx to turn it on or off.
export default function DebugBorders({
    enabled = true,
    children,
}: {
    enabled?: boolean
    children: React.ReactNode
}) {
    useEffect(() => {
        const root = document.documentElement
        root.toggleAttribute('data-debug-borders', enabled)
        return () => root.removeAttribute('data-debug-borders')
    }, [enabled])

    return <>{children}</>
}
