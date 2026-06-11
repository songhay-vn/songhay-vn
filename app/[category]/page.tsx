import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PostCardList } from "@/components/news/post-card-list"
import { SectionHeading } from "@/components/news/section-heading"
import { JsonLd } from "@/components/seo/json-ld"
import {
  getCategoryBySlug,
  getPostsByCategory,
  getAllCategorySlugs,
  getNavCategories,
} from "@/lib/queries"
import { DEFAULT_OG_IMAGE_PATH, getSiteUrl, toAbsoluteUrl } from "@/lib/seo"
import { NewsLayout } from "@/components/news/news-layout"

type CategoryPageProps = {
  params: Promise<{ category: string }>
}

export async function generateStaticParams() {
  const categories = await getAllCategorySlugs()
  return categories.map((cat) => ({
    category: cat.slug,
  }))
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params
  const foundCategory = await getCategoryBySlug(category)
  const siteUrl = getSiteUrl()

  if (!foundCategory) {
    return { title: "Không tìm thấy chuyên mục" }
  }

  const title = `${foundCategory.name} | Songhay.vn`
  const description =
    foundCategory.description ||
    `Khám phá bài viết mới nhất thuộc chuyên mục ${foundCategory.name}.`
  const canonicalPath = `/${foundCategory.slug}`
  const canonicalUrl = `${siteUrl}${canonicalPath}`

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonicalUrl,
      images: [toAbsoluteUrl(DEFAULT_OG_IMAGE_PATH)],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [toAbsoluteUrl(DEFAULT_OG_IMAGE_PATH)],
    },
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params
  const [foundCategory, posts, navCategories] =
    await Promise.all([
      getCategoryBySlug(category),
      getPostsByCategory(category),
      getNavCategories(),
    ])

  if (!foundCategory) {
    notFound()
  }

  const currentCategory = foundCategory!
  const siteUrl = getSiteUrl()
  const categoryUrl = `${siteUrl}/${currentCategory.slug}`

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Trang chu",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: currentCategory.name,
        item: categoryUrl,
      },
    ],
  }

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: currentCategory.name,
    description:
      currentCategory.description ||
      `Chuyen muc ${currentCategory.name} cua Songhay.vn`,
    url: categoryUrl,
    inLanguage: "vi-VN",
    isPartOf: {
      "@id": `${siteUrl}#website`,
    },
  }

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd, collectionJsonLd]} />
      <NewsLayout navCategories={navCategories}>
        <section className="flex flex-col gap-4">
          <SectionHeading title={currentCategory.name} />

          {posts.length === 0 ? (
            <p className="text-zinc-600">Chuyên mục này chưa có bài viết.</p>
          ) : (
            <PostCardList posts={posts} prefetchFirst={8} />
          )}
        </section>
      </NewsLayout>
    </>
  )
}
