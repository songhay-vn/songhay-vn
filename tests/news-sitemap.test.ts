import { beforeEach, describe, expect, mock, test } from "bun:test"

mock.module("next/server", () => ({
  after: (task: () => void | Promise<void>) => {
    void task()
  },
  connection: () => Promise.resolve(),
}))

process.env.NEXT_PUBLIC_SITE_URL = "https://songhay.vn"

const mockFindMany = mock()

mock.module("@/lib/prisma", () => ({
  prisma: {
    post: {
      findMany: mockFindMany,
    },
  },
}))

const { GET } = await import("../app/news-sitemap.xml/route")

describe("news sitemap route", () => {
  beforeEach(() => {
    mockFindMany.mockReset()
  })

  test("renders recent published posts as Google News sitemap XML", async () => {
    mockFindMany.mockResolvedValue([
      {
        title: 'A & B < "Tin nóng">',
        slug: "tin-nong",
        publishedAt: new Date("2026-06-10T01:02:03.000Z"),
        category: { slug: "thoi-su" },
      },
    ])

    const response = await GET()
    const xml = await response.text()

    expect(response.headers.get("content-type")).toContain("application/xml")
    expect(xml).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'
    )
    expect(xml).toContain(
      '<news:publication_date>2026-06-10T01:02:03.000Z</news:publication_date>'
    )
    expect(xml).toContain(
      "<news:title>A &amp; B &lt; &quot;Tin nóng&quot;&gt;</news:title>"
    )
    expect(xml).toContain("<loc>https://songhay.vn/thoi-su/tin-nong</loc>")

    const query = mockFindMany.mock.calls[0][0]
    expect(query.take).toBe(1000)
    expect(query.where).toMatchObject({
      isPublished: true,
      isDeleted: false,
    })
    expect(query.where.publishedAt.gte).toBeInstanceOf(Date)
  })
})
