import { readFileSync } from "node:fs"
import { join } from "node:path"
import type { Post } from "../app/lib/posts"

export const posts: Post[] = JSON.parse(readFileSync(join(__dirname, "../app/data/mock-posts.json"), "utf8"))

export function countMatching(predicate: (p: Post) => boolean) {
    return posts.filter(predicate).length
}
