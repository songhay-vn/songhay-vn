import { memoizeWithTtl } from "@/lib/data-cache"
import { fetchAnalyticsPageViewCounts } from "@/lib/google-seo-signals"

const ADMIN_POST_VIEW_ANALYTICS_DAYS = 30
const ADMIN_POST_VIEW_CACHE_SECONDS = 30 * 60

type PostAnalyticsViewRow = {
  slug: string
  editorialStatus: string
  category: {
    slug: string
  }
}

function getPostAnalyticsPath(post: PostAnalyticsViewRow) {
  return `/${post.category.slug}/${post.slug}`
}

export async function attachAnalyticsViewsToPostRows<
  T extends PostAnalyticsViewRow,
>(rows: T[]): Promise<Array<T & { views?: number | null }>> {
  const publishedPaths = [
    ...new Set(
      rows
        .filter((post) => post.editorialStatus === "PUBLISHED")
        .map(getPostAnalyticsPath)
    ),
  ]

  if (publishedPaths.length === 0) {
    return rows
  }

  const analytics = await memoizeWithTtl(
    `admin:posts:ga4-views:${publishedPaths.sort().join("|")}`,
    ADMIN_POST_VIEW_CACHE_SECONDS,
    () =>
      fetchAnalyticsPageViewCounts({
        paths: publishedPaths,
        days: ADMIN_POST_VIEW_ANALYTICS_DAYS,
      })
  )
  const viewsByPath = new Map(
    analytics.error
      ? []
      : analytics.counts.map((item) => [item.path, item.screenPageViews])
  )

  return rows.map((post) => {
    if (post.editorialStatus !== "PUBLISHED") {
      return post
    }

    return {
      ...post,
      views: viewsByPath.get(getPostAnalyticsPath(post)) ?? null,
    }
  })
}
