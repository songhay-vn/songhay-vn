import { connection } from "next/server"
import Link from "next/link"
import type { Metadata } from "next"
import { Suspense } from "react"

import { PostCard } from "@/components/news/post-card"
import { SectionHeading } from "@/components/news/section-heading"
import { NewsLayout } from "@/components/news/news-layout"
import { getNavCategories, getPublishedSearchResults, type SearchResultItem } from "@/lib/queries"

type SearchPageProps = {
  searchParams?: Promise<{
    q?: string
    page?: string
  }>
}

function toPositiveInt(value?: string) {
  const parsed = Number.parseInt(value || "", 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 1
  }
  return parsed
}

function normalizeQuery(value?: string) {
  return (value || "").trim().replace(/\s+/g, " ")
}

function buildSearchHref(query: string, page: number) {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
  })

  return `/search?${params.toString()}`
}

function toMetadataTitle(query: string) {
  if (query.length <= 60) {
    return `Tìm kiếm: ${query} | Songhay.vn`
  }

  return `Tìm kiếm: ${query.slice(0, 57)}... | Songhay.vn`
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const query = normalizeQuery(resolvedSearchParams?.q)

  return {
    title: query ? toMetadataTitle(query) : "Tìm kiếm | Songhay.vn",
    description: query
      ? `Kết quả tìm kiếm bài viết cho từ khóa: ${query}.`
      : "Tìm kiếm bài viết mới nhất trên Songhay.vn.",
    alternates: {
      canonical: "/search",
    },
    robots: {
      index: false,
      follow: true,
    },
  }
}

function SearchSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="h-16 w-full animate-pulse bg-zinc-100" />
      <div className="flex flex-col gap-6 py-8 px-4 max-w-7xl mx-auto">
        <div className="h-32 w-full animate-pulse bg-zinc-100" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="flex flex-col gap-6">
            <div className="h-8 w-48 animate-pulse bg-zinc-100" />
            <div className="h-6 w-full animate-pulse bg-zinc-100" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="h-64 w-full animate-pulse rounded bg-zinc-100" />
              <div className="h-64 w-full animate-pulse rounded bg-zinc-100" />
              <div className="h-64 w-full animate-pulse rounded bg-zinc-100" />
            </div>
          </section>
          <aside className="flex flex-col gap-4">
            <div className="h-64 w-full animate-pulse bg-zinc-100" />
            <div className="h-64 w-full animate-pulse bg-zinc-100" />
          </aside>
        </div>
      </div>
    </div>
  )
}

async function SearchContent({ searchParams }: SearchPageProps) {
  await connection()
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const query = normalizeQuery(resolvedSearchParams?.q)
  const page = toPositiveInt(resolvedSearchParams?.page)

  const [result, navCategories] = await Promise.all([
    query
      ? getPublishedSearchResults(query, page, 12)
      : Promise.resolve({
          query: "",
          items: [],
          totalCount: 0,
          page: 1,
          pageSize: 12,
          totalPages: 0,
        }),
    getNavCategories(),
  ])

  const hasPagination = query.length > 0 && result.totalPages > 1

  return (
    <NewsLayout navCategories={navCategories}>
      <div className="space-y-6">
        <SectionHeading title="Tìm kiếm" />

        {query ? (
          <p className="text-sm text-zinc-600">
            {result.totalCount > 0
              ? `Tìm thấy ${result.totalCount} kết quả cho từ khóa "${query}".`
              : `Không tìm thấy bài viết nào cho từ khóa "${query}".`}
          </p>
        ) : (
          <p className="text-sm text-zinc-600">Nhập từ khóa để tìm bài viết đã xuất bản.</p>
        )}

        {result.items.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((post: SearchResultItem, index) => (
              <PostCard
                key={post.id}
                href={`/${post.category.slug}/${post.slug}`}
                title={post.title}
                excerpt={post.excerpt}
                imageUrl={post.thumbnailUrl}
                date={post.publishedAt}
                categoryName={post.category.name}
                prefetch={index < 6}
              />
            ))}
          </div>
        ) : null}

        {hasPagination ? (
          <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
            <div className="text-sm text-zinc-600">
              Trang {result.page}/{result.totalPages}
            </div>

            <div className="flex items-center gap-2">
              {result.page > 1 ? (
                <Link
                  href={buildSearchHref(result.query, result.page - 1)}
                  className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                >
                  Trước
                </Link>
              ) : (
                <span className="rounded-md border border-zinc-100 px-3 py-1.5 text-sm text-zinc-400">Trước</span>
              )}

              {result.page < result.totalPages ? (
                <Link
                  href={buildSearchHref(result.query, result.page + 1)}
                  className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                >
                  Sau
                </Link>
              ) : (
                <span className="rounded-md border border-zinc-100 px-3 py-1.5 text-sm text-zinc-400">Sau</span>
              )}
            </div>
          </nav>
        ) : null}
      </div>
    </NewsLayout>
  )
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchContent searchParams={searchParams} />
    </Suspense>
  )
}
