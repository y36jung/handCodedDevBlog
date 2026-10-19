'use client'

import { useState } from "react"
import { Button, Checkbox, Group, Popover, ScrollArea, Text, TextInput } from "@mantine/core"
import { tagCounts } from "../lib/posts"
import useBlogFilters from "../lib/useBlogFilters"

const TOP_N = 8
const allTags = tagCounts()

export default function TagFilter() {
    const { tags, toggleTag } = useBlogFilters()
    const [query, setQuery] = useState('')

    const q = query.toLowerCase()
    const shown = q ? allTags.filter((t) => t.tag.includes(q)) : allTags

    return (
        <div
        style={
            {
                minHeight: '30%'
            }
        }
        >
            <Popover width={260} position="bottom-start" shadow="md" onClose={() => setQuery('')}>
                <Popover.Target>
                    <Button
                        variant={tags.length ? 'light' : 'default'}
                        size="xs"
                        rightSection={<Text span size="9px" c="dimmed">▼</Text>}
                    >
                        Tags{tags.length ? ` · ${tags.length}` : ''}
                    </Button>
                </Popover.Target>
                <Popover.Dropdown p={8}>
                    <TextInput
                        size="xs"
                        placeholder={`Search ${allTags.length} tags`}
                        autoComplete="off"
                        data-autofocus
                        value={query}
                        onChange={(e) => setQuery(e.currentTarget.value)}
                    />
                    <ScrollArea.Autosize mah={220} mt={6}>
                        {!q && <Text size="xs" c="dimmed" px={8} pt={8} pb={2}>Most used</Text>}
                        {shown.map(({ tag, count }, i) => (
                            <div key={tag}>
                                {!q && i === TOP_N && (
                                    <Text size="xs" c="dimmed" px={8} pt={8} pb={2}>All tags</Text>
                                )}
                                <Group justify="space-between" px={8} py={6} wrap="nowrap">
                                    <Checkbox
                                        size="xs"
                                        label={tag}
                                        checked={tags.includes(tag)}
                                        onChange={() => toggleTag(tag)}
                                    />
                                    <Text size="xs" c="dimmed">{count}</Text>
                                </Group>
                            </div>
                        ))}
                        {!shown.length && <Text size="sm" c="dimmed" px={8} py="sm">No matching tags</Text>}
                    </ScrollArea.Autosize>
                </Popover.Dropdown>
            </Popover>
        </div>
    )
}
