import "server-only"

import { JWT } from "google-auth-library"

const WEBMASTERS_SCOPE = "https://www.googleapis.com/auth/webmasters"
const URL_INSPECTION_ENDPOINT =
  "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect"
const SITEMAPS_ENDPOINT = "https://www.googleapis.com/webmasters/v3/sites"

export type GoogleServiceAccountKey = {
  client_email: string
  private_key: string
}

export type UrlInspectionRequestBody = {
  inspectionUrl: string
  siteUrl: string
  languageCode: string
}

export type SearchConsoleIndexStatusResult = {
  sitemap?: string[]
  referringUrls?: string[]
  verdict?: string
  coverageState?: string
  robotsTxtState?: string
  indexingState?: string
  lastCrawlTime?: string
  pageFetchState?: string
  googleCanonical?: string
  userCanonical?: string
  crawledAs?: string
}

export type SearchConsoleInspectionResult = {
  inspectionResultLink?: string
  indexStatusResult?: SearchConsoleIndexStatusResult
  richResultsResult?: {
    verdict?: string
    detectedItems?: unknown[]
  }
}

export type SearchConsoleInspectResponse = {
  inspectionResult?: SearchConsoleInspectionResult
}

export class SearchConsoleConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SearchConsoleConfigError"
  }
}

export class SearchConsoleApiError extends Error {
  status: number
  retryable: boolean
  details: unknown

  constructor({
    message,
    status,
    retryable,
    details,
  }: {
    message: string
    status: number
    retryable: boolean
    details: unknown
  }) {
    super(message)
    this.name = "SearchConsoleApiError"
    this.status = status
    this.retryable = retryable
    this.details = details
  }
}

let cachedJwtClient: JWT | null = null

export function getSearchConsoleSiteUrl() {
  return process.env.GSC_SITE_URL || "https://songhay.vn/"
}

export function getSearchConsoleSitemapUrl() {
  return process.env.GSC_SITEMAP_URL || "https://songhay.vn/sitemap.xml"
}

export function getSearchConsoleNewsSitemapUrl() {
  return (
    process.env.GSC_NEWS_SITEMAP_URL ||
    "https://songhay.vn/news-sitemap.xml"
  )
}

export function getDailyInspectionSoftLimit() {
  const parsed = Number.parseInt(
    process.env.GSC_DAILY_INSPECTION_SOFT_LIMIT || "1800",
    10
  )
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1800
}

export function isSearchConsoleConfigured() {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON_BASE64)
}

export function parseGoogleServiceAccountKey(
  encodedOrJson: string
): GoogleServiceAccountKey {
  const value = encodedOrJson.trim()
  if (!value) {
    throw new SearchConsoleConfigError(
      "GOOGLE_SERVICE_ACCOUNT_KEY_JSON_BASE64 is empty"
    )
  }

  const jsonText = value.startsWith("{")
    ? value
    : Buffer.from(value, "base64").toString("utf8")

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new SearchConsoleConfigError(
      "GOOGLE_SERVICE_ACCOUNT_KEY_JSON_BASE64 is not valid service account JSON"
    )
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !("client_email" in parsed) ||
    !("private_key" in parsed) ||
    typeof parsed.client_email !== "string" ||
    typeof parsed.private_key !== "string"
  ) {
    throw new SearchConsoleConfigError(
      "Google service account JSON must include client_email and private_key"
    )
  }

  return {
    client_email: parsed.client_email,
    private_key: parsed.private_key,
  }
}

export function buildUrlInspectionRequestBody(
  inspectionUrl: string,
  siteUrl = getSearchConsoleSiteUrl(),
  languageCode = "vi-VN"
): UrlInspectionRequestBody {
  return {
    inspectionUrl,
    siteUrl,
    languageCode,
  }
}

function getServiceAccountKeyFromEnv() {
  const encoded = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON_BASE64
  if (!encoded) {
    throw new SearchConsoleConfigError(
      "Missing GOOGLE_SERVICE_ACCOUNT_KEY_JSON_BASE64"
    )
  }
  return parseGoogleServiceAccountKey(encoded)
}

function getJwtClient() {
  if (cachedJwtClient) {
    return cachedJwtClient
  }

  const key = getServiceAccountKeyFromEnv()
  cachedJwtClient = new JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: [WEBMASTERS_SCOPE],
  })
  return cachedJwtClient
}

async function getAccessToken() {
  const tokenResponse = await getJwtClient().getAccessToken()
  if (!tokenResponse.token) {
    throw new SearchConsoleConfigError(
      "Google service account did not return an access token"
    )
  }
  return tokenResponse.token
}

async function parseJsonSafely(response: Response) {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function isRetryableStatus(status: number) {
  return status === 429 || status >= 500
}

async function handleSearchConsoleResponse<T>(response: Response): Promise<T> {
  const body = await parseJsonSafely(response)
  if (response.ok) {
    return (body || {}) as T
  }

  throw new SearchConsoleApiError({
    message: `Google Search Console API failed with ${response.status}`,
    status: response.status,
    retryable: isRetryableStatus(response.status),
    details: body,
  })
}

export async function inspectUrl(
  inspectionUrl: string
): Promise<SearchConsoleInspectResponse> {
  const accessToken = await getAccessToken()
  const response = await fetch(URL_INSPECTION_ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(buildUrlInspectionRequestBody(inspectionUrl)),
  })

  return handleSearchConsoleResponse<SearchConsoleInspectResponse>(response)
}

export async function submitSitemap(sitemapUrl: string) {
  const accessToken = await getAccessToken()
  const siteUrl = encodeURIComponent(getSearchConsoleSiteUrl())
  const feedPath = encodeURIComponent(sitemapUrl)
  const response = await fetch(`${SITEMAPS_ENDPOINT}/${siteUrl}/sitemaps/${feedPath}`, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  })

  return handleSearchConsoleResponse<Record<string, never>>(response)
}
