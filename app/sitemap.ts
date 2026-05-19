import type { MetadataRoute } from "next"

import { prisma } from "@/lib/prisma"
import { getSiteUrl, toAbsoluteUrl, DEFAULT_OG_IMAGE_PATH } from "@/lib/seo"

// Regenerate the sitemap at most once every 6 hours.
// Without this, every Googlebot crawl triggers a fresh DB query + ISR write.
export const revalidate = 21600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const staticPages = [
    {
      url: `${siteUrl}/mien-tru-trach-nhiem`,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
  ]

  const rawCategories = await prisma.category.findMany({ 
    select: { 
      slug: true, 
      updatedAt: true,
      posts: {
        where: { isPublished: true, isDeleted: false, AND: [{ OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: new Date() } }] }] },
        orderBy: { publishedAt: "desc" },
        take: 1,
        select: { publishedAt: true }
      }
    } 
  })

  const categoriesData = rawCategories.map(cat => ({
    slug: cat.slug,
    lastmod: cat.posts.length > 0 ? (cat.posts[0].publishedAt || cat.updatedAt) : cat.updatedAt
  }))

  const posts = await prisma.post.findMany({
    where: { isPublished: true, isDeleted: false, AND: [{ OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: new Date() } }] }] },
    select: {
      slug: true,
      updatedAt: true,
      thumbnailUrl: true,
      category: { select: { slug: true } },
    },
    orderBy: { publishedAt: "desc" },
  })

  const sitemapData: MetadataRoute.Sitemap = []

  sitemapData.push({
    url: siteUrl,
    lastModified: new Date(0).toISOString(), // stable value — avoids cache invalidation on every render
    changeFrequency: "hourly",
    priority: 1,
  })

  staticPages.forEach((item) => {
    sitemapData.push({
      url: item.url,
      lastModified: new Date(0).toISOString(), // stable value
      changeFrequency: item.changeFrequency,
      priority: item.priority,
    })
  })

  categoriesData.forEach((category) => {
    sitemapData.push({
      url: `${siteUrl}/${category.slug}`,
      lastModified: category.lastmod,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })
  })

  posts.forEach((post) => {
    // Strip query params (e.g. Unsplash ?auto=format&fit=crop) before inserting into XML.
    // Raw & characters in query strings are illegal XML and break sitemap parsers.
    // The base URL without params still serves the full image from any CDN.
    const rawUrl = post.thumbnailUrl ? toAbsoluteUrl(post.thumbnailUrl) : null
    const cleanUrl = rawUrl ? rawUrl.split("?")[0] : null
    const images = cleanUrl ? [cleanUrl] : []
    
    sitemapData.push({
      url: `${siteUrl}/${post.category.slug}/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      images,
    })
  })

  return sitemapData
}
