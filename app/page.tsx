import { Suspense } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"

import { SiteMainContainer } from "@/components/news/site-main-container"
import { AdPlaceholder } from "@/components/news/ad-placeholder"
import { DontMissWidget } from "@/components/news/dont-miss-widget"
import { MostRead } from "@/components/news/most-read"
import { PostCard } from "@/components/news/post-card"
import { PostCardList } from "@/components/news/post-card-list"
import { SectionHeading } from "@/components/news/section-heading"
import { SiteFooter } from "@/components/news/site-footer"
import { SiteHeader } from "@/components/news/site-header"
import { JsonLd } from "@/components/seo/json-ld"
import { getHomepageData, getNavCategories, type PostListItem, type CategoryWithChildren } from "@/lib/queries"
import { DEFAULT_OG_IMAGE_PATH, getSiteUrl, SITE_NAME, toAbsoluteUrl } from "@/lib/seo"
import { ClientSideWidgets } from "@/components/news/client-side-widgets"
import { ZaloChatButton } from "@/components/news/zalo-chat-button"

const RecommendedForYou = dynamic(
  () => import("@/components/news/recommended-for-you").then((mod) => mod.RecommendedForYou),
  { loading: () => <div className="h-60 animate-pulse rounded-lg bg-zinc-100" /> }
)

const VIEN_HAN_LAM_PRODUCTS = [
  {
    src: "/san-pham/z7812738571251_e7d7aee6346878819e8a8363092a30b2.jpg",
    alt: "Sản phẩm Viện Hàn Lâm KH&CN Việt Nam 1",
  },
  {
    src: "/san-pham/z7812738604084_b9afd759b2e4d3fcd7dd53de4ff34dfd.jpg",
    alt: "Sản phẩm Viện Hàn Lâm KH&CN Việt Nam 2",
  },
  {
    src: "/san-pham/z7812738687067_07b7f87d76ccfde40755a094f950eae8.jpg",
    alt: "Sản phẩm Viện Hàn Lâm KH&CN Việt Nam 3",
  },
  {
    src: "/san-pham/z7812739468535_e1e1b4f595f14b77428f45fde987e17e.jpg",
    alt: "Sản phẩm Viện Hàn Lâm KH&CN Việt Nam 4",
  },
]


const siteUrl = getSiteUrl()
const canonicalUrl = siteUrl
const defaultOgImage = toAbsoluteUrl(DEFAULT_OG_IMAGE_PATH)
const homeDescription = "Tin tức và tiện ích mỗi ngày: sống khỏe, mẹo hay, đời sống, góc stress, tử vi, video."

export const metadata: Metadata = {
  title: `${SITE_NAME} | Kho tàng điều hay`,
  description: homeDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${SITE_NAME} | Kho tàng điều hay`,
    description: homeDescription,
    type: "website",
    url: canonicalUrl,
    images: [defaultOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Kho tàng điều hay`,
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
    name: `${SITE_NAME} | Kho tàng điều hay`,
    description: homeDescription,
    inLanguage: "vi-VN",
    isPartOf: {
      "@id": `${siteUrl}#website`,
    },
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <JsonLd data={homepageJsonLd} />
      <SiteHeader navCategories={navCategories} />

      <SiteMainContainer className="flex flex-col gap-6 py-5 md:py-6">
        <Image 
          src="/banner.png" 
          alt="Banner" 
          width={1100} 
          height={200} 
          priority
          className="h-auto w-full object-cover" 
        />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="flex flex-col gap-6">
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

              <AdPlaceholder label="Sau cụm nổi bật (Google AdSense)" />

              <section className="space-y-3">
                <SectionHeading title="Đừng bỏ lỡ!" />
                <DontMissWidget />
              </section>

            <section className="space-y-4">
              <SectionHeading title="Tin mới nhất" />
              <PostCardList posts={latest.slice(0, 10)} />
            </section>

            <AdPlaceholder label="Sau cụm tin mới (Google AdSense)" />

            <AdPlaceholder label="Giữa các cụm nội dung (Google AdSense)" />

            {/* ── SẢN PHẨM VIỆN HÀN LÂM ──────────────────────────── */}
            <section className="space-y-4">
              <SectionHeading title="Sản phẩm Viện Hàn Lâm KH&CN Việt Nam" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
                {VIEN_HAN_LAM_PRODUCTS.map((product) => (
                  <a
                    key={product.src}
                    href="http://zalo.me/1461723500320922510?src=qr&f=1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="relative aspect-square w-full">
                      <Image
                        src={product.src}
                        alt={product.alt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 260px"
                      />
                    </div>
                  </a>
                ))}
              </div>
            </section>

            <AdPlaceholder label="Sau sản phẩm Viện Hàn Lâm (Google AdSense)" />

            {/* Engagement Sections */}
            <Suspense fallback={<div className="h-60 animate-pulse rounded-lg bg-zinc-100" />}>
              <RecommendedForYou posts={recommended} />
            </Suspense>

            <section className="space-y-6 pt-6 border-t border-zinc-200">
              {categoryBlocks.map((items: PostListItem[], index: number) => {
                const [first] = items
                return (
                  <div key={first.category.slug} className="flex flex-col gap-4">
                    <SectionHeading title={first.category.name} />
                    <PostCardList posts={items.slice(0, 4)} />
                    {(index + 1) % 2 === 0 ? (
                      <AdPlaceholder label="Giữa các cụm chuyên mục (Google AdSense)" />
                    ) : null}
                  </div>
                )
              })}
            </section>
          </div>

          <aside className="flex flex-col gap-4">
            <MostRead
              posts={mostRead.map((post: PostListItem) => ({
                id: post.id,
                title: post.title,
                thumbnailUrl: post.thumbnailUrl,
                views: post.views,
                slug: post.slug,
                categorySlug: post.category.slug,
              }))}
            />
            <AdPlaceholder label="Sidebar giữa widgets (Google AdSense)" />
            <ClientSideWidgets />
            <AdPlaceholder label="Sidebar cuối trang chủ (Google AdSense)" />
          </aside>
        </div>
      </SiteMainContainer>

      <SiteFooter navCategories={navCategories} />

      <SiteMainContainer as="div" className="pb-8">
        <AdPlaceholder label="Bottom page ad (Google AdSense)" />
      </SiteMainContainer>

      <ZaloChatButton />
    </div>
  )
}
