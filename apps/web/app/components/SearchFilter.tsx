'use client'

import { useEffect, useState } from "react"
import { TextInput } from "@mantine/core"
import { useDebouncedValue } from "@mantine/hooks"
import useBlogFilters from "../lib/useBlogFilters"

export default function SearchFilter() {
    const { q, setQ } = useBlogFilters()
    const [value, setValue] = useState(q)
    const [prevQ, setPrevQ] = useState(q)
    const [debounced] = useDebouncedValue(value, 200)

    // Keep the input in sync when q changes elsewhere (e.g. "Clear all")
    if (q !== prevQ) {
        setPrevQ(q)
        setValue(q)
    }

    useEffect(() => {
        if (debounced !== q) setQ(debounced)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debounced])

    return (
        <TextInput
            type="search"
            placeholder="Search posts by title"
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.currentTarget.value)}
        />
    )
}
