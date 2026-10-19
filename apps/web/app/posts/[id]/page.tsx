import { notFound } from "next/navigation"
import PostDetail from "../../components/PostDetail"
import { getPost } from "../../lib/posts"

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const post = getPost(id)
    if (!post) notFound()

    return <PostDetail post={post} />
}
