import { connection } from "next/server"
import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"

import { getAllIndexedVietGifts, getNavCategories } from "@/lib/queries"
import { NewsLayout } from "@/components/news/news-layout"
import { PostCard } from "@/components/news/post-card"
import { VietGiftSidebar } from "@/components/news/viet-gift-sidebar"
import { VietGiftSearchForm } from "@/components/news/viet-gift-search-form"
import { getSiteUrl, SITE_NAME } from "@/lib/seo"

export const metadata: Metadata = {
  title: `Quà Việt | ${SITE_NAME}`,
  description: "Khám phá các sản phẩm Quà Việt đặc sản, tinh hoa vùng miền từ các nhà sản xuất uy tín trên toàn quốc.",
  alternates: {
    canonical: `${getSiteUrl()}/qua-viet`,
  },
}

type VietGiftsListingPageProps = {
  searchParams?: Promise<{ q?: string }>
}

function VietGiftsSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="h-16 w-full animate-pulse bg-white border-b border-zinc-200" />
      <div className="flex flex-col gap-6 py-8 px-4 max-w-7xl mx-auto">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-6">
            <div className="h-8 w-48 animate-pulse bg-zinc-200 rounded" />
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-48 sm:h-64 animate-pulse rounded bg-zinc-200" />
              ))}
            </div>
          </div>
          <div className="h-96 animate-pulse rounded bg-zinc-200" />
        </div>
      </div>
    </div>
  )
}

async function VietGiftsListingContent({
  searchParams,
}: VietGiftsListingPageProps) {
  await connection()
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const searchQuery = (resolvedSearchParams?.q || "").trim()

  const [allProducts, navCategories] = await Promise.all([
    getAllIndexedVietGifts(),
    getNavCategories(),
  ])

  const products = searchQuery
    ? allProducts.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allProducts

  return (
    <NewsLayout
      navCategories={navCategories}
      customSidebar={<VietGiftSidebar currentSearchQuery={searchQuery} />}
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Mobile Search Bar - displayed on mobile (< lg) at the very top */}
        <div className="block lg:hidden border border-zinc-200 bg-white p-3 shadow-xs">
          <VietGiftSearchForm defaultValue={searchQuery} />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-zinc-200 pb-3">
          <h1 className="text-2xl md:text-3xl font-black text-zinc-900">
            Quà Việt
          </h1>
          {searchQuery && (
            <p className="text-sm text-zinc-600">
              Kết quả tìm kiếm cho: <span className="font-semibold text-zinc-900">&quot;{searchQuery}&quot;</span> ({products.length} sản phẩm)
            </p>
          )}
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12 bg-white border border-zinc-200 space-y-3">
            <p className="text-zinc-500">
              {searchQuery
                ? `Không tìm thấy đặc sản nào phù hợp với từ khóa "${searchQuery}".`
                : "Hiện chưa có sản phẩm Quà Việt nào."}
            </p>
            {searchQuery && (
              <Link
                href="/qua-viet"
                className="inline-block text-sm font-semibold text-rose-600 hover:text-rose-700 underline"
              >
                Xem tất cả Quà Việt →
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {products.map((product) => (
              <PostCard
                key={product.id}
                href={`/qua-viet/${product.slug}`}
                title={product.name}
                imageUrl={product.imageUrl}
                aspectRatio="square"
                showExcerpt={false}
                className="bg-white border border-zinc-200 p-2.5 sm:p-4 rounded-xs [&_h3]:text-sm sm:[&_h3]:text-base md:[&_h3]:text-lg"
              />
            ))}
          </div>
        )}
      </div>
    </NewsLayout>
  )
}

export default function VietGiftsListingPage({
  searchParams,
}: VietGiftsListingPageProps) {
  return (
    <Suspense fallback={<VietGiftsSkeleton />}>
      <VietGiftsListingContent searchParams={searchParams} />
    </Suspense>
  )
}
