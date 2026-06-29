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
const GOOGLE_ANALYTICS_PAGE_VIEW_REVALIDATE_SECONDS = 6 * 60 * 60
const SEARCH_CONSOLE_DATA_LAG_DAYS = 3
const INTERNAL_ANALYTICS_PATH_PATTERN = "^/(admin|login)($|[/?].*)"

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

type GoogleAnalyticsBatchRunReportsResponse = {
  reports?: GoogleAnalyticsRunReportResponse[]
}

type GoogleAnalyticsStringFilterMatchType = "EXACT" | "FULL_REGEXP"

type GoogleAnalyticsFilterExpression = {
  andGroup?: {
    expressions: GoogleAnalyticsFilterExpression[]
  }
  orGroup?: {
    expressions: GoogleAnalyticsFilterExpression[]
  }
  notExpression?: GoogleAnalyticsFilterExpression
  filter?: {
    fieldName: string
    stringFilter: {
      matchType: GoogleAnalyticsStringFilterMatchType
      value: string
    }
  }
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

export type AnalyticsContentPageSignal = {
  id: string
  path: string
  title: string
  screenPageViews: number
  sessions: number
  activeUsers: number
  engagementRate: number
  averageSessionDuration: number
}

export type AnalyticsContentSummary = {
  screenPageViews: number
  sessions: number
  activeUsers: number
  engagementRate: number
  averageSessionDuration: number
}

export type AnalyticsContentSignalResult = {
  propertyId: string | null
  error: string | null
  summary: AnalyticsContentSummary
  pages: AnalyticsContentPageSignal[]
}

export type AnalyticsDailyPageView = {
  date: string
  screenPageViews: number
}

export type AnalyticsDailyPageViewResult = {
  propertyId: string | null
  error: string | null
  days: AnalyticsDailyPageView[]
}

export type AnalyticsPageViewCountResult = {
  propertyId: string | null
  path: string
  error: string | null
  screenPageViews: number
}

export type AnalyticsPageViewCountsResult = {
  propertyId: string | null
  error: string | null
  counts: Array<{
    path: string
    screenPageViews: number
  }>
}

const emptyAnalyticsContentSummary: AnalyticsContentSummary = {
  screenPageViews: 0,
  sessions: 0,
  activeUsers: 0,
  engagementRate: 0,
  averageSessionDuration: 0,
}

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10)
}

function toAnalyticsDateKey(value: string | undefined) {
  const raw = value?.trim() || ""
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
  }

  return raw
}

function normalizeAnalyticsPath(path: string) {
  const trimmedPath = path.trim()
  if (!trimmedPath) {
    return ""
  }

  try {
    const url = new URL(trimmedPath, "https://songhay.vn")
    return url.pathname.replace(/\/+$/, "") || "/"
  } catch {
    const [pathname = ""] = trimmedPath.split(/[?#]/)
    return pathname.replace(/\/+$/, "") || "/"
  }
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

function googleAnalyticsStringFilter(
  fieldName: string,
  matchType: GoogleAnalyticsStringFilterMatchType,
  value: string
): GoogleAnalyticsFilterExpression {
  return {
    filter: {
      fieldName,
      stringFilter: {
        matchType,
        value,
      },
    },
  }
}

function publicAnalyticsPathFilter(
  fieldName: string
): GoogleAnalyticsFilterExpression {
  return {
    notExpression: googleAnalyticsStringFilter(
      fieldName,
      "FULL_REGEXP",
      INTERNAL_ANALYTICS_PATH_PATTERN
    ),
  }
}

function escapeAnalyticsRegex(value: string) {
  return value.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&")
}

function analyticsPagePathFilter(path: string): GoogleAnalyticsFilterExpression {
  return googleAnalyticsStringFilter(
    "pagePathPlusQueryString",
    "FULL_REGEXP",
    `^${escapeAnalyticsRegex(path)}(\\?.*)?$`
  )
}

function organicSearchFilter(): GoogleAnalyticsFilterExpression {
  return googleAnalyticsStringFilter(
    "sessionDefaultChannelGroup",
    "EXACT",
    "Organic Search"
  )
}

function combineAnalyticsFilters(
  ...expressions: GoogleAnalyticsFilterExpression[]
): GoogleAnalyticsFilterExpression {
  return {
    andGroup: {
      expressions,
    },
  }
}

function combineAnyAnalyticsFilters(
  expressions: GoogleAnalyticsFilterExpression[]
): GoogleAnalyticsFilterExpression {
  return expressions.length === 1
    ? expressions[0]
    : {
        orGroup: {
          expressions,
        },
      }
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

export function mapAnalyticsContentRows(
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
        id: `ga-content:${encodeURIComponent(path)}:${index}`,
        path,
        title,
        screenPageViews: Math.round(toNumber(row.metricValues?.[0]?.value)),
        sessions: Math.round(toNumber(row.metricValues?.[1]?.value)),
        activeUsers: Math.round(toNumber(row.metricValues?.[2]?.value)),
        engagementRate: toNumber(row.metricValues?.[3]?.value),
        averageSessionDuration: toNumber(row.metricValues?.[4]?.value),
      }
    })
    .filter((item): item is AnalyticsContentPageSignal => Boolean(item))
    .slice(0, limit)
}

export function mapAnalyticsContentSummary(
  rows: GoogleAnalyticsRunReportRow[] | undefined
): AnalyticsContentSummary {
  const row = rows?.[0]
  if (!row) {
    return emptyAnalyticsContentSummary
  }

  return {
    screenPageViews: Math.round(toNumber(row.metricValues?.[0]?.value)),
    sessions: Math.round(toNumber(row.metricValues?.[1]?.value)),
    activeUsers: Math.round(toNumber(row.metricValues?.[2]?.value)),
    engagementRate: toNumber(row.metricValues?.[3]?.value),
    averageSessionDuration: toNumber(row.metricValues?.[4]?.value),
  }
}

export function mapAnalyticsDailyRows(
  rows: GoogleAnalyticsRunReportRow[] | undefined
) {
  return (rows || [])
    .map((row) => {
      const date = toAnalyticsDateKey(row.dimensionValues?.[0]?.value)
      if (!date) {
        return null
      }

      return {
        date,
        screenPageViews: Math.round(toNumber(row.metricValues?.[0]?.value)),
      }
    })
    .filter((item): item is AnalyticsDailyPageView => Boolean(item))
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
      signal: AbortSignal.timeout(10_000),
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
          dimensionFilter: combineAnalyticsFilters(
            organicSearchFilter(),
            publicAnalyticsPathFilter("landingPagePlusQueryString")
          ),
          limit: String(limit),
          orderBys: [
            {
              metric: { metricName: "sessions" },
              desc: true,
            },
          ],
        }),
        signal: AbortSignal.timeout(10_000),
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

export async function fetchAnalyticsContentSignals({
  days = 30,
  limit = 5,
}: {
  days?: number
  limit?: number
} = {}): Promise<AnalyticsContentSignalResult> {
  const propertyId = getGoogleAnalyticsPropertyId()

  if (!propertyId) {
    return {
      propertyId: null,
      error: "Missing GA_PROPERTY_ID",
      summary: emptyAnalyticsContentSummary,
      pages: [],
    }
  }

  if (!isGoogleServiceAccountConfigured()) {
    return {
      propertyId,
      error: "Missing GOOGLE_SERVICE_ACCOUNT_KEY_JSON_BASE64",
      summary: emptyAnalyticsContentSummary,
      pages: [],
    }
  }

  try {
    const accessToken = await getGoogleServiceAccountAccessToken([
      ANALYTICS_READONLY_SCOPE,
    ])
    const metrics = [
      { name: "screenPageViews" },
      { name: "sessions" },
      { name: "activeUsers" },
      { name: "engagementRate" },
      { name: "averageSessionDuration" },
    ]
    const dateRanges = [{ startDate: `${days}daysAgo`, endDate: "yesterday" }]
    const pathFilter = publicAnalyticsPathFilter("pagePathPlusQueryString")
    const response = await fetch(
      `${GA_DATA_API_BASE}/properties/${propertyId}:batchRunReports`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              dateRanges,
              dimensions: [
                { name: "pagePathPlusQueryString" },
                { name: "pageTitle" },
              ],
              metrics,
              dimensionFilter: pathFilter,
              limit: String(limit),
              orderBys: [
                {
                  metric: { metricName: "screenPageViews" },
                  desc: true,
                },
              ],
            },
            {
              dateRanges,
              metrics,
              dimensionFilter: pathFilter,
            },
          ],
        }),
        signal: AbortSignal.timeout(10_000),
        next: { revalidate: GOOGLE_API_REVALIDATE_SECONDS },
      }
    )

    const body =
      await readGoogleApiResponse<GoogleAnalyticsBatchRunReportsResponse>(
        response
      )

    return {
      propertyId,
      error: null,
      pages: mapAnalyticsContentRows(body.reports?.[0]?.rows, limit),
      summary: mapAnalyticsContentSummary(body.reports?.[1]?.rows),
    }
  } catch (error) {
    return {
      propertyId,
      error: getErrorMessage(error),
      summary: emptyAnalyticsContentSummary,
      pages: [],
    }
  }
}

export async function fetchAnalyticsPageViewCount({
  path,
  days = 30,
}: {
  path: string
  days?: number
}): Promise<AnalyticsPageViewCountResult> {
  const result = await fetchAnalyticsPageViewCounts({ paths: [path], days })
  const normalizedPath = normalizeAnalyticsPath(path)
  const count = result.counts.find((item) => item.path === normalizedPath)

  return {
    propertyId: result.propertyId,
    path: normalizedPath,
    error: result.error,
    screenPageViews: count?.screenPageViews || 0,
  }
}

export async function fetchAnalyticsPageViewCounts({
  paths,
  days = 30,
}: {
  paths: string[]
  days?: number
}): Promise<AnalyticsPageViewCountsResult> {
  const propertyId = getGoogleAnalyticsPropertyId()
  const normalizedPaths = [
    ...new Set(paths.map(normalizeAnalyticsPath).filter(Boolean)),
  ]

  if (normalizedPaths.length === 0) {
    return {
      propertyId,
      error: "Missing analytics page path",
      counts: [],
    }
  }

  if (!propertyId) {
    return {
      propertyId: null,
      error: "Missing GA_PROPERTY_ID",
      counts: normalizedPaths.map((path) => ({ path, screenPageViews: 0 })),
    }
  }

  if (!isGoogleServiceAccountConfigured()) {
    return {
      propertyId,
      error: "Missing GOOGLE_SERVICE_ACCOUNT_KEY_JSON_BASE64",
      counts: normalizedPaths.map((path) => ({ path, screenPageViews: 0 })),
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
          dimensions: [{ name: "pagePathPlusQueryString" }],
          metrics: [{ name: "screenPageViews" }],
          dimensionFilter: combineAnalyticsFilters(
            publicAnalyticsPathFilter("pagePathPlusQueryString"),
            combineAnyAnalyticsFilters(
              normalizedPaths.map((path) => analyticsPagePathFilter(path))
            )
          ),
          limit: String(Math.max(normalizedPaths.length * 5, normalizedPaths.length)),
        }),
        signal: AbortSignal.timeout(10_000),
        next: { revalidate: GOOGLE_ANALYTICS_PAGE_VIEW_REVALIDATE_SECONDS },
      }
    )

    const body =
      await readGoogleApiResponse<GoogleAnalyticsRunReportResponse>(response)
    const viewsByPath = new Map(normalizedPaths.map((path) => [path, 0]))

    for (const row of body.rows || []) {
      const rowPath = normalizeAnalyticsPath(row.dimensionValues?.[0]?.value || "")
      if (!viewsByPath.has(rowPath)) {
        continue
      }

      viewsByPath.set(
        rowPath,
        (viewsByPath.get(rowPath) || 0) +
          Math.round(toNumber(row.metricValues?.[0]?.value))
      )
    }

    return {
      propertyId,
      error: null,
      counts: normalizedPaths.map((path) => ({
        path,
        screenPageViews: viewsByPath.get(path) || 0,
      })),
    }
  } catch (error) {
    return {
      propertyId,
      error: getErrorMessage(error),
      counts: normalizedPaths.map((path) => ({ path, screenPageViews: 0 })),
    }
  }
}

export async function fetchAnalyticsDailyPageViews({
  days = 30,
}: {
  days?: number
} = {}): Promise<AnalyticsDailyPageViewResult> {
  const propertyId = getGoogleAnalyticsPropertyId()

  if (!propertyId) {
    return {
      propertyId: null,
      error: "Missing GA_PROPERTY_ID",
      days: [],
    }
  }

  if (!isGoogleServiceAccountConfigured()) {
    return {
      propertyId,
      error: "Missing GOOGLE_SERVICE_ACCOUNT_KEY_JSON_BASE64",
      days: [],
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
          dimensions: [{ name: "date" }],
          metrics: [{ name: "screenPageViews" }],
          dimensionFilter: publicAnalyticsPathFilter("pagePathPlusQueryString"),
          orderBys: [
            {
              dimension: { dimensionName: "date" },
              desc: false,
            },
          ],
          limit: String(days + 2),
        }),
        signal: AbortSignal.timeout(30_000),
        next: { revalidate: GOOGLE_API_REVALIDATE_SECONDS },
      }
    )

    const body =
      await readGoogleApiResponse<GoogleAnalyticsRunReportResponse>(response)

    return {
      propertyId,
      error: null,
      days: mapAnalyticsDailyRows(body.rows),
    }
  } catch (error) {
    return {
      propertyId,
      error: getErrorMessage(error),
      days: [],
    }
  }
}
