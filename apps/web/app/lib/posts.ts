import dayjs from "dayjs"
import mockPosts from "../data/mock-posts.json"

export type Post = {
    id: string
    title: string
    date: string
    tags: string[]
    createdAt: string
}

export type Filters = {
    q: string
    tags: string[]
    from: string
    to: string
}

export type TagCount = {
    tag: string
    count: number
}

export const posts: Post[] = mockPosts

export function getPost(id: string) {
    return posts.find((p) => p.id === id)
}

export function tagCounts(): TagCount[] {
    const counts: Record<string, number> = {}
    posts.forEach((p) => p.tags.forEach((t) => { counts[t] = (counts[t] || 0) + 1 }))
    return Object.entries(counts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}

export function filterPosts(list: Post[], { q, tags, from, to }: Filters) {
    const query = q.toLowerCase()
    return list
        .filter((p) => {
            if (query && !p.title.toLowerCase().includes(query)) return false
            if (!tags.every((t) => p.tags.includes(t))) return false
            if (from && p.date < from) return false
            if (to && p.date > to) return false
            return true
        })
        .sort((a, b) => b.date.localeCompare(a.date))
}

export function formatDate(date: string, long = false) {
    return dayjs(date).format(long ? "MMMM D, YYYY" : "MMM D")
}
