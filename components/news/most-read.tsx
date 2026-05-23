import Image from "next/image"
import Link from "next/link"

type MostReadItem = {
  id: string
  title: string
  thumbnailUrl?: string | null
  views: number
  slug: string
  categorySlug: string
}

type MostReadProps = {
  posts: MostReadItem[]
}

export function MostRead({ posts }: MostReadProps) {
  return (
    <section className="space-y-3 border-t border-zinc-200 bg-white p-4">
      <h3 className="text-lg font-bold text-zinc-900">Đọc nhiều nhất</h3>
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
                href={`/${post.categorySlug}/${post.slug}`}
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
