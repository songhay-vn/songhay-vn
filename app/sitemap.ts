import type { MetadataRoute } from "next"

import { prisma } from "@/lib/prisma"
import { getSiteUrl, toAbsoluteUrl, DEFAULT_OG_IMAGE_PATH } from "@/lib/seo"

// Regenerate the sitemap at most once every 6 hours.
// Without this, every Googlebot crawl triggers a fresh DB query + ISR write.
export const revalidate = 21600

const MAX_POSTS_PER_SITEMAP = 10000

export async function generateSitemaps() {
  const postCount = await prisma.post.count({
    where: { isPublished: true, isDeleted: false, AND: [{ OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: new Date() } }] }] },
  })
  
  if (postCount === 0) return [{ id: 0 }]
  
  const numSitemaps = Math.ceil(postCount / MAX_POSTS_PER_SITEMAP)
  return Array.from({ length: numSitemaps }, (_, i) => ({ id: i }))
}

export default async function sitemap(props: { id: number | string }): Promise<MetadataRoute.Sitemap> {
  const id = Number(props?.id || 0)
  const skip = isNaN(id) ? 0 : id * MAX_POSTS_PER_SITEMAP
  
  const siteUrl = getSiteUrl()
  const staticPages = [
    {
      url: `${siteUrl}/mien-tru-trach-nhiem`,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
  ]

  // Only include categories and static pages on the first sitemap chunk
  let categoriesData: { slug: string; lastmod: Date }[] = []
  let includeStatic = id === 0

  if (includeStatic) {
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

    categoriesData = rawCategories.map(cat => ({
      slug: cat.slug,
      lastmod: cat.posts.length > 0 ? (cat.posts[0].publishedAt || cat.updatedAt) : cat.updatedAt
    }))
  }

  const posts = await prisma.post.findMany({
    where: { isPublished: true, isDeleted: false, AND: [{ OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: new Date() } }] }] },
    select: {
      title: true,
      slug: true,
      updatedAt: true,
      publishedAt: true,
      thumbnailUrl: true,
      category: { select: { slug: true } },
    },
    orderBy: { publishedAt: "desc" },
    skip: skip,
    take: MAX_POSTS_PER_SITEMAP,
  })

  const sitemapData: MetadataRoute.Sitemap = []

  if (includeStatic) {
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
  }

  posts.forEach((post) => {
    const images = post.thumbnailUrl ? [toAbsoluteUrl(post.thumbnailUrl)] : []
    
    // Using intersection with 'any' or a specific custom type to allow the 'news' property
    // while keeping core fields typed. Next.js MetadataRoute.Sitemap is an array of objects.
    const item = {
      url: `${siteUrl}/${post.category.slug}/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      images,
      // experimental/custom properties for Google News
      news: {
        title: post.title,
        publicationName: "Songhay.vn",
        publicationLanguage: "vi",
        date: post.publishedAt,
      }
    } as MetadataRoute.Sitemap[number] & { news: { title: string; publicationName: string; publicationLanguage: string; date: Date | null } }
    
    sitemapData.push(item)
  })

  return sitemapData
}
