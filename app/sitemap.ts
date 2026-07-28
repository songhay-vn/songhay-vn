import type { MetadataRoute } from "next"

import { prisma } from "@/lib/prisma"
import { getSiteUrl, toAbsoluteUrl } from "@/lib/seo"

export const revalidate = 21600
const staticContentLastModified = "2026-06-30T00:00:00.000Z"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const staticPages = [
    {
      url: `${siteUrl}/ve-chung-toi`,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
    {
      url: `${siteUrl}/chinh-sach-bao-mat`,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
    {
      url: `${siteUrl}/dieu-khoan-su-dung`,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
    {
      url: `${siteUrl}/mien-tru-trach-nhiem`,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
    {
      url: `${siteUrl}/tinh-tuoi-sinh-hoc`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
  ]

  const rawCategories = await prisma.category.findMany({
    select: {
      slug: true,
      updatedAt: true,
      posts: {
        where: {
          isPublished: true,
          isDeleted: false,
          AND: [
            {
              OR: [
                { scheduledPublishAt: null },
                { scheduledPublishAt: { lte: new Date() } },
              ],
            },
          ],
        },
        orderBy: { publishedAt: "desc" },
        take: 1,
        select: { publishedAt: true },
      },
    },
  })

  const categoriesData = rawCategories.map((cat) => ({
    slug: cat.slug,
    lastmod:
      cat.posts.length > 0
        ? cat.posts[0].publishedAt || cat.updatedAt
        : cat.updatedAt,
  }))

  const posts = await prisma.post.findMany({
    where: {
      isPublished: true,
      isDeleted: false,
      AND: [
        {
          OR: [
            { scheduledPublishAt: null },
            { scheduledPublishAt: { lte: new Date() } },
          ],
        },
      ],
    },
    select: {
      slug: true,
      updatedAt: true,
      thumbnailUrl: true,
      category: { select: { slug: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: 10000,
  })

  const products = await prisma.product.findMany({
    where: { isIndexed: true },
    select: {
      slug: true,
      updatedAt: true,
      imageUrl: true,
    },
    orderBy: { updatedAt: "desc" },
  })

  const sitemapData: MetadataRoute.Sitemap = []

  sitemapData.push({
    url: siteUrl,
    lastModified: staticContentLastModified,
    changeFrequency: "hourly",
    priority: 1,
  })

  sitemapData.push({
    url: `${siteUrl}/san-pham`,
    lastModified: products.length > 0 ? products[0].updatedAt : staticContentLastModified,
    changeFrequency: "daily" as const,
    priority: 0.8,
  })

  staticPages.forEach((item) => {
    sitemapData.push({
      url: item.url,
      lastModified: staticContentLastModified,
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

  products.forEach((product) => {
    const rawUrl = product.imageUrl ? toAbsoluteUrl(product.imageUrl) : null
    const cleanUrl = rawUrl ? rawUrl.split("?")[0] : null
    const images = cleanUrl ? [cleanUrl] : []

    sitemapData.push({
      url: `${siteUrl}/san-pham/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      images,
    })
  })

  posts.forEach((post) => {
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
