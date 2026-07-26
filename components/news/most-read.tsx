import Image from "next/image"
import Link from "next/link"

export type MostReadItem = {
  id: string
  title: string
  thumbnailUrl?: string | null
  slug: string
  category: {
    name: string
    slug: string
  }
}

export function toMostReadItem(post: {
  id: string
  title: string
  slug: string
  thumbnailUrl?: string | null
  category: { name: string; slug: string }
}): MostReadItem {
  return {
    id: post.id,
    title: post.title,
    thumbnailUrl: post.thumbnailUrl,
    slug: post.slug,
    category: {
      name: post.category.name,
      slug: post.category.slug,
    },
  }
}

type MostReadProps = {
  posts: MostReadItem[]
  title?: string
}

export function MostRead({ posts, title = "Đọc nhiều nhất" }: MostReadProps) {
  return (
    <section className="space-y-3 border-t border-zinc-200 bg-white p-4">
      <h3 className="text-lg font-bold text-zinc-900">{title}</h3>
      <ul className="space-y-3">
        {posts.slice(0, 5).map((post) => (
          <li key={post.id} className="flex gap-3 border-b border-zinc-200 pb-3 last:border-b-0 last:pb-0">
            <Image
              src={post.thumbnailUrl || "/placeholder-news.svg"}
              alt={post.title}
              width={120}
              height={70}
              loading="lazy"
              className="w-24 aspect-[12/7] flex-shrink-0 object-cover"
            />
            <div className="flex-1 space-y-1">
              <Link
                href={`/${post.category.slug}`}
                className="text-xs font-semibold uppercase leading-none text-rose-600 transition hover:text-rose-700"
              >
                {post.category.name}
              </Link>
              <Link
                href={`/${post.category.slug}/${post.slug}`}
                className="line-clamp-3 text-sm font-bold leading-snug text-zinc-800 transition hover:text-rose-600"
              >
                {post.title}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
