import { describe, expect, test } from "bun:test"

import {
  parseGoogleTrendsRss,
  parseGoogleTrendsTraffic,
} from "../lib/google-trends"

describe("Google Trends RSS helpers", () => {
  test("parses trend keywords with traffic and news metadata", () => {
    const keywords = parseGoogleTrendsRss(
      `<?xml version="1.0" encoding="UTF-8"?>
      <rss xmlns:ht="https://trends.google.com/trending/rss" version="2.0">
        <channel>
          <item>
            <title>lionel messi</title>
            <ht:approx_traffic>2000+</ht:approx_traffic>
            <pubDate>Tue, 9 Jun 2026 20:00:00 -0700</pubDate>
            <ht:news_item>
              <ht:news_item_title>World Cup &amp; Messi</ht:news_item_title>
              <ht:news_item_url>https://example.com/messi</ht:news_item_url>
              <ht:news_item_source>Example News</ht:news_item_source>
            </ht:news_item>
          </item>
          <item>
            <title>ptnk</title>
            <ht:approx_traffic>500+</ht:approx_traffic>
            <pubDate>Tue, 9 Jun 2026 19:00:00 -0700</pubDate>
          </item>
          <item>
            <title>Lionel Messi</title>
            <ht:approx_traffic>100+</ht:approx_traffic>
          </item>
        </channel>
      </rss>`,
      { geo: "VN", limit: 8 }
    )

    expect(keywords).toHaveLength(2)
    expect(keywords[0]).toMatchObject({
      keyword: "lionel messi",
      trafficLabel: "2000+",
      trafficScore: 2000,
      startedAt: "2026-06-10T03:00:00.000Z",
      newsTitle: "World Cup & Messi",
      newsSource: "Example News",
      newsUrl: "https://example.com/messi",
    })
    expect(keywords[0].trendUrl).toContain("geo=VN")
    expect(keywords[0].trendUrl).toContain("q=lionel+messi")
    expect(keywords[1].keyword).toBe("ptnk")
  })

  test("normalizes Google Trends traffic labels", () => {
    expect(parseGoogleTrendsTraffic("2,000+")).toBe(2000)
    expect(parseGoogleTrendsTraffic("10K+")).toBe(10000)
    expect(parseGoogleTrendsTraffic("1.5M+")).toBe(1500000)
    expect(parseGoogleTrendsTraffic("not available")).toBe(0)
  })
})
