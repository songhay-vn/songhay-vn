import Image from "next/image"
import type { Metadata } from "next"

import { PostCard } from "@/components/news/post-card"
import { JsonLd } from "@/components/seo/json-ld"
import {
  getHomepageData,
  getNavCategories,
  type PostListItem,
} from "@/lib/queries"
import {
  DEFAULT_OG_IMAGE_PATH,
  getSiteUrl,
  SITE_NAME,
  toAbsoluteUrl,
} from "@/lib/seo"
import { NewsLayout } from "@/components/news/news-layout"

const siteUrl = getSiteUrl()
const canonicalUrl = siteUrl
const defaultOgImage = toAbsoluteUrl(DEFAULT_OG_IMAGE_PATH)
const defaultOgImageAlt = `${SITE_NAME} - Sống khỏe thuận tự nhiên`
const homeDescription =
  "Kiến thức sức khỏe, thảo mộc, y học cổ truyền và lối sống xanh mỗi ngày."

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
    images: [
      {
        url: defaultOgImage,
        width: 1200,
        height: 630,
        alt: defaultOgImageAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Sống khỏe thuận tự nhiên`,
    description: homeDescription,
    images: [defaultOgImage],
  },
}

export default async function HomePage() {
  const [{ heroSlots = [], latestRest = [] }, navCategories] = await Promise.all([
    getHomepageData(),
    getNavCategories(),
  ])

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
        showBottomCategorySections
        mainBanner={
          <Image
            src="/site-header-hero.png"
            alt="Sống Hay Hero"
            width={1100}
            height={200}
            priority
            className="h-auto w-full object-cover"
          />
        }
        latestPosts={latestRest}
      >
        <section className="flex flex-col gap-6">
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
                  prefetch={true}
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
                prefetch={true}
              />
            ))}
          </div>
        </section>
      </NewsLayout>
    </>
  )
}
