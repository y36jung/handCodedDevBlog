'use client'

import { Anchor, Divider, Stack, Text } from "@mantine/core"
import BlogListItem from "./BlogListItem"
import { filterPosts, posts } from "../lib/posts"
import useBlogFilters from "../lib/useBlogFilters"

export default function BlogList() {
    const filters = useBlogFilters()
    const rows = filterPosts(posts, filters)

    return (
        <div
            style={
                {
                width: '95%'
                }
            }
            className="list-of-blogs"
        >
            <Text size="xs" c="dimmed" mt="lg" mb="xs">
                {rows.length} {rows.length === 1 ? 'post' : 'posts'}{filters.isActive ? ' match' : ''}
            </Text>
            <Divider />
            <Stack gap={0}>
                {rows.map((post) => (
                    <div key={post.id}>
                        <BlogListItem
                            post={post}
                            query={filters.q}
                            activeTags={filters.tags}
                            onTagClick={filters.addTag}
                        />
                        <Divider />
                    </div>
                ))}
            </Stack>
            {!rows.length && (
                <Text size="sm" c="dimmed" py="lg">
                    No posts match these filters.{' '}
                    <Anchor component="button" size="sm" onClick={filters.clearAll}>Clear all</Anchor>
                </Text>
            )}
        </div>
    )
}
