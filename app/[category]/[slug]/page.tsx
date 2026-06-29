import Image from "next/image"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ArticlePageShell } from "@/components/news/article-page-shell"
import { JsonLd } from "@/components/seo/json-ld"
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd"
import {
  getPostByCategoryAndSlug,
  getNavCategories,
  getLatestPostsForSsg,
  getPostViewCountFromAnalytics,
} from "@/lib/queries"
import { normalizeArticleHtml } from "@/lib/html"
import { buildAutoSeoDescription, buildAutoSeoTitle } from "@/lib/post-seo"
import { DEFAULT_OG_IMAGE_PATH, getSiteUrl, toAbsoluteUrl } from "@/lib/seo"

type PostPageProps = {
  params: Promise<{ category: string; slug: string }>
}

const ARTICLE_STATIC_PARAMS_LIMIT = 250

export async function generateStaticParams() {
  const latestPosts = await getLatestPostsForSsg(ARTICLE_STATIC_PARAMS_LIMIT)
  return latestPosts.map((post) => ({
    category: post.category.slug,
    slug: post.slug,
  }))
}

// Shared logic in lib/html.ts

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { category, slug } = await params
  const post = await getPostByCategoryAndSlug(category, slug)
  const siteUrl = getSiteUrl()

  if (!post) {
    return {
      title: "Không tìm thấy bài viết",
    }
  }

  const title =
    post.seoTitle ||
    buildAutoSeoTitle({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
    }) ||
    post.title
  const description =
    post.seoDescription ||
    buildAutoSeoDescription({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
    }) ||
    post.excerpt
  const canonicalPath = `/${post.category.slug}/${post.slug}`
  const canonicalUrl = `${siteUrl}${canonicalPath}`
  const imageUrl = toAbsoluteUrl(
    post.ogImage || post.thumbnailUrl || DEFAULT_OG_IMAGE_PATH
  )

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonicalUrl,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      publishedTime: post.publishedAt
        ? new Date(post.publishedAt).toISOString()
        : undefined,
      modifiedTime: post.updatedAt
        ? new Date(post.updatedAt).toISOString()
        : undefined,
      section: post.category.name,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { category, slug } = await params
  const [post, navCategories] = await Promise.all([
    getPostByCategoryAndSlug(category, slug),
    getNavCategories(),
  ])

  if (!post) {
    notFound()
  }

  const article = post!
  const articleViewCount = await getPostViewCountFromAnalytics(
    article.category.slug,
    article.slug
  )
  const siteUrl = getSiteUrl()
  const fullUrl = `${siteUrl}/${article.category.slug}/${article.slug}`
  const articleHtml = normalizeArticleHtml(article.content)
  const articleImage = toAbsoluteUrl(
    article.ogImage || article.thumbnailUrl || DEFAULT_OG_IMAGE_PATH
  )

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": `${fullUrl}#article`,
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt
      ? new Date(article.publishedAt).toISOString()
      : null,
    dateModified: article.updatedAt
      ? new Date(article.updatedAt).toISOString()
      : null,
    inLanguage: "vi-VN",
    articleSection: article.category.name,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": fullUrl,
    },
    image: [articleImage],
    author: {
      "@type": "Organization",
      "@id": `${siteUrl}#organization`,
      name: "Songhay.vn",
    },
    publisher: {
      "@id": `${siteUrl}#organization`,
      logo: {
        "@type": "ImageObject",
        url: toAbsoluteUrl(DEFAULT_OG_IMAGE_PATH),
      },
    },
  }

  const breadcrumbItems = [
    { name: "Trang chủ", url: siteUrl },
    { name: article.category.name, url: `${siteUrl}/${article.category.slug}` },
    { name: article.title, url: fullUrl },
  ]

  return (
    <ArticlePageShell
      navCategories={navCategories}
      article={article}
      articleHtml={articleHtml}
      fullUrl={fullUrl}
      dateValue={article.publishedAt}
      viewCount={articleViewCount}
      showSocialShare
      commentFormMode="live"
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
      metadataNodes={
        <>
          <JsonLd data={[articleJsonLd]} />
          <BreadcrumbJsonLd items={breadcrumbItems} />
        </>
      }
    />
  )
}
