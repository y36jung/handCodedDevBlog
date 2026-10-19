'use client'

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Filters } from "./posts"

export default function useBlogFilters() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    const filters: Filters = {
        q: searchParams.get('q') ?? '',
        tags: searchParams.get('tags')?.split(',').filter(Boolean) ?? [],
        from: searchParams.get('from') ?? '',
        to: searchParams.get('to') ?? '',
    }

    function update(next: Partial<Filters>) {
        const merged = { ...filters, ...next }
        const params = new URLSearchParams()
        if (merged.q) params.set('q', merged.q)
        if (merged.tags.length) params.set('tags', merged.tags.join(','))
        if (merged.from) params.set('from', merged.from)
        if (merged.to) params.set('to', merged.to)
        const qs = params.toString()
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    }

    const toggleTag = (tag: string) => update({
        tags: filters.tags.includes(tag)
            ? filters.tags.filter((t) => t !== tag)
            : [...filters.tags, tag],
    })

    return {
        ...filters,
        isActive: Boolean(filters.q || filters.tags.length || filters.from || filters.to),
        setQ: (q: string) => update({ q }),
        toggleTag,
        addTag: (tag: string) => { if (!filters.tags.includes(tag)) toggleTag(tag) },
        setRange: (from: string, to: string) => update({ from, to }),
        clearDate: () => update({ from: '', to: '' }),
        clearAll: () => update({ q: '', tags: [], from: '', to: '' }),
    }
}
