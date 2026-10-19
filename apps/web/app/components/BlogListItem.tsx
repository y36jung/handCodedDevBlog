'use client'

import Link from "next/link"
import { Box, Group, Highlight, Text, UnstyledButton } from "@mantine/core"
import { formatDate, Post } from "../lib/posts"

type Props = {
    post: Post
    query: string
    activeTags: string[]
    onTagClick: (tag: string) => void
}

export default function BlogListItem({ post, query, activeTags, onTagClick }: Props) {
    return (
        <Box component={Link} href={`/posts/${post.id}`} py="md" td="none" c="inherit" display="block">
            <Group justify="space-between" align="baseline" wrap="nowrap" gap="md">
                <Highlight highlight={query} size="md">{post.title}</Highlight>
                <Text size="xs" c="dimmed" ff="monospace" style={{ whiteSpace: 'nowrap' }}>
                    {formatDate(post.date)}
                </Text>
            </Group>
            <Group gap={8} mt={2}>
                {post.tags.map((tag) => (
                    <UnstyledButton
                        key={tag}
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onTagClick(tag)
                        }}
                    >
                        <Text size="xs" ff="monospace" c={activeTags.includes(tag) ? 'blue' : 'dimmed'}>
                            {tag}
                        </Text>
                    </UnstyledButton>
                ))}
            </Group>
        </Box>
    )
}
