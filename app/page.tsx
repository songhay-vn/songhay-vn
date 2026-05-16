import { Suspense } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"

import { DontMissWidget } from "@/components/news/dont-miss-widget"
import { PostCard } from "@/components/news/post-card"
import { PostCardList } from "@/components/news/post-card-list"
import { SectionHeading } from "@/components/news/section-heading"
import { SiteEngagement } from "@/components/news/site-engagement"
import { JsonLd } from "@/components/seo/json-ld"
import { getHomepageData, getNavCategories, type PostListItem, type CategoryWithChildren } from "@/lib/queries"
import { DEFAULT_OG_IMAGE_PATH, getSiteUrl, SITE_NAME, toAbsoluteUrl } from "@/lib/seo"
import { NewsLayout } from "@/components/news/news-layout"

const RecommendedForYou = dynamic(
  () => import("@/components/news/recommended-for-you").then((mod) => mod.RecommendedForYou),
  { loading: () => <div className="h-60 animate-pulse rounded-lg bg-zinc-100" /> }
)

const siteUrl = getSiteUrl()
const canonicalUrl = siteUrl
const defaultOgImage = toAbsoluteUrl(DEFAULT_OG_IMAGE_PATH)
const homeDescription = "Tin tức và tiện ích mỗi ngày: sống khỏe, mẹo hay, đời sống, góc stress, tử vi, video."

export const metadata: Metadata = {
  title: `${SITE_NAME} | Sống khỏe thuận tự nhiên`,
  description: homeDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${SITE_NAME} | Sống khỏe thuận tự nhiên`,
    description: homeDescription,
    type: "website",
    url: canonicalUrl,
    images: [defaultOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Sống khỏe thuận tự nhiên`,
    description: homeDescription,
    images: [defaultOgImage],
  },
}

export default async function HomePage() {
  const [
    { latest, mostRead, recommended, heroSlots = [] },
    navCategories,
  ] = await Promise.all([
    getHomepageData(),
    getNavCategories(),
  ])

  const groupedByCategory = latest.reduce<Record<string, PostListItem[]>>((acc: Record<string, PostListItem[]>, post: PostListItem) => {
    const key = post.category.slug
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(post)
    return acc
  }, {})

  const categoryBlocks = navCategories.filter((category: CategoryWithChildren) =>
    ["song-khoe", "meo-hay", "doi-song", "goc-stress", "tu-vi", "video"].includes(category.slug)
  )
    .map((category: CategoryWithChildren) => groupedByCategory[category.slug])
    .filter((items: PostListItem[] | undefined): items is PostListItem[] => Boolean(items && items.length > 0))

  const homepageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: `${SITE_NAME} | Sống khỏe thuận tự nhiên`,
    description: homeDescription,
    inLanguage: "vi-VN",
    isPartOf: {
      "@id": `${siteUrl}#website`,
    },
  }

  return (
    <>
      <JsonLd data={homepageJsonLd} />
      <NewsLayout
        navCategories={navCategories}
        trendingPosts={mostRead}
        mainBanner={
          <Image
            src="/banner.png"
            alt="Banner"
            width={1100}
            height={200}
            priority
            className="h-auto w-full object-cover"
          />
        }
      >
        {/* ── MAGAZINE HERO SECTION ─────────────────────────────────── */}
        <section className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Main Featured (2/3 width) */}
            <div className="lg:col-span-2">
              {heroSlots[0] && (
                <PostCard
                  href={`/${heroSlots[0].category.slug}/${heroSlots[0].slug}`}
                  title={heroSlots[0].title}
                  excerpt={heroSlots[0].excerpt}
                  imageUrl={heroSlots[0].thumbnailUrl}
                  date={heroSlots[0].publishedAt}
                  categoryName={heroSlots[0].category.name}
                  variant="overlay"
                  className="h-full"
                  commentCount={heroSlots[0]._count.comments}
                  prefetch={true}
                />
              )}
            </div>

            {/* Sidebar Posts (1/3 width stacked) */}
            <div className="flex flex-col gap-6 lg:col-span-1">
              {heroSlots.slice(1, 3).map((post: PostListItem) => (
                <PostCard
                  key={post.id}
                  href={`/${post.category.slug}/${post.slug}`}
                  title={post.title}
                  imageUrl={post.thumbnailUrl}
                  date={post.publishedAt}
                  categoryName={post.category.name}
                  showExcerpt={false}
                  commentCount={post._count.comments}
                  className="lg:flex-col"
                  variant="horizontal"
                />
              ))}
            </div>
          </div>

          {/* Bottom Row (3 items) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:gap-6">
            {heroSlots.slice(3, 6).map((post: PostListItem) => (
              <PostCard
                key={post.id}
                href={`/${post.category.slug}/${post.slug}`}
                title={post.title}
                imageUrl={post.thumbnailUrl}
                date={post.publishedAt}
                categoryName={post.category.name}
                showExcerpt={false}
                aspectRatio="12/7"
                commentCount={post._count.comments}
                className="lg:flex-col"
                variant="horizontal"
              />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <SectionHeading title="Đừng bỏ lỡ!" />
          <DontMissWidget />
        </section>

        <Suspense fallback={<div className="h-60 animate-pulse rounded-lg bg-zinc-100" />}>
          <SiteEngagement />
        </Suspense>
      </NewsLayout>
    </>
  )
}
