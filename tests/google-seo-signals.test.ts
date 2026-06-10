import { describe, expect, mock, test } from "bun:test"

mock.module("server-only", () => ({}))

const { mapAnalyticsRows, mapSearchConsoleRows } =
  await import("../lib/google-seo-signals")

describe("Google SEO signal helpers", () => {
  test("maps Search Console query rows", () => {
    const rows = mapSearchConsoleRows(
      [
        {
          keys: ["tin hot hôm nay"],
          clicks: 12.4,
          impressions: 240.8,
          ctr: 0.051,
          position: 8.7,
        },
        {
          keys: [""],
          clicks: 20,
          impressions: 300,
          ctr: 0.06,
          position: 6,
        },
      ],
      5
    )

    expect(rows).toEqual([
      {
        id: "gsc-query:tin%20hot%20h%C3%B4m%20nay:0",
        query: "tin hot hôm nay",
        clicks: 12,
        impressions: 241,
        ctr: 0.051,
        position: 8.7,
      },
    ])
  })

  test("maps GA4 organic landing page rows", () => {
    const rows = mapAnalyticsRows(
      [
        {
          dimensionValues: [
            { value: "/thoi-su/bai-moi" },
            { value: "Bài mới" },
          ],
          metricValues: [
            { value: "42" },
            { value: "31" },
            { value: "55" },
            { value: "0.73" },
          ],
        },
        {
          dimensionValues: [{ value: "(not set)" }, { value: "Ignored" }],
          metricValues: [{ value: "99" }],
        },
      ],
      5
    )

    expect(rows).toEqual([
      {
        id: "ga-page:%2Fthoi-su%2Fbai-moi:0",
        path: "/thoi-su/bai-moi",
        title: "Bài mới",
        sessions: 42,
        activeUsers: 31,
        screenPageViews: 55,
        engagementRate: 0.73,
      },
    ])
  })
})
