import { beforeEach, describe, expect, mock, test } from "bun:test"

mock.module("server-only", () => ({}))
mock.module("next/server", () => ({
  after: (task: () => void | Promise<void>) => {
    void task()
  },
  connection: () => Promise.resolve(),
}))

process.env.NEXT_PUBLIC_SITE_URL = "https://songhay.vn"

const mockCreate = mock()
const mockAggregate = mock()
const mockFindFirst = mock()
const mockUpdate = mock()
const mockUpsert = mock()

mock.module("@/lib/prisma", () => ({
  prisma: {
    searchConsoleJob: {
      create: mockCreate,
      upsert: mockUpsert,
      aggregate: mockAggregate,
      findFirst: mockFindFirst,
      update: mockUpdate,
    },
    searchConsoleUrlStatus: {
      upsert: mockUpsert,
    },
  },
}))

class MockSearchConsoleApiError extends Error {
  status: number
  retryable: boolean
  details: unknown

  constructor(status: number, retryable: boolean, details: unknown) {
    super(`Google Search Console API failed with ${status}`)
    this.status = status
    this.retryable = retryable
    this.details = details
  }
}

const mockInspectUrl = mock()
const mockSubmitSitemap = mock()
const mockIsConfigured = mock(() => true)

mock.module("@/lib/search-console", () => ({
  buildUrlInspectionRequestBody: (
    inspectionUrl: string,
    siteUrl = "https://songhay.vn/",
    languageCode = "vi-VN"
  ) => ({
    inspectionUrl,
    siteUrl,
    languageCode,
  }),
  getDailyInspectionSoftLimit: () => 1800,
  getSearchConsoleNewsSitemapUrl: () => "https://songhay.vn/news-sitemap.xml",
  getSearchConsoleSitemapUrl: () => "https://songhay.vn/sitemap.xml",
  inspectUrl: mockInspectUrl,
  isSearchConsoleConfigured: mockIsConfigured,
  parseGoogleServiceAccountKey: (encodedOrJson: string) => {
    const trimmed = encodedOrJson.trim()
    const text = trimmed.startsWith("{")
      ? trimmed
      : Buffer.from(trimmed, "base64").toString("utf8")
    const parsed = JSON.parse(text)

    return {
      client_email: parsed.client_email,
      private_key: parsed.private_key,
    }
  },
  SearchConsoleApiError: MockSearchConsoleApiError,
  submitSitemap: mockSubmitSitemap,
}))

const {
  drainSearchConsoleJobs,
  enqueuePublishedPostSearchConsoleJobs,
  enqueueRemovedPostSearchConsoleJobs,
} = await import("../lib/search-console-queue")

describe("search console queue", () => {
  beforeEach(() => {
    mockCreate.mockReset()
    mockAggregate.mockReset()
    mockFindFirst.mockReset()
    mockUpdate.mockReset()
    mockUpsert.mockReset()
    mockInspectUrl.mockReset()
    mockSubmitSitemap.mockReset()
    mockIsConfigured.mockReset()
    mockIsConfigured.mockReturnValue(true)
  })

  test("enqueues URL inspection and news sitemap submit jobs with dedupe keys", async () => {
    mockUpsert.mockResolvedValue({})

    await enqueuePublishedPostSearchConsoleJobs({
      postId: "post-1",
      categorySlug: "thoi-su",
      slug: "tin-moi",
    })

    expect(mockUpsert).toHaveBeenCalledTimes(2)
    expect(mockUpsert.mock.calls[0][0].create).toMatchObject({
      type: "URL_INSPECTION",
      postId: "post-1",
      url: "https://songhay.vn/thoi-su/tin-moi",
      dedupeKey: "URL_INSPECTION:post-1:https://songhay.vn/thoi-su/tin-moi",
    })
    expect(mockUpsert.mock.calls[1][0].create).toMatchObject({
      type: "SITEMAP_SUBMIT",
      url: "https://songhay.vn/news-sitemap.xml",
    })
    expect(
      mockUpsert.mock.calls[1][0].create.dedupeKey.startsWith(
        "SITEMAP_SUBMIT:https://songhay.vn/news-sitemap.xml:"
      )
    ).toBe(true)
  })

  test("enqueues standard and news sitemap submits for removed posts", async () => {
    mockUpsert.mockResolvedValue({})

    await enqueueRemovedPostSearchConsoleJobs()

    expect(mockUpsert).toHaveBeenCalledTimes(2)
    expect(mockUpsert.mock.calls[0][0].create).toMatchObject({
      type: "SITEMAP_SUBMIT",
      url: "https://songhay.vn/sitemap.xml",
    })
    expect(mockUpsert.mock.calls[1][0].create).toMatchObject({
      type: "SITEMAP_SUBMIT",
      url: "https://songhay.vn/news-sitemap.xml",
    })
  })

  test("does not inspect URLs after the daily soft limit is reached", async () => {
    mockAggregate.mockResolvedValue({ _sum: { attempts: 1800 } })
    mockFindFirst.mockResolvedValue({
      id: "job-1",
      type: "URL_INSPECTION",
      attempts: 0,
    })

    const result = await drainSearchConsoleJobs(1)

    expect(result).toMatchObject({ processed: 0, inspectionUsage: 1800, softLimit: 1800 })
    expect(mockUpdate).not.toHaveBeenCalled()
    expect(mockInspectUrl).not.toHaveBeenCalled()
  })

  test("requeues retryable Google API failures with backoff", async () => {
    mockAggregate.mockResolvedValue({ _sum: { attempts: 0 } })
    mockFindFirst.mockResolvedValue({
      id: "job-1",
      type: "URL_INSPECTION",
      attempts: 0,
      url: "https://songhay.vn/thoi-su/tin-moi",
      postId: "post-1",
    })
    mockUpdate.mockResolvedValueOnce({
      id: "job-1",
      type: "URL_INSPECTION",
      attempts: 1,
      url: "https://songhay.vn/thoi-su/tin-moi",
      postId: "post-1",
    })
    mockInspectUrl.mockRejectedValue(
      new MockSearchConsoleApiError(429, true, { error: "quota exceeded" })
    )

    const result = await drainSearchConsoleJobs(1)

    expect(result).toMatchObject({ inspectionUsage: 1 })
    expect(mockUpdate).toHaveBeenCalledTimes(2)
    expect(mockUpdate.mock.calls[1][0].data).toMatchObject({
      status: "PENDING",
    })
    expect(mockUpdate.mock.calls[1][0].data.runAfter).toBeInstanceOf(Date)
  })

  test("leaves queued jobs untouched when credentials are not configured", async () => {
    mockIsConfigured.mockReturnValue(false)

    const result = await drainSearchConsoleJobs(1)

    expect(result).toEqual({ processed: 0, skipped: "not_configured" })
    expect(mockFindFirst).not.toHaveBeenCalled()
  })
})
