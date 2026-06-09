import { connection } from "next/server"

import { prisma } from "@/lib/prisma"
import { getSiteUrl } from "@/lib/seo"

const NEWS_SITEMAP_LIMIT = 1000

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export async function GET() {
  await connection()

  const siteUrl = getSiteUrl()
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  const now = new Date()

  const posts = await prisma.post.findMany({
    where: {
      isPublished: true,
      isDeleted: false,
      publishedAt: {
        gte: twoDaysAgo,
      },
      OR: [{ scheduledPublishAt: null }, { scheduledPublishAt: { lte: now } }],
    },
    select: {
      title: true,
      slug: true,
      publishedAt: true,
      category: { select: { slug: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: NEWS_SITEMAP_LIMIT,
  })

  const urls = posts
    .map((post) => {
      const loc = `${siteUrl}/${post.category.slug}/${post.slug}`
      return [
        "  <url>",
        `    <loc>${escapeXml(loc)}</loc>`,
        "    <news:news>",
        "      <news:publication>",
        "        <news:name>Songhay.vn</news:name>",
        "        <news:language>vi</news:language>",
        "      </news:publication>",
        `      <news:publication_date>${post.publishedAt.toISOString()}</news:publication_date>`,
        `      <news:title>${escapeXml(post.title)}</news:title>`,
        "    </news:news>",
        "  </url>",
      ].join("\n")
    })
    .join("\n")

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">',
    urls,
    "</urlset>",
  ]
    .filter(Boolean)
    .join("\n")

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  })
}
