import { XMLParser } from "fast-xml-parser"

const DEFAULT_GOOGLE_TRENDS_GEO = "VN"
const GOOGLE_TRENDS_RSS_URL = "https://trends.google.com/trending/rss"
const GOOGLE_TRENDS_REVALIDATE_SECONDS = 30 * 60

type GoogleTrendsRssNewsItem = {
  "ht:news_item_title"?: string
  "ht:news_item_url"?: string
  "ht:news_item_source"?: string
}

type GoogleTrendsRssItem = {
  title?: string
  link?: string
  pubDate?: string
  "ht:approx_traffic"?: string
  "ht:news_item"?: GoogleTrendsRssNewsItem | GoogleTrendsRssNewsItem[]
}

type GoogleTrendsRssDocument = {
  rss?: {
    channel?: {
      item?: GoogleTrendsRssItem | GoogleTrendsRssItem[]
    }
  }
}

export type GoogleTrendKeyword = {
  id: string
  keyword: string
  trafficLabel: string
  trafficScore: number
  startedAt: string | null
  newsTitle: string | null
  newsSource: string | null
  newsUrl: string | null
  trendUrl: string
}

export type GoogleTrendKeywordResult = {
  geo: string
  sourceUrl: string
  error: string | null
  keywords: GoogleTrendKeyword[]
}

const parser = new XMLParser({
  ignoreAttributes: false,
  isArray: (_tagName, jPath) =>
    jPath === "rss.channel.item" || jPath === "rss.channel.item.ht:news_item",
  parseTagValue: false,
  processEntities: true,
  trimValues: true,
})

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return []
  }

  return Array.isArray(value) ? value : [value]
}

function normalizeTrendKey(keyword: string) {
  return keyword.trim().replace(/\s+/g, " ").toLocaleLowerCase("vi-VN")
}

function toTrendId(keyword: string, index: number) {
  return `google-trends:${encodeURIComponent(normalizeTrendKey(keyword))}:${index}`
}

function buildGoogleTrendsRssUrl(geo: string) {
  const url = new URL(GOOGLE_TRENDS_RSS_URL)
  url.searchParams.set("geo", geo)
  return url.toString()
}

function buildGoogleTrendsExploreUrl(keyword: string, geo: string) {
  const url = new URL("https://trends.google.com/trends/explore")
  url.searchParams.set("geo", geo)
  url.searchParams.set("q", keyword)
  return url.toString()
}

function toIsoDate(value: string | undefined) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function parseGoogleTrendsTraffic(value: string | undefined) {
  const label = value?.trim() || ""
  if (!label) {
    return 0
  }

  const compact = label.replace(/\s+/g, "").replace(/\+/g, "").toUpperCase()
  const suffix = compact.endsWith("K") ? "K" : compact.endsWith("M") ? "M" : ""
  const numberText = compact
    .replace(/[KM]$/i, "")
    .replace(suffix ? "," : /[,.]/g, suffix ? "." : "")
    .replace(/[^\d.]/g, "")

  const amount = Number.parseFloat(numberText)
  if (!Number.isFinite(amount)) {
    return 0
  }

  if (suffix === "M") {
    return Math.round(amount * 1_000_000)
  }

  if (suffix === "K") {
    return Math.round(amount * 1_000)
  }

  return Math.round(amount)
}

export function parseGoogleTrendsRss(
  xml: string,
  {
    geo = DEFAULT_GOOGLE_TRENDS_GEO,
    limit = 8,
  }: {
    geo?: string
    limit?: number
  } = {}
) {
  const parsed = parser.parse(xml) as GoogleTrendsRssDocument
  const items = asArray(parsed.rss?.channel?.item)
  const seen = new Set<string>()
  const keywords: GoogleTrendKeyword[] = []

  for (const item of items) {
    const keyword = item.title?.trim()
    if (!keyword) {
      continue
    }

    const normalized = normalizeTrendKey(keyword)
    if (seen.has(normalized)) {
      continue
    }

    seen.add(normalized)

    const newsItem = asArray(item["ht:news_item"])[0]
    const trafficLabel = item["ht:approx_traffic"]?.trim() || ""

    keywords.push({
      id: toTrendId(keyword, keywords.length),
      keyword,
      trafficLabel,
      trafficScore: parseGoogleTrendsTraffic(trafficLabel),
      startedAt: toIsoDate(item.pubDate),
      newsTitle: newsItem?.["ht:news_item_title"]?.trim() || null,
      newsSource: newsItem?.["ht:news_item_source"]?.trim() || null,
      newsUrl: newsItem?.["ht:news_item_url"]?.trim() || null,
      trendUrl: buildGoogleTrendsExploreUrl(keyword, geo),
    })

    if (keywords.length >= limit) {
      break
    }
  }

  return keywords
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown Google Trends error"
}

export async function fetchGoogleTrendKeywords({
  geo = process.env.GOOGLE_TRENDS_GEO || DEFAULT_GOOGLE_TRENDS_GEO,
  limit = 8,
}: {
  geo?: string
  limit?: number
} = {}): Promise<GoogleTrendKeywordResult> {
  const sourceUrl = buildGoogleTrendsRssUrl(geo)

  try {
    const response = await fetch(sourceUrl, {
      headers: {
        accept: "application/rss+xml, application/xml;q=0.9, text/xml;q=0.8",
        "user-agent": "songhay-vn-admin/1.0",
      },
      signal: AbortSignal.timeout(10_000),
      next: { revalidate: GOOGLE_TRENDS_REVALIDATE_SECONDS },
    })

    if (!response.ok) {
      throw new Error(`Google Trends RSS responded with ${response.status}`)
    }

    const xml = await response.text()

    return {
      geo,
      sourceUrl,
      error: null,
      keywords: parseGoogleTrendsRss(xml, { geo, limit }),
    }
  } catch (error) {
    return {
      geo,
      sourceUrl,
      error: getErrorMessage(error),
      keywords: [],
    }
  }
}
