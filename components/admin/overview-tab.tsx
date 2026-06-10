import type { LucideIcon } from "lucide-react"
import Link from "next/link"

import { OverviewActivityChart } from "@/components/admin/overview-activity-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type OverviewStat = {
  key: string
  label: string
  value: number
  note: string
  icon: LucideIcon
  tone: string
}

type OverviewAnalytics = {
  daily: Array<{
    label: string
    views: number
    comments: number
    posts: number
  }>
  range: "30d"
  hotSeoKeywords: Array<{
    id: string
    keyword: string
    trafficLabel: string
    trafficScore: number
    startedAt: string | null
    newsTitle: string | null
    newsSource: string | null
    newsUrl: string | null
    trendUrl: string
  }>
  hotSeoKeywordGeo: string
  hotSeoKeywordSourceUrl: string | null
  hotSeoKeywordError: string | null
  googleSeoSignals: {
    searchConsole: {
      sourceUrl: string | null
      startDate: string | null
      endDate: string | null
      error: string | null
      queries: Array<{
        id: string
        query: string
        clicks: number
        impressions: number
        ctr: number
        position: number
      }>
    }
    analytics: {
      propertyId: string | null
      error: string | null
      landingPages: Array<{
        id: string
        path: string
        title: string
        sessions: number
        activeUsers: number
        screenPageViews: number
        engagementRate: number
      }>
    }
    content: {
      propertyId: string | null
      error: string | null
      summary: {
        screenPageViews: number
        sessions: number
        activeUsers: number
        engagementRate: number
        averageSessionDuration: number
      }
      pages: Array<{
        id: string
        path: string
        title: string
        screenPageViews: number
        sessions: number
        activeUsers: number
        engagementRate: number
        averageSessionDuration: number
      }>
    }
  }
}

type OverviewTabProps = {
  overviewStats: OverviewStat[]
  overviewAnalytics: OverviewAnalytics
}

function formatTrendStartedAt(value: string | null) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  const time = date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  })
  const day = date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  })

  return `${time} ${day}`
}

function formatPercent(value: number) {
  return `${(value * 100).toLocaleString("vi-VN", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  })}%`
}

function formatPosition(value: number) {
  if (value <= 0) {
    return "-"
  }

  return value.toLocaleString("vi-VN", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  })
}

function formatDateRange(startDate: string | null, endDate: string | null) {
  if (!startDate || !endDate) {
    return null
  }

  return `${startDate} - ${endDate}`
}

function formatNumber(value: number) {
  return value.toLocaleString("vi-VN")
}

function formatDurationSeconds(value: number) {
  const seconds = Math.max(0, Math.round(value))
  if (seconds < 60) {
    return `${seconds}s`
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${String(remainingSeconds).padStart(2, "0")}s`
}

export function OverviewTab({
  overviewStats,
  overviewAnalytics,
}: OverviewTabProps) {
  const rangeLabel = "30 ngày"
  const searchQueries = overviewAnalytics.googleSeoSignals.searchConsole.queries
  const organicLandingPages =
    overviewAnalytics.googleSeoSignals.analytics.landingPages
  const ga4Content = overviewAnalytics.googleSeoSignals.content
  const searchConsoleRangeLabel = formatDateRange(
    overviewAnalytics.googleSeoSignals.searchConsole.startDate,
    overviewAnalytics.googleSeoSignals.searchConsole.endDate
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-3">
        <h2 className="text-2xl font-black text-zinc-950">Tổng quan</h2>
        <p className="text-sm text-muted-foreground">{rangeLabel}</p>
      </div>

      <div className="grid gap-px overflow-hidden rounded-md border bg-zinc-200 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {overviewStats.map((item) => {
          const ItemIcon = item.icon
          return (
            <div key={item.key} className="bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-muted-foreground">
                  {item.label}
                </p>
                <ItemIcon className={cn("size-4 shrink-0", item.tone)} />
              </div>
              <p className={cn("mt-2 text-3xl font-black", item.tone)}>
                {formatNumber(item.value)}
              </p>
            </div>
          )
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.75fr)]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-2">
            <CardTitle>Traffic</CardTitle>
            <span className="text-xs text-muted-foreground">
              view · comment · bài
            </span>
          </CardHeader>
          <CardContent>
            <OverviewActivityChart data={overviewAnalytics.daily} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-end justify-between gap-3 space-y-0 pb-2">
            <div>
              <CardTitle>GA4 Content</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {ga4Content.propertyId
                  ? `GA4 ${ga4Content.propertyId}`
                  : "GA_PROPERTY_ID"}
              </p>
            </div>
            <span className="text-3xl font-black text-emerald-700">
              {formatDurationSeconds(ga4Content.summary.averageSessionDuration)}
            </span>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-px overflow-hidden rounded-md border bg-zinc-200">
              <div className="bg-white p-3">
                <p className="text-xs text-muted-foreground">Views</p>
                <p className="mt-1 text-lg font-black">
                  {formatNumber(ga4Content.summary.screenPageViews)}
                </p>
              </div>
              <div className="bg-white p-3">
                <p className="text-xs text-muted-foreground">Sessions</p>
                <p className="mt-1 text-lg font-black">
                  {formatNumber(ga4Content.summary.sessions)}
                </p>
              </div>
              <div className="bg-white p-3">
                <p className="text-xs text-muted-foreground">Users</p>
                <p className="mt-1 text-lg font-black">
                  {formatNumber(ga4Content.summary.activeUsers)}
                </p>
              </div>
              <div className="bg-white p-3">
                <p className="text-xs text-muted-foreground">Engage</p>
                <p className="mt-1 text-lg font-black">
                  {formatPercent(ga4Content.summary.engagementRate)}
                </p>
              </div>
            </div>

            <div>
              <div className="overflow-x-auto">
                <div className="min-w-[520px]">
                  <div className="grid grid-cols-[minmax(0,1fr)_58px_66px_62px_68px] gap-3 border-b pb-2 text-xs font-medium text-muted-foreground">
                    <span>Page</span>
                    <span className="text-right">Views</span>
                    <span className="text-right">Sessions</span>
                    <span className="text-right">Avg</span>
                    <span className="text-right">Engage</span>
                  </div>
                  {ga4Content.pages.length === 0 ? (
                    <p className="py-3 text-sm text-muted-foreground">
                      {ga4Content.error ||
                        "Chưa có GA4 content page trong khoảng ngày này."}
                    </p>
                  ) : (
                    ga4Content.pages.map((item, index) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-[minmax(0,1fr)_58px_66px_62px_68px] gap-3 border-b py-2.5 last:border-b-0"
                      >
                        <div className="min-w-0">
                          <p className="line-clamp-1 text-sm font-medium">
                            {index + 1}. {item.title}
                          </p>
                          <p className="line-clamp-1 text-xs text-muted-foreground">
                            {item.path}
                          </p>
                        </div>
                        <span className="text-right text-sm text-zinc-700">
                          {formatNumber(item.screenPageViews)}
                        </span>
                        <span className="text-right text-sm text-muted-foreground">
                          {formatNumber(item.sessions)}
                        </span>
                        <span className="text-right text-sm text-muted-foreground">
                          {formatDurationSeconds(item.averageSessionDuration)}
                        </span>
                        <span className="text-right text-sm text-muted-foreground">
                          {formatPercent(item.engagementRate)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-2">
          <CardTitle>SEO</CardTitle>
          <span className="text-xs text-muted-foreground">
            {searchConsoleRangeLabel || rangeLabel}
          </span>
        </CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-3">
          <section>
            <div className="mb-2 flex items-center justify-between gap-3 border-b pb-2">
              <h3 className="text-sm font-semibold">
                Trends {overviewAnalytics.hotSeoKeywordGeo}
              </h3>
              {overviewAnalytics.hotSeoKeywordSourceUrl ? (
                <Link
                  href={overviewAnalytics.hotSeoKeywordSourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-muted-foreground hover:text-zinc-900"
                >
                  RSS
                </Link>
              ) : null}
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[430px]">
                <div className="grid grid-cols-[36px_minmax(0,1fr)_84px_104px] gap-3 border-b pb-2 text-xs font-medium text-muted-foreground">
                  <span>#</span>
                  <span>Từ khóa</span>
                  <span className="text-right">Traffic</span>
                  <span className="text-right">Time</span>
                </div>
                {overviewAnalytics.hotSeoKeywords.length === 0 ? (
                  <p className="py-3 text-sm text-muted-foreground">
                    Google Trends tạm thời chưa trả dữ liệu.
                  </p>
                ) : (
                  overviewAnalytics.hotSeoKeywords.map((item, index) => {
                    const startedAtLabel = formatTrendStartedAt(item.startedAt)

                    return (
                      <div
                        key={item.id}
                        className="grid grid-cols-[36px_minmax(0,1fr)_84px_104px] gap-3 border-b py-2.5 last:border-b-0"
                      >
                        <span className="text-sm text-muted-foreground tabular-nums">
                          {index + 1}
                        </span>
                        <Link
                          href={item.trendUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="line-clamp-1 text-sm font-medium hover:text-rose-600"
                        >
                          {item.keyword}
                        </Link>
                        <span className="text-right text-sm whitespace-nowrap text-zinc-700">
                          {item.trafficLabel ||
                            `${formatNumber(item.trafficScore)}+`}
                        </span>
                        <span className="text-right text-sm whitespace-nowrap text-muted-foreground tabular-nums">
                          {startedAtLabel || "-"}
                        </span>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between gap-3 border-b pb-2">
              <h3 className="text-sm font-semibold">Search Console</h3>
              {overviewAnalytics.googleSeoSignals.searchConsole.sourceUrl ? (
                <Link
                  href={
                    overviewAnalytics.googleSeoSignals.searchConsole.sourceUrl
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-muted-foreground hover:text-zinc-900"
                >
                  API
                </Link>
              ) : null}
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[430px]">
                <div className="grid grid-cols-[36px_minmax(0,1fr)_58px_58px_54px] gap-3 border-b pb-2 text-xs font-medium text-muted-foreground">
                  <span>#</span>
                  <span>Query</span>
                  <span className="text-right">Clicks</span>
                  <span className="text-right">CTR</span>
                  <span className="text-right">Pos</span>
                </div>
                {searchQueries.length === 0 ? (
                  <p className="py-3 text-sm text-muted-foreground">
                    {overviewAnalytics.googleSeoSignals.searchConsole.error ||
                      "Chưa có query Search Console trong khoảng ngày này."}
                  </p>
                ) : (
                  searchQueries.map((item, index) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[36px_minmax(0,1fr)_58px_58px_54px] gap-3 border-b py-2.5 last:border-b-0"
                    >
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {index + 1}
                      </span>
                      <span className="line-clamp-1 text-sm font-medium">
                        {item.query}
                      </span>
                      <span className="text-right text-sm text-zinc-700">
                        {formatNumber(item.clicks)}
                      </span>
                      <span className="text-right text-sm text-muted-foreground">
                        {formatPercent(item.ctr)}
                      </span>
                      <span className="text-right text-sm text-muted-foreground">
                        {formatPosition(item.position)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section>
            <div className="mb-2 border-b pb-2">
              <h3 className="text-sm font-semibold">Organic landing page</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {overviewAnalytics.googleSeoSignals.analytics.propertyId
                  ? `GA4 ${overviewAnalytics.googleSeoSignals.analytics.propertyId}`
                  : "GA_PROPERTY_ID"}
              </p>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[430px]">
                <div className="grid grid-cols-[minmax(0,1fr)_64px_58px_72px] gap-3 border-b pb-2 text-xs font-medium text-muted-foreground">
                  <span>Page</span>
                  <span className="text-right">Sessions</span>
                  <span className="text-right">Views</span>
                  <span className="text-right">Engage</span>
                </div>
                {organicLandingPages.length === 0 ? (
                  <p className="py-3 text-sm text-muted-foreground">
                    {overviewAnalytics.googleSeoSignals.analytics.error ||
                      "Chưa có organic landing page từ GA4."}
                  </p>
                ) : (
                  organicLandingPages.map((item, index) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[minmax(0,1fr)_64px_58px_72px] gap-3 border-b py-2.5 last:border-b-0"
                    >
                      <div className="min-w-0">
                        <p className="line-clamp-1 text-sm font-medium">
                          {index + 1}. {item.title}
                        </p>
                        <p className="line-clamp-1 text-xs text-muted-foreground">
                          {item.path}
                        </p>
                      </div>
                      <span className="text-right text-sm text-zinc-700">
                        {formatNumber(item.sessions)}
                      </span>
                      <span className="text-right text-sm text-muted-foreground">
                        {formatNumber(item.screenPageViews)}
                      </span>
                      <span className="text-right text-sm text-muted-foreground">
                        {formatPercent(item.engagementRate)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
