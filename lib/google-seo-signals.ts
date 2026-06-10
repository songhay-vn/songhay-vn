import "server-only"

import {
  getGoogleServiceAccountAccessToken,
  isGoogleServiceAccountConfigured,
} from "@/lib/google-service-account"
import { getSearchConsoleSiteUrl } from "@/lib/search-console"

const SEARCH_CONSOLE_READONLY_SCOPE =
  "https://www.googleapis.com/auth/webmasters.readonly"
const ANALYTICS_READONLY_SCOPE =
  "https://www.googleapis.com/auth/analytics.readonly"
const SEARCH_CONSOLE_API_BASE = "https://www.googleapis.com/webmasters/v3/sites"
const GA_DATA_API_BASE = "https://analyticsdata.googleapis.com/v1beta"
const GOOGLE_API_REVALIDATE_SECONDS = 30 * 60
const SEARCH_CONSOLE_DATA_LAG_DAYS = 3

type SearchConsoleRow = {
  keys?: string[]
  clicks?: number
  impressions?: number
  ctr?: number
  position?: number
}

type SearchConsoleQueryResponse = {
  rows?: SearchConsoleRow[]
}

type GoogleAnalyticsRunReportRow = {
  dimensionValues?: Array<{ value?: string }>
  metricValues?: Array<{ value?: string }>
}

type GoogleAnalyticsRunReportResponse = {
  rows?: GoogleAnalyticsRunReportRow[]
}

export type SearchConsoleQuerySignal = {
  id: string
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export type SearchConsoleQuerySignalResult = {
  sourceUrl: string
  startDate: string
  endDate: string
  error: string | null
  queries: SearchConsoleQuerySignal[]
}

export type AnalyticsLandingPageSignal = {
  id: string
  path: string
  title: string
  sessions: number
  activeUsers: number
  screenPageViews: number
  engagementRate: number
}

export type AnalyticsLandingPageSignalResult = {
  propertyId: string | null
  error: string | null
  landingPages: AnalyticsLandingPageSignal[]
}

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function getSearchConsoleDateRange(days = 30) {
  const end = new Date()
  end.setDate(end.getDate() - SEARCH_CONSOLE_DATA_LAG_DAYS)
  const start = new Date(end)
  start.setDate(end.getDate() - (days - 1))

  return {
    startDate: toDateInput(start),
    endDate: toDateInput(end),
  }
}

function getErrorMessage(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Unknown Google API error"
  return message.slice(0, 500)
}

async function parseJsonSafely(response: Response) {
  const text = await response.text()
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

async function readGoogleApiResponse<T>(response: Response) {
  const body = await parseJsonSafely(response)
  if (response.ok) {
    return (body || {}) as T
  }

  const details = typeof body === "string" ? body : JSON.stringify(body)
  throw new Error(
    `Google API failed with ${response.status}${details ? `: ${details}` : ""}`
  )
}

function toNumber(value: string | number | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }

  const parsed = Number.parseFloat(value || "")
  return Number.isFinite(parsed) ? parsed : 0
}

function getGoogleAnalyticsPropertyId() {
  return (
    process.env.GA_PROPERTY_ID ||
    process.env.GOOGLE_ANALYTICS_PROPERTY_ID ||
    ""
  ).trim()
}

export function mapSearchConsoleRows(
  rows: SearchConsoleRow[] | undefined,
  limit: number
) {
  return (rows || [])
    .map((row, index) => {
      const query = row.keys?.[0]?.trim() || ""
      if (!query) {
        return null
      }

      return {
        id: `gsc-query:${encodeURIComponent(query)}:${index}`,
        query,
        clicks: Math.round(row.clicks || 0),
        impressions: Math.round(row.impressions || 0),
        ctr: row.ctr || 0,
        position: row.position || 0,
      }
    })
    .filter((item): item is SearchConsoleQuerySignal => Boolean(item))
    .slice(0, limit)
}

export function mapAnalyticsRows(
  rows: GoogleAnalyticsRunReportRow[] | undefined,
  limit: number
) {
  return (rows || [])
    .map((row, index) => {
      const path = row.dimensionValues?.[0]?.value?.trim() || ""
      if (!path || path === "(not set)") {
        return null
      }

      const title = row.dimensionValues?.[1]?.value?.trim() || path

      return {
        id: `ga-page:${encodeURIComponent(path)}:${index}`,
        path,
        title,
        sessions: Math.round(toNumber(row.metricValues?.[0]?.value)),
        activeUsers: Math.round(toNumber(row.metricValues?.[1]?.value)),
        screenPageViews: Math.round(toNumber(row.metricValues?.[2]?.value)),
        engagementRate: toNumber(row.metricValues?.[3]?.value),
      }
    })
    .filter((item): item is AnalyticsLandingPageSignal => Boolean(item))
    .slice(0, limit)
}

export async function fetchSearchConsoleQuerySignals({
  days = 30,
  limit = 5,
}: {
  days?: number
  limit?: number
} = {}): Promise<SearchConsoleQuerySignalResult> {
  const { startDate, endDate } = getSearchConsoleDateRange(days)
  const siteUrl = getSearchConsoleSiteUrl()
  const sourceUrl = `${SEARCH_CONSOLE_API_BASE}/${encodeURIComponent(
    siteUrl
  )}/searchAnalytics/query`

  if (!isGoogleServiceAccountConfigured()) {
    return {
      sourceUrl,
      startDate,
      endDate,
      error: "Missing GOOGLE_SERVICE_ACCOUNT_KEY_JSON_BASE64",
      queries: [],
    }
  }

  try {
    const accessToken = await getGoogleServiceAccountAccessToken([
      SEARCH_CONSOLE_READONLY_SCOPE,
    ])
    const response = await fetch(sourceUrl, {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ["query"],
        rowLimit: limit,
        searchType: "web",
      }),
      next: { revalidate: GOOGLE_API_REVALIDATE_SECONDS },
    })

    const body =
      await readGoogleApiResponse<SearchConsoleQueryResponse>(response)

    return {
      sourceUrl,
      startDate,
      endDate,
      error: null,
      queries: mapSearchConsoleRows(body.rows, limit),
    }
  } catch (error) {
    return {
      sourceUrl,
      startDate,
      endDate,
      error: getErrorMessage(error),
      queries: [],
    }
  }
}

export async function fetchAnalyticsLandingPageSignals({
  days = 30,
  limit = 5,
}: {
  days?: number
  limit?: number
} = {}): Promise<AnalyticsLandingPageSignalResult> {
  const propertyId = getGoogleAnalyticsPropertyId()

  if (!propertyId) {
    return {
      propertyId: null,
      error: "Missing GA_PROPERTY_ID",
      landingPages: [],
    }
  }

  if (!isGoogleServiceAccountConfigured()) {
    return {
      propertyId,
      error: "Missing GOOGLE_SERVICE_ACCOUNT_KEY_JSON_BASE64",
      landingPages: [],
    }
  }

  try {
    const accessToken = await getGoogleServiceAccountAccessToken([
      ANALYTICS_READONLY_SCOPE,
    ])
    const response = await fetch(
      `${GA_DATA_API_BASE}/properties/${propertyId}:runReport`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: `${days}daysAgo`, endDate: "yesterday" }],
          dimensions: [
            { name: "landingPagePlusQueryString" },
            { name: "pageTitle" },
          ],
          metrics: [
            { name: "sessions" },
            { name: "activeUsers" },
            { name: "screenPageViews" },
            { name: "engagementRate" },
          ],
          dimensionFilter: {
            filter: {
              fieldName: "sessionDefaultChannelGroup",
              stringFilter: {
                matchType: "EXACT",
                value: "Organic Search",
              },
            },
          },
          limit: String(limit),
          orderBys: [
            {
              metric: { metricName: "sessions" },
              desc: true,
            },
          ],
        }),
        next: { revalidate: GOOGLE_API_REVALIDATE_SECONDS },
      }
    )

    const body =
      await readGoogleApiResponse<GoogleAnalyticsRunReportResponse>(response)

    return {
      propertyId,
      error: null,
      landingPages: mapAnalyticsRows(body.rows, limit),
    }
  } catch (error) {
    return {
      propertyId,
      error: getErrorMessage(error),
      landingPages: [],
    }
  }
}
