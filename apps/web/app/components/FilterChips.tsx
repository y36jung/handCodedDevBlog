'use client'

import { Anchor, Group, Pill } from "@mantine/core"
import { formatDate } from "../lib/posts"
import useBlogFilters from "../lib/useBlogFilters"

export default function FilterChips() {
    const { tags, from, to, toggleTag, clearDate, clearAll } = useBlogFilters()
    const hasDate = Boolean(from || to)

    if (!tags.length && !hasDate) return null

    return (
        <Group gap={6} mt="sm">
            {tags.map((tag) => (
                <Pill key={tag} withRemoveButton onRemove={() => toggleTag(tag)}>
                    {tag}
                </Pill>
            ))}
            {hasDate && (
                <Pill withRemoveButton onRemove={clearDate}>
                    {from ? formatDate(from, true) : 'Any'} → {to ? formatDate(to, true) : 'Any'}
                </Pill>
            )}
            <Anchor component="button" size="xs" c="dimmed" onClick={clearAll}>
                Clear all
            </Anchor>
        </Group>
    )
}
