'use client'

import Link from "next/link"
import { Anchor, Box, Group, Text, Title } from "@mantine/core"
import { formatDate, Post } from "../lib/posts"

export default function PostDetail({ post }: { post: Post }) {
    return (
        <Box w="95%">
            <Anchor component={Link} href="/" size="xs" mb="lg" display="inline-block">
                ← devlog
            </Anchor>
            <Title order={1} size={24} fw={500} mb={6}>{post.title}</Title>
            <Text size="xs" c="dimmed" ff="monospace" mb={4}>{formatDate(post.date, true)}</Text>
            <Group gap={8} mb="xl">
                {post.tags.map((tag) => (
                    <Anchor key={tag} component={Link} href={`/?tags=${encodeURIComponent(tag)}`} size="xs" ff="monospace">
                        {tag}
                    </Anchor>
                ))}
            </Group>
            <Text size="sm">
                Post content coming soon.
            </Text>
        </Box>
    )
}
