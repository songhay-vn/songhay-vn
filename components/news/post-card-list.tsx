import React from "react"
import { PostCard } from "./post-card"

import type { PostCompact as PostListItem } from "@/types/post"
export type { PostListItem }

type PostCardListProps = {
  posts: PostListItem[]
  prefetchFirst?: number
}

export function PostCardList({ posts, prefetchFirst = 0 }: PostCardListProps) {
  if (posts.length === 0) return null

  return (
    <div className="flex flex-col border-t border-zinc-200">
      {posts.map((post, index) => (
        <div key={post.id} className="border-b border-zinc-200 py-6 last:border-b-0">
          <PostCard
            href={`/${post.category.slug}/${post.slug}`}
            title={post.title}
            excerpt={post.excerpt}
            imageUrl={post.thumbnailUrl}
            date={post.publishedAt}
            categoryName={post.category.name}
            variant="horizontal"
            commentCount={post._count.comments}
            prefetch={index < prefetchFirst}
          />
        </div>
      ))}
    </div>
  )
}
