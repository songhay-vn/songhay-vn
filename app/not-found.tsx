import Link from "next/link"
import { Home, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PostCard } from "@/components/news/post-card"
import { SectionHeading } from "@/components/news/section-heading"
import {
  getHomepageData,
  getNavCategories,
  type PostListItem,
} from "@/lib/queries"
import { NewsLayout } from "@/components/news/news-layout"

export default async function NotFound() {
  const [{ latestRest }, navCategories] = await Promise.all([
    getHomepageData(),
    getNavCategories(),
  ])

  return (
    <NewsLayout
      navCategories={navCategories}
      showSidebar={false}
      containerClassName="flex flex-col flex-1"
      gridClassName="flex flex-col flex-1"
    >
      {/* Main 404 Hero Section */}
      <div className="relative overflow-hidden py-16 md:py-24">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(190,18,60,0.05)_0%,transparent_50%)]" />
        <div className="absolute top-0 left-1/2 -z-10 h-72 w-full -translate-x-1/2 bg-gradient-to-b from-rose-50/50 to-transparent blur-3xl" />

        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex items-center justify-center rounded-full bg-rose-100 p-4 text-rose-600 shadow-inner">
            <AlertCircle className="h-12 w-12" />
          </div>

          <h1 className="mb-2 bg-gradient-to-br from-red-700 to-rose-500 bg-clip-text font-serif text-8xl font-bold tracking-tighter text-transparent md:text-9xl">
            404
          </h1>

          <h2 className="mb-4 font-serif text-3xl font-bold text-zinc-900 md:text-5xl">
            Ôi hỏng rồi, không tìm thấy trang!
          </h2>

          <p className="mb-10 max-w-lg text-lg text-zinc-600 md:text-xl">
            Có vẻ như đường dẫn này không tồn tại hoặc đã bị gỡ bỏ. Đừng lo, bạn
            có thể quay lại trang chủ hoặc khám phá các chuyên mục bên dưới.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 bg-red-700 px-8 text-base font-bold text-white hover:bg-red-800"
            >
              <Link href="/">
                <Home className="mr-2 h-5 w-5" />
                Quay lại trang chủ
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Suggested Content Section */}
      <div className="mb-8 border-t border-zinc-200 pt-16">
        <SectionHeading title="Bài viết mới nhất bạn có thể quan tâm" />
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {latestRest.slice(0, 4).map((post: PostListItem) => (
            <PostCard
              key={post.id}
              href={`/${post.category.slug}/${post.slug}`}
              title={post.title}
              excerpt={post.excerpt}
              imageUrl={post.thumbnailUrl}
              date={post.publishedAt}
              categoryName={post.category.name}
            />
          ))}
        </div>
      </div>
    </NewsLayout>
  )
}
